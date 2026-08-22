import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { convertDateToWords } from '@/lib/number-to-words';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    // Allow viewer, operator, admin
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';
    const standard = searchParams.get('standard') || '';
    const division = searchParams.get('division') || '';
    const casteCategory = searchParams.get('casteCategory') || '';
    const gender = searchParams.get('gender') || '';
    const academicYear = searchParams.get('academicYear') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '15', 10)));
    const sortBy = searchParams.get('sortBy') || 'grNumber';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (standard) {
      where.currentClass = standard;
    }

    if (division) {
      where.currentDivision = division;
    }

    if (casteCategory) {
      where.casteCategory = casteCategory;
    }

    if (gender) {
      where.gender = gender;
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    if (search) {
      where.OR = [
        { grNumber: { contains: search } },
        { admissionNumber: { contains: search } },
        { fullName: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { parent: { fatherName: { contains: search } } },
        { parent: { motherName: { contains: search } } },
        { aadharNumber: { contains: search } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          parent: true,
          admission: true,
          transfer: true,
          documents: {
            select: { id: true, fileName: true, fileType: true, documentType: true, isOriginalGrScan: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canEditStudents')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to add student' }, { status: 403 });
    }

    const body = await req.json();
    const {
      grNumber,
      admissionNumber,
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      bloodGroup,
      aadharNumber,
      nationality = 'Indian',
      religion,
      casteCategory,
      subCaste,
      motherTongue,
      placeOfBirth,
      taluka,
      district,
      state = 'Maharashtra',
      currentClass,
      currentDivision = 'A',
      rollNumber,
      academicYear = '2026-2027',
      // Parent details
      fatherName,
      fatherOccupation,
      fatherPhone,
      fatherEmail,
      fatherIncome,
      motherName,
      motherOccupation,
      motherPhone,
      addressLine1,
      city,
      pincode,
      // Admission details
      admissionDate,
      admittedClass,
      admittedDivision = 'A',
      previousSchoolName,
      previousSchoolBoard,
      previousClassPassed,
      previousTcNumber,
      previousTcDate,
    } = body;

    // 1. Mandatory Field Validations
    if (!grNumber?.trim()) {
      return NextResponse.json({ error: 'General Register (GR) Number is required' }, { status: 400 });
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'First name and Last name are required' }, { status: 400 });
    }
    if (!dob) {
      return NextResponse.json({ error: 'Date of Birth is required' }, { status: 400 });
    }
    if (!currentClass?.trim()) {
      return NextResponse.json({ error: 'Class / Standard is required' }, { status: 400 });
    }

    // 2. Duplicate GR Check
    const cleanGr = grNumber.trim();
    const existingStudent = await prisma.student.findUnique({
      where: { grNumber: cleanGr },
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          error: `GR Number "${cleanGr}" already exists in the register for student "${existingStudent.fullName}". GR Numbers must be strictly unique.`,
          isDuplicateGr: true,
          existingStudentId: existingStudent.id,
        },
        { status: 409 }
      );
    }

    // Check duplicate admission number if provided
    if (admissionNumber?.trim()) {
      const existingAdm = await prisma.student.findFirst({
        where: { admissionNumber: admissionNumber.trim() },
      });
      if (existingAdm) {
        return NextResponse.json(
          {
            error: `Admission Number "${admissionNumber.trim()}" is already assigned to student "${existingAdm.fullName}".`,
            isDuplicateAdm: true,
          },
          { status: 409 }
        );
      }
    }

    const birthDate = new Date(dob);
    const dobWords = convertDateToWords(birthDate);
    const fullName = `${lastName.trim()} ${firstName.trim()} ${middleName?.trim() || ''}`.replace(/\s+/g, ' ').trim();

    const createdStudent = await prisma.student.create({
      data: {
        grNumber: cleanGr,
        admissionNumber: admissionNumber?.trim() || `ADM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        firstName: firstName.trim(),
        middleName: middleName?.trim() || null,
        lastName: lastName.trim(),
        fullName,
        dob: birthDate,
        dobInWords: dobWords,
        gender: gender || 'MALE',
        bloodGroup: bloodGroup || null,
        aadharNumber: aadharNumber?.trim() || null,
        nationality,
        religion: religion || 'Hindu',
        casteCategory: casteCategory || 'General/Open',
        subCaste: subCaste?.trim() || null,
        motherTongue: motherTongue || 'Marathi',
        placeOfBirth: placeOfBirth?.trim() || null,
        taluka: taluka?.trim() || null,
        district: district?.trim() || null,
        state,
        currentClass: currentClass.trim(),
        currentDivision: currentDivision.trim(),
        rollNumber: rollNumber ? parseInt(rollNumber, 10) : null,
        academicYear,
        status: 'ACTIVE',
        parent: {
          create: {
            fatherName: fatherName?.trim() || null,
            fatherOccupation: fatherOccupation?.trim() || null,
            fatherPhone: fatherPhone?.trim() || null,
            fatherEmail: fatherEmail?.trim() || null,
            fatherIncome: fatherIncome?.trim() || null,
            motherName: motherName?.trim() || null,
            motherOccupation: motherOccupation?.trim() || null,
            motherPhone: motherPhone?.trim() || null,
            addressLine1: addressLine1?.trim() || null,
            city: city?.trim() || null,
            pincode: pincode?.trim() || null,
            state,
          },
        },
        admission: {
          create: {
            admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
            admittedClass: admittedClass?.trim() || currentClass.trim(),
            admittedDivision: admittedDivision?.trim() || currentDivision.trim(),
            previousSchoolName: previousSchoolName?.trim() || null,
            previousSchoolBoard: previousSchoolBoard?.trim() || null,
            previousClassPassed: previousClassPassed?.trim() || null,
            previousTcNumber: previousTcNumber?.trim() || null,
            previousTcDate: previousTcDate ? new Date(previousTcDate) : null,
          },
        },
      },
      include: {
        parent: true,
        admission: true,
      },
    });

    // Audit Log
    await logAuditEvent({
      user,
      actionType: 'CREATE',
      entityType: 'STUDENT',
      entityId: createdStudent.id,
      entityIdentifier: `${createdStudent.grNumber}: ${createdStudent.fullName}`,
      details: `New student ${createdStudent.fullName} registered directly into General Register under GR No ${createdStudent.grNumber} in Std ${createdStudent.currentClass}-${createdStudent.currentDivision}`,
      newValue: {
        grNumber: createdStudent.grNumber,
        fullName: createdStudent.fullName,
        dob: createdStudent.dob,
        currentClass: createdStudent.currentClass,
        admissionNumber: createdStudent.admissionNumber,
      },
      studentId: createdStudent.id,
    });

    return NextResponse.json({ success: true, student: createdStudent }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 });
  }
}
