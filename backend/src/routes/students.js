import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { requireAdminOrBrigadeLead, requireAdmin } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Get all students (Admin) or brigade students (Brigade Lead)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, brigadeId } = req.query;
    const skip = (page - 1) * limit;

    let whereClause = {};

    // Role-based filtering
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      whereClause.brigadeId = { in: brigades.map(b => b.id) };
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { tempRollNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Brigade filter
    if (brigadeId) {
      whereClause.brigadeId = brigadeId;
    }

    whereClause.isActive = true;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        include: {
          brigade: true,
          user: {
            select: { id: true, email: true, isActive: true, lastLogin: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where: whereClause })
    ]);

    res.json({
      students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        brigade: true,
        user: {
          select: { id: true, email: true, isActive: true, lastLogin: true, createdAt: true }
        },
        attendanceRecords: {
          include: {
            eventDay: {
              include: {
                event: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check permissions for brigade leads
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      if (!brigadeIds.includes(student.brigadeId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(student);
  } catch (error) {
    logger.error('Get student error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create student
router.post('/', requireAdminOrBrigadeLead, [
  body('tempRollNumber').isLength({ min: 1 }).withMessage('Roll number is required'),
  body('firstName').isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').optional().isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tempRollNumber, firstName, lastName, email, phone, brigadeId, createUserAccount } = req.body;

    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { tempRollNumber }
    });

    if (existingStudent) {
      return res.status(400).json({ error: 'Student with this roll number already exists' });
    }

    // Validate brigade access for brigade leads
    if (req.user.role === 'BRIGADE_LEAD' && brigadeId) {
      const brigade = await prisma.brigade.findFirst({
        where: { id: brigadeId, leaderId: req.user.id }
      });
      
      if (!brigade) {
        return res.status(403).json({ error: 'Access denied to this brigade' });
      }
    }

    let userId = null;
    
    // Create user account if requested
    if (createUserAccount && email) {
      const defaultPassword = await bcrypt.hash('student123', 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: defaultPassword,
          role: 'STUDENT',
          firstName,
          lastName
        }
      });
      userId = user.id;
    }

    const student = await prisma.student.create({
      data: {
        tempRollNumber,
        firstName,
        lastName,
        email,
        phone,
        brigadeId,
        userId
      },
      include: {
        brigade: true,
        user: {
          select: { id: true, email: true, isActive: true }
        }
      }
    });

    logger.info(`Student created: ${tempRollNumber} by ${req.user.email}`);
    res.status(201).json(student);
  } catch (error) {
    logger.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/:id', requireAdminOrBrigadeLead, [
  body('firstName').optional().isLength({ min: 1 }),
  body('lastName').optional().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if student exists and get permissions
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { brigade: true }
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check permissions for brigade leads
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      if (!brigadeIds.includes(existingStudent.brigadeId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        brigade: true,
        user: {
          select: { id: true, email: true, isActive: true }
        }
      }
    });

    logger.info(`Student updated: ${student.tempRollNumber} by ${req.user.email}`);
    res.json(student);
  } catch (error) {
    logger.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Soft delete
    await prisma.student.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`Student deleted: ${student.tempRollNumber} by ${req.user.email}`);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    logger.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Get student attendance summary
router.get('/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check permissions for brigade leads
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      if (!brigadeIds.includes(student.brigadeId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: id },
      include: {
        eventDay: {
          include: {
            event: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
    const totalSessions = attendanceRecords.length;
    const presentSessions = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absentSessions = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const lateSessions = attendanceRecords.filter(r => r.status === 'LATE').length;
    const attendancePercentage = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

    res.json({
      records: attendanceRecords,
      statistics: {
        totalSessions,
        presentSessions,
        absentSessions,
        lateSessions,
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2))
      }
    });
  } catch (error) {
    logger.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

export default router;