import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { requireAdmin, requireAdminOrBrigadeLead } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all brigades
router.get('/', async (req, res) => {
  try {
    let whereClause = { isActive: true };

    // Brigade leads can only see their own brigades
    if (req.user.role === 'BRIGADE_LEAD') {
      whereClause.leaderId = req.user.id;
    }

    const brigades = await prisma.brigade.findMany({
      where: whereClause,
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        students: {
          where: { isActive: true },
          select: { id: true, tempRollNumber: true, firstName: true, lastName: true }
        },
        _count: {
          select: { students: { where: { isActive: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(brigades);
  } catch (error) {
    logger.error('Get brigades error:', error);
    res.status(500).json({ error: 'Failed to fetch brigades' });
  }
});

// Get single brigade
router.get('/:id', requireAdminOrBrigadeLead, async (req, res) => {
  try {
    const { id } = req.params;

    const brigade = await prisma.brigade.findUnique({
      where: { id },
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        students: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, email: true, isActive: true, lastLogin: true }
            }
          },
          orderBy: { tempRollNumber: 'asc' }
        }
      }
    });

    if (!brigade) {
      return res.status(404).json({ error: 'Brigade not found' });
    }

    // Check permission for brigade leads
    if (req.user.role === 'BRIGADE_LEAD' && brigade.leaderId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(brigade);
  } catch (error) {
    logger.error('Get brigade error:', error);
    res.status(500).json({ error: 'Failed to fetch brigade' });
  }
});

// Create brigade (Admin only)
router.post('/', requireAdmin, [
  body('name').isLength({ min: 1 }).withMessage('Brigade name is required'),
  body('leaderId').optional().isLength({ min: 1 }).withMessage('Invalid leader ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, leaderId } = req.body;

    // Check if brigade name already exists
    const existingBrigade = await prisma.brigade.findUnique({
      where: { name }
    });

    if (existingBrigade) {
      return res.status(400).json({ error: 'Brigade with this name already exists' });
    }

    // Validate leader if provided
    if (leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: leaderId, role: 'BRIGADE_LEAD', isActive: true }
      });

      if (!leader) {
        return res.status(400).json({ error: 'Invalid brigade leader' });
      }
    }

    const brigade = await prisma.brigade.create({
      data: { name, leaderId },
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        _count: {
          select: { students: true }
        }
      }
    });

    logger.info(`Brigade created: ${name} by ${req.user.email}`);
    res.status(201).json(brigade);
  } catch (error) {
    logger.error('Create brigade error:', error);
    res.status(500).json({ error: 'Failed to create brigade' });
  }
});

// Update brigade
router.put('/:id', requireAdmin, [
  body('name').optional().isLength({ min: 1 }).withMessage('Brigade name cannot be empty'),
  body('leaderId').optional().isLength({ min: 1 }).withMessage('Invalid leader ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, leaderId } = req.body;

    const existingBrigade = await prisma.brigade.findUnique({
      where: { id }
    });

    if (!existingBrigade) {
      return res.status(404).json({ error: 'Brigade not found' });
    }

    // Check name uniqueness if name is being changed
    if (name && name !== existingBrigade.name) {
      const duplicateName = await prisma.brigade.findUnique({
        where: { name }
      });

      if (duplicateName) {
        return res.status(400).json({ error: 'Brigade with this name already exists' });
      }
    }

    // Validate leader if provided
    if (leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: leaderId, role: 'BRIGADE_LEAD', isActive: true }
      });

      if (!leader) {
        return res.status(400).json({ error: 'Invalid brigade leader' });
      }
    }

    const brigade = await prisma.brigade.update({
      where: { id },
      data: { ...(name && { name }), ...(leaderId !== undefined && { leaderId }) },
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        _count: {
          select: { students: true }
        }
      }
    });

    logger.info(`Brigade updated: ${brigade.name} by ${req.user.email}`);
    res.json(brigade);
  } catch (error) {
    logger.error('Update brigade error:', error);
    res.status(500).json({ error: 'Failed to update brigade' });
  }
});

// Delete brigade (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const brigade = await prisma.brigade.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: { where: { isActive: true } } }
        }
      }
    });

    if (!brigade) {
      return res.status(404).json({ error: 'Brigade not found' });
    }

    // Check if brigade has active students
    if (brigade._count.students > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete brigade with active students. Please reassign or deactivate students first.' 
      });
    }

    // Soft delete
    await prisma.brigade.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`Brigade deleted: ${brigade.name} by ${req.user.email}`);
    res.json({ message: 'Brigade deleted successfully' });
  } catch (error) {
    logger.error('Delete brigade error:', error);
    res.status(500).json({ error: 'Failed to delete brigade' });
  }
});

// Get brigade statistics
router.get('/:id/stats', requireAdminOrBrigadeLead, async (req, res) => {
  try {
    const { id } = req.params;

    const brigade = await prisma.brigade.findUnique({
      where: { id }
    });

    if (!brigade) {
      return res.status(404).json({ error: 'Brigade not found' });
    }

    // Check permission for brigade leads
    if (req.user.role === 'BRIGADE_LEAD' && brigade.leaderId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get total students
    const totalStudents = await prisma.student.count({
      where: { brigadeId: id, isActive: true }
    });

    // Get attendance statistics
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        student: {
          brigadeId: id,
          isActive: true
        }
      },
      include: {
        eventDay: true
      }
    });

    // Calculate attendance stats
    const totalRecords = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absentRecords = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const lateRecords = attendanceRecords.filter(r => r.status === 'LATE').length;

    // Session-wise stats
    const fnRecords = attendanceRecords.filter(r => r.session === 'FN');
    const anRecords = attendanceRecords.filter(r => r.session === 'AN');

    const fnPresentCount = fnRecords.filter(r => r.status === 'PRESENT').length;
    const anPresentCount = anRecords.filter(r => r.status === 'PRESENT').length;

    // Daily attendance trends
    const dailyStats = {};
    attendanceRecords.forEach(record => {
      const date = record.eventDay.date.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          fnTotal: 0,
          fnPresent: 0,
          anTotal: 0,
          anPresent: 0
        };
      }
      
      dailyStats[date].total++;
      dailyStats[date][record.status.toLowerCase()]++;
      
      if (record.session === 'FN') {
        dailyStats[date].fnTotal++;
        if (record.status === 'PRESENT') dailyStats[date].fnPresent++;
      } else {
        dailyStats[date].anTotal++;
        if (record.status === 'PRESENT') dailyStats[date].anPresent++;
      }
    });

    res.json({
      brigadeInfo: {
        id: brigade.id,
        name: brigade.name,
        totalStudents
      },
      overallStats: {
        totalRecords,
        presentRecords,
        absentRecords,
        lateRecords,
        attendancePercentage: totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(2) : 0
      },
      sessionStats: {
        fn: {
          total: fnRecords.length,
          present: fnPresentCount,
          percentage: fnRecords.length > 0 ? ((fnPresentCount / fnRecords.length) * 100).toFixed(2) : 0
        },
        an: {
          total: anRecords.length,
          present: anPresentCount,
          percentage: anRecords.length > 0 ? ((anPresentCount / anRecords.length) * 100).toFixed(2) : 0
        }
      },
      dailyStats
    });
  } catch (error) {
    logger.error('Get brigade stats error:', error);
    res.status(500).json({ error: 'Failed to fetch brigade statistics' });
  }
});

export default router;