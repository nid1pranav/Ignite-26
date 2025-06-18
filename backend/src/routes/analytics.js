import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const stats = {};

    if (req.user.role === 'ADMIN') {
      // Admin dashboard statistics
      const [totalStudents, totalBrigades, totalBrigadeLeads, currentEvent] = await Promise.all([
        prisma.student.count({ where: { isActive: true } }),
        prisma.brigade.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'BRIGADE_LEAD', isActive: true } }),
        prisma.event.findFirst({
          where: { isActive: true },
          include: { eventDays: true }
        })
      ]);

      // Today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todayAttendance = await prisma.attendanceRecord.count({
        where: {
          createdAt: {
            gte: today,
            lte: todayEnd
          },
          status: 'PRESENT'
        }
      });

      // Overall attendance percentage
      const totalAttendanceRecords = await prisma.attendanceRecord.count();
      const presentRecords = await prisma.attendanceRecord.count({
        where: { status: 'PRESENT' }
      });
      
      const overallAttendancePercentage = totalAttendanceRecords > 0 
        ? ((presentRecords / totalAttendanceRecords) * 100).toFixed(2)
        : 0;

      stats.admin = {
        totalStudents,
        totalBrigades,
        totalBrigadeLeads,
        todayAttendance,
        overallAttendancePercentage,
        currentEvent: currentEvent ? {
          name: currentEvent.name,
          totalDays: currentEvent.eventDays.length
        } : null
      };

    } else if (req.user.role === 'BRIGADE_LEAD') {
      // Brigade lead dashboard statistics
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id },
        include: {
          students: { where: { isActive: true } }
        }
      });

      const studentIds = brigades.flatMap(b => b.students.map(s => s.id));
      
      const totalStudents = studentIds.length;
      
      // Today's attendance for brigade students
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todayAttendance = await prisma.attendanceRecord.count({
        where: {
          studentId: { in: studentIds },
          createdAt: {
            gte: today,
            lte: todayEnd
          },
          status: 'PRESENT'
        }
      });

      // Brigade attendance percentage
      const brigadeAttendanceRecords = await prisma.attendanceRecord.count({
        where: { studentId: { in: studentIds } }
      });
      
      const brigadePresentRecords = await prisma.attendanceRecord.count({
        where: { 
          studentId: { in: studentIds },
          status: 'PRESENT'
        }
      });

      const brigadeAttendancePercentage = brigadeAttendanceRecords > 0
        ? ((brigadePresentRecords / brigadeAttendanceRecords) * 100).toFixed(2)
        : 0;

      stats.brigadeLead = {
        totalBrigades: brigades.length,
        totalStudents,
        todayAttendance,
        brigadeAttendancePercentage,
        brigades: brigades.map(b => ({
          id: b.id,
          name: b.name,
          studentCount: b.students.length
        }))
      };

    } else if (req.user.role === 'STUDENT') {
      // Student dashboard statistics
      const student = await prisma.student.findUnique({
        where: { userId: req.user.id },
        include: { brigade: true }
      });

      if (student) {
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: { studentId: student.id },
          include: {
            eventDay: {
              include: { event: true }
            }
          }
        });

        const totalSessions = attendanceRecords.length;
        const presentSessions = attendanceRecords.filter(r => r.status === 'PRESENT').length;
        const attendancePercentage = totalSessions > 0 
          ? ((presentSessions / totalSessions) * 100).toFixed(2)
          : 0;

        // Today's sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayRecords = attendanceRecords.filter(r => {
          const recordDate = new Date(r.eventDay.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === today.getTime();
        });

        stats.student = {
          studentInfo: {
            tempRollNumber: student.tempRollNumber,
            name: `${student.firstName} ${student.lastName}`,
            brigade: student.brigade?.name || 'No Brigade'
          },
          attendancePercentage,
          totalSessions,
          presentSessions,
          todaySessions: todayRecords.length,
          todayPresent: todayRecords.filter(r => r.status === 'PRESENT').length
        };
      }
    }

    res.json(stats);
  } catch (error) {
    logger.error('Get dashboard statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get attendance trends
router.get('/attendance-trends', async (req, res) => {
  try {
    const { days = 7, brigadeId } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let whereClause = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // Role-based filtering
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      whereClause.student = {
        brigadeId: { in: brigadeIds }
      };
    } else if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user.id }
      });
      
      if (student) {
        whereClause.studentId = student.id;
      }
    } else if (brigadeId && req.user.role === 'ADMIN') {
      whereClause.student = {
        brigadeId: brigadeId
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        eventDay: true,
        student: {
          include: { brigade: true }
        }
      }
    });

    // Group by date
    const dailyStats = {};
    records.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0];
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
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

    const trends = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json(trends);
  } catch (error) {
    logger.error('Get attendance trends error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance trends' });
  }
});

// Get brigade comparison
router.get('/brigade-comparison', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const brigades = await prisma.brigade.findMany({
      where: { isActive: true },
      include: {
        students: {
          where: { isActive: true },
          include: {
            attendanceRecords: true
          }
        }
      }
    });

    const comparison = brigades.map(brigade => {
      const totalStudents = brigade.students.length;
      const allRecords = brigade.students.flatMap(s => s.attendanceRecords);
      const presentRecords = allRecords.filter(r => r.status === 'PRESENT');
      
      return {
        id: brigade.id,
        name: brigade.name,
        totalStudents,
        totalRecords: allRecords.length,
        presentRecords: presentRecords.length,
        attendancePercentage: allRecords.length > 0 
          ? ((presentRecords.length / allRecords.length) * 100).toFixed(2)
          : 0
      };
    });

    res.json(comparison);
  } catch (error) {
    logger.error('Get brigade comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch brigade comparison' });
  }
});

// Get session analysis
router.get('/session-analysis', async (req, res) => {
  try {
    let whereClause = {};

    // Role-based filtering
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      whereClause.student = {
        brigadeId: { in: brigadeIds }
      };
    } else if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user.id }
      });
      
      if (student) {
        whereClause.studentId = student.id;
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause
    });

    // Session-wise analysis
    const fnRecords = records.filter(r => r.session === 'FN');
    const anRecords = records.filter(r => r.session === 'AN');

    const analysis = {
      forenoon: {
        total: fnRecords.length,
        present: fnRecords.filter(r => r.status === 'PRESENT').length,
        absent: fnRecords.filter(r => r.status === 'ABSENT').length,
        late: fnRecords.filter(r => r.status === 'LATE').length,
        percentage: fnRecords.length > 0 
          ? ((fnRecords.filter(r => r.status === 'PRESENT').length / fnRecords.length) * 100).toFixed(2)
          : 0
      },
      afternoon: {
        total: anRecords.length,
        present: anRecords.filter(r => r.status === 'PRESENT').length,
        absent: anRecords.filter(r => r.status === 'ABSENT').length,
        late: anRecords.filter(r => r.status === 'LATE').length,
        percentage: anRecords.length > 0 
          ? ((anRecords.filter(r => r.status === 'PRESENT').length / anRecords.length) * 100).toFixed(2)
          : 0
      }
    };

    res.json(analysis);
  } catch (error) {
    logger.error('Get session analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch session analysis' });
  }
});

export default router;