import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Create Roles
  const roles = [
    { name: 'ADMIN', description: 'Full system access and configuration' },
    { name: 'PRINCIPAL', description: 'Academic oversight, reports, and TC approvals' },
    { name: 'CLERK', description: 'Data entry, student admissions, and OCR verification' },
    { name: 'TEACHER', description: 'Class view and student academic updates' }
  ];

  const createdRoles = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r
    });
    createdRoles[r.name] = role;
  }
  console.log('✓ Roles initialized');

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Admin@12345', 10);

  const users = [
    {
      username: 'admin',
      email: 'admin@schoolgr.edu',
      fullName: 'System Administrator',
      roleId: createdRoles.ADMIN.id
    },
    {
      username: 'principal',
      email: 'principal@schoolgr.edu',
      fullName: 'Dr. Ramesh Sharma (Principal)',
      roleId: createdRoles.PRINCIPAL.id
    },
    {
      username: 'clerk',
      email: 'clerk@schoolgr.edu',
      fullName: 'Sunita Joshi (Senior Clerk)',
      roleId: createdRoles.CLERK.id
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash, roleId: u.roleId },
      create: {
        ...u,
        passwordHash,
        isActive: true
      }
    });
  }
  console.log('✓ Default administrative accounts initialized (Password: Admin@12345)');

  // 3. Create Classes & Divisions
  const classNames = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const createdClasses = [];

  for (let i = 0; i < classNames.length; i++) {
    const cls = await prisma.class.upsert({
      where: { name: classNames[i] },
      update: { numericRank: i + 1 },
      create: {
        name: classNames[i],
        numericRank: i + 1
      }
    });
    createdClasses.push(cls);

    // Create divisions A and B for each class
    for (const divName of ['A', 'B']) {
      await prisma.division.upsert({
        where: {
          classId_name: {
            classId: cls.id,
            name: divName
          }
        },
        update: {},
        create: {
          name: divName,
          classId: cls.id
        }
      });
    }
  }
  console.log('✓ Classes (1st to 10th) and Divisions (A, B) initialized');

  // 4. Sample Students with GR records
  const class5th = createdClasses.find(c => c.name === '5th');
  const class5thDivs = await prisma.division.findMany({ where: { classId: class5th?.id } });
  const divA = class5thDivs.find(d => d.name === 'A') || class5thDivs[0];

  const sampleStudents = [
    {
      grNumber: 'GR-1001',
      admissionNumber: 'ADM-2023-01',
      firstName: 'Aarav',
      middleName: 'Rajesh',
      lastName: 'Sharma',
      fullName: 'Aarav Rajesh Sharma',
      gender: 'MALE',
      dateOfBirth: new Date('2013-05-14'),
      birthPlace: 'Mumbai',
      religion: 'Hindu',
      caste: 'Brahmin',
      subCaste: 'Deshastha',
      nationality: 'Indian',
      motherTongue: 'Marathi',
      aadharNumber: '893412345678',
      fatherName: 'Rajesh Sharma',
      motherName: 'Meena Sharma',
      parentContact: '9820011223',
      emergencyContact: '9820011224',
      residentialAddress: 'Flat 402, Shivneri Apt, Pune',
      currentClassId: class5th?.id,
      currentDivisionId: divA?.id,
      rollNumber: 1,
      status: 'ACTIVE'
    },
    {
      grNumber: 'GR-1002',
      admissionNumber: 'ADM-2023-02',
      firstName: 'Ananya',
      middleName: 'Prashant',
      lastName: 'Deshmukh',
      fullName: 'Ananya Prashant Deshmukh',
      gender: 'FEMALE',
      dateOfBirth: new Date('2013-08-22'),
      birthPlace: 'Nashik',
      religion: 'Hindu',
      caste: 'Maratha',
      nationality: 'Indian',
      motherTongue: 'Marathi',
      aadharNumber: '782345678901',
      fatherName: 'Prashant Deshmukh',
      motherName: 'Kavita Deshmukh',
      parentContact: '9730098765',
      emergencyContact: '9730098766',
      residentialAddress: 'B-12, Green Acres, Pune',
      currentClassId: class5th?.id,
      currentDivisionId: divA?.id,
      rollNumber: 2,
      status: 'ACTIVE'
    },
    {
      grNumber: 'GR-1003',
      admissionNumber: 'ADM-2022-45',
      firstName: 'Zaid',
      middleName: 'Irfan',
      lastName: 'Khan',
      fullName: 'Zaid Irfan Khan',
      gender: 'MALE',
      dateOfBirth: new Date('2012-11-03'),
      birthPlace: 'Aurangabad',
      religion: 'Muslim',
      caste: 'General',
      nationality: 'Indian',
      motherTongue: 'Urdu',
      aadharNumber: '671234567890',
      fatherName: 'Irfan Khan',
      motherName: 'Fatima Khan',
      parentContact: '9422012345',
      emergencyContact: '9422012346',
      residentialAddress: '15, Gulmohar Colony, Pune',
      currentClassId: class5th?.id,
      currentDivisionId: divA?.id,
      rollNumber: 3,
      status: 'ACTIVE'
    }
  ];

  for (const s of sampleStudents) {
    const student = await prisma.student.upsert({
      where: { grNumber: s.grNumber },
      update: {},
      create: {
        ...s,
        admissions: {
          create: {
            admissionDate: new Date('2023-06-15'),
            admittedClass: '5th',
            previousSchool: 'Vidya Mandir Primary School'
          }
        },
        academicHistory: {
          create: {
            academicYear: '2023-2024',
            classId: class5th.id,
            divisionId: divA.id,
            result: 'Passed',
            percentage: 88.5,
            conduct: 'Excellent',
            attendance: 94.2
          }
        }
      }
    });
  }
  console.log('✓ Sample student records with admission history and GR numbers seeded');

  // 5. Initial system audit log
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      newValue: JSON.stringify({ version: '1.0.0', initializedAt: new Date().toISOString() })
    }
  });

  console.log('--- Seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
