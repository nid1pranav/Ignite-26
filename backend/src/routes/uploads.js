import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { requireAdminOrBrigadeLead } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// Upload students file
router.post('/students', requireAdminOrBrigadeLead, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { brigadeId, createUserAccounts = false } = req.body;

    // Validate brigade access for brigade leads
    if (req.user.role === 'BRIGADE_LEAD') {
      if (!brigadeId) {
        return res.status(400).json({ error: 'Brigade ID is required for brigade leads' });
      }
      
      const brigade = await prisma.brigade.findFirst({
        where: { id: brigadeId, leaderId: req.user.id }
      });
      
      if (!brigade) {
        return res.status(403).json({ error: 'Access denied to this brigade' });
      }
    }

    // Parse the file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'File is empty or invalid format' });
    }

    // Validate required columns
    const requiredColumns = ['tempRollNumber', 'firstName', 'lastName'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => 
      !Object.keys(firstRow).some(key => 
        key.toLowerCase().replace(/[^a-z]/g, '') === col.toLowerCase().replace(/[^a-z]/g, '')
      )
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}. Required columns are: Temp Roll Number, First Name, Last Name` 
      });
    }

    // Process students data
    const studentsData = [];
    const errors = [];
    const duplicateRollNumbers = new Set();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      try {
        // Find column values (case-insensitive)
        const getTempRollNumber = () => {
          const keys = Object.keys(row);
          const rollKey = keys.find(key => 
            key.toLowerCase().replace(/[^a-z]/g, '').includes('temproll') ||
            key.toLowerCase().replace(/[^a-z]/g, '').includes('rollnumber') ||
            key.toLowerCase().replace(/[^a-z]/g, '').includes('roll')
          );
          return rollKey ? String(row[rollKey]).trim() : '';
        };

        const getFirstName = () => {
          const keys = Object.keys(row);
          const nameKey = keys.find(key => 
            key.toLowerCase().replace(/[^a-z]/g, '').includes('firstname') ||
            key.toLowerCase().replace(/[^a-z]/g, '').includes('first')
          );
          return nameKey ? String(row[nameKey]).trim() : '';
        };

        const getLastName = () => {
          const keys = Object.keys(row);
          const nameKey = keys.find(key => 
            key.toLowerCase().replace(/[^a-z]/g, '').includes('lastname') ||
            key.toLowerCase().replace(/[^a-z]/g, '').includes('last')
          );
          return nameKey ? String(row[nameKey]).trim() : '';
        };

        const getEmail = () => {
          const keys = Object.keys(row);
          const emailKey = keys.find(key => 
            key.toLowerCase().includes('email') ||
            key.toLowerCase().includes('mail')
          );
          return emailKey ? String(row[emailKey]).trim() : '';
        };

        const getPhone = () => {
          const keys = Object.keys(row);
          const phoneKey = keys.find(key => 
            key.toLowerCase().includes('phone') ||
            key.toLowerCase().includes('mobile') ||
            key.toLowerCase().includes('contact')
          );
          return phoneKey ? String(row[phoneKey]).trim() : '';
        };

        const tempRollNumber = getTempRollNumber();
        const firstName = getFirstName();
        const lastName = getLastName();
        const email = getEmail();
        const phone = getPhone();

        // Validation
        if (!tempRollNumber) {
          errors.push(`Row ${rowNum}: Temp Roll Number is required`);
          continue;
        }

        if (!firstName) {
          errors.push(`Row ${rowNum}: First Name is required`);
          continue;
        }

        if (!lastName) {
          errors.push(`Row ${rowNum}: Last Name is required`);
          continue;
        }

        // Check for duplicates in file
        if (duplicateRollNumbers.has(tempRollNumber)) {
          errors.push(`Row ${rowNum}: Duplicate roll number ${tempRollNumber} in file`);
          continue;
        }
        duplicateRollNumbers.add(tempRollNumber);

        // Email validation if provided
        if (email && !email.includes('@')) {
          errors.push(`Row ${rowNum}: Invalid email format`);
          continue;
        }

        studentsData.push({
          tempRollNumber,
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          brigadeId: brigadeId || null,
          rowNum
        });

      } catch (error) {
        errors.push(`Row ${rowNum}: Error processing row - ${error.message}`);
      }
    }

    if (errors.length > 0 && studentsData.length === 0) {
      return res.status(400).json({ 
        error: 'File contains errors and no valid data found',
        details: errors
      });
    }

    // Check for existing roll numbers in database
    const existingRollNumbers = await prisma.student.findMany({
      where: {
        tempRollNumber: { in: studentsData.map(s => s.tempRollNumber) }
      },
      select: { tempRollNumber: true }
    });

    const existingRollNumbersSet = new Set(existingRollNumbers.map(s => s.tempRollNumber));
    const validStudentsData = studentsData.filter(student => {
      if (existingRollNumbersSet.has(student.tempRollNumber)) {
        errors.push(`Row ${student.rowNum}: Roll number ${student.tempRollNumber} already exists`);
        return false;
      }
      return true;
    });

    if (validStudentsData.length === 0) {
      return res.status(400).json({ 
        error: 'No valid students to import after validation',
        details: errors
      });
    }

    // Create students in transaction
    const results = await prisma.$transaction(async (prisma) => {
      const createdStudents = [];
      const defaultPassword = await bcrypt.hash('student123', 10);

      for (const studentData of validStudentsData) {
        let userId = null;

        // Create user account if requested and email provided
        if (createUserAccounts === 'true' && studentData.email) {
          try {
            const user = await prisma.user.create({
              data: {
                email: studentData.email,
                password: defaultPassword,
                role: 'STUDENT',
                firstName: studentData.firstName,
                lastName: studentData.lastName
              }
            });
            userId = user.id;
          } catch (userError) {
            // If user creation fails, still create student without user account
            logger.warn(`Failed to create user account for ${studentData.tempRollNumber}: ${userError.message}`);
          }
        }

        const student = await prisma.student.create({
          data: {
            tempRollNumber: studentData.tempRollNumber,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            email: studentData.email,
            phone: studentData.phone,
            brigadeId: studentData.brigadeId,
            userId
          }
        });

        createdStudents.push(student);
      }

      return createdStudents;
    });

    logger.info(`Bulk student import: ${results.length} students created by ${req.user.email}`);

    res.json({
      message: `Successfully imported ${results.length} students`,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined,
      students: results
    });

  } catch (error) {
    logger.error('Upload students error:', error);
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// Download sample template
router.get('/template/students', (req, res) => {
  try {
    // Create sample data
    const sampleData = [
      {
        'Temp Roll Number': 'IG2026001',
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone': '+91 9876543210'
      },
      {
        'Temp Roll Number': 'IG2026002',
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@example.com',
        'Phone': '+91 9876543211'
      }
    ];

    // Create workbook
    const ws = xlsx.utils.json_to_sheet(sampleData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Students');

    // Set column widths
    ws['!cols'] = [
      { width: 20 }, // Temp Roll Number
      { width: 15 }, // First Name
      { width: 15 }, // Last Name
      { width: 25 }, // Email
      { width: 15 }  // Phone
    ];

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=students_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    logger.error('Download template error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

export default router;