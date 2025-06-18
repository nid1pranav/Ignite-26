import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ignite2026.com' },
    update: {},
    create: {
      email: 'admin@ignite2026.com',
      password: adminPassword,
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
    },
  });

  // Create brigade leads
  const brigadeLeadPassword = await bcrypt.hash('lead123', 10);
  const brigadeLeads = [];

  for (let i = 1; i <= 5; i++) {
    const lead = await prisma.user.upsert({
      where: { email: `lead${i}@ignite2026.com` },
      update: {},
      create: {
        email: `lead${i}@ignite2026.com`,
        password: brigadeLeadPassword,
        role: 'BRIGADE_LEAD',
        firstName: `Brigade`,
        lastName: `Lead ${i}`,
      },
    });
    brigadeLeads.push(lead);
  }

  // Create brigades
  const brigades = [];
  const brigadeNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];

  for (let i = 0; i < brigadeNames.length; i++) {
    const brigade = await prisma.brigade.upsert({
      where: { name: `Brigade ${brigadeNames[i]}` },
      update: {},
      create: {
        name: `Brigade ${brigadeNames[i]}`,
        leaderId: brigadeLeads[i].id,
      },
    });
    brigades.push(brigade);
  }

  // Create sample students
  const studentPassword = await bcrypt.hash('student123', 10);
  const students = [];

  for (let i = 1; i <= 50; i++) {
    const brigadeIndex = (i - 1) % brigades.length;
    const tempRollNumber = `IG2026${String(i).padStart(3, '0')}`;
    
    // Create user account for student
    const studentUser = await prisma.user.upsert({
      where: { email: `student${i}@ignite2026.com` },
      update: {},
      create: {
        email: `student${i}@ignite2026.com`,
        password: studentPassword,
        role: 'STUDENT',
        firstName: `Student`,
        lastName: `${i}`,
      },
    });

    const student = await prisma.student.upsert({
      where: { tempRollNumber: tempRollNumber },
      update: {},
      create: {
        tempRollNumber: tempRollNumber,
        firstName: `Student`,
        lastName: `${i}`,
        email: `student${i}@ignite2026.com`,
        phone: `+91${String(9000000000 + i)}`,
        brigadeId: brigades[brigadeIndex].id,
        userId: studentUser.id,
      },
    });
    students.push(student);
  }

  // Create sample event
  const event = await prisma.event.upsert({
    where: { id: 'ignite-2026-main' },
    update: {},
    create: {
      id: 'ignite-2026-main',
      name: 'Ignite 2026',
      description: 'Annual technical fest at Kumaraguru Institutions',
      startDate: new Date('2026-03-15'),
      endDate: new Date('2026-03-17'),
    },
  });

  // Create event days
  const eventDays = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date('2026-03-15');
    date.setDate(date.getDate() + i);
    
    const eventDay = await prisma.eventDay.create({
      data: {
        eventId: event.id,
        date: date,
        fnEnabled: true,
        anEnabled: true,
        fnStartTime: '09:00',
        fnEndTime: '09:30',
        anStartTime: '14:00',
        anEndTime: '14:30',
      },
    });
    eventDays.push(eventDay);
  }

  // Create sample attendance records
  for (const eventDay of eventDays.slice(0, 1)) { // Only for the first day
    for (let i = 0; i < 30; i++) { // First 30 students
      // FN session attendance
      await prisma.attendanceRecord.create({
        data: {
          studentId: students[i].id,
          eventDayId: eventDay.id,
          session: 'FN',
          status: Math.random() > 0.1 ? 'PRESENT' : 'ABSENT',
        },
      });

      // AN session attendance
      await prisma.attendanceRecord.create({
        data: {
          studentId: students[i].id,
          eventDayId: eventDay.id,
          session: 'AN',
          status: Math.random() > 0.15 ? 'PRESENT' : 'ABSENT',
        },
      });
    }
  }

  // Create sample notifications
  await prisma.notification.create({
    data: {
      title: 'Welcome to Ignite 2026',
      message: 'Welcome to the Ignite 2026 Attendance Management System. Please ensure you mark attendance on time.',
      type: 'INFO',
      isGlobal: true,
    },
  });

  await prisma.notification.create({
    data: {
      title: 'Attendance Reminder',
      message: 'Reminder: FN session attendance should be marked between 9:00 AM - 9:30 AM',
      type: 'WARNING',
      targetRole: 'BRIGADE_LEAD',
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📧 Login Credentials:');
  console.log('Admin: admin@ignite2026.com / admin123');
  console.log('Brigade Lead: lead1@ignite2026.com / lead123');
  console.log('Student: student1@ignite2026.com / student123');
  console.log('Student Roll: IG2026001');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });