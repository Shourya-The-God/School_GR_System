import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const standard = searchParams.get('standard') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'grNumber';

    const where: any = {};
    if (standard) where.currentClass = standard;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { grNumber: { contains: search } },
        { fullName: { contains: search } },
        { parent: { fatherName: { contains: search } } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        parent: true,
        admission: true,
        transfer: true,
        documents: {
          where: { isOriginalGrScan: true },
          select: { id: true, fileName: true, fileUrl: true },
        },
      },
      orderBy: { [sortBy]: 'asc' },
    });

    // Map into official standard 20-column General Register Format
    const folioRows = students.map((s, idx) => ({
      col1_serialNo: idx + 1,
      col2_grNumber: s.grNumber,
      col3_admissionNumber: s.admissionNumber || '-',
      col4_studentFullName: s.fullName,
      col5_fatherName: s.parent?.fatherName || '-',
      col6_motherName: s.parent?.motherName || '-',
      col7_nationality: s.nationality,
      col8_religion: s.religion || '-',
      col9_casteCategory: s.casteCategory || '-',
      col10_subCaste: s.subCaste || '-',
      col11_placeOfBirth: s.placeOfBirth ? `${s.placeOfBirth}, ${s.district || ''}` : '-',
      col12_dobFigures: s.dob.toISOString().slice(0, 10),
      col13_dobWords: s.dobInWords || '-',
      col14_previousSchool: s.admission?.previousSchoolName || '-',
      col15_admissionDate: s.admission?.admissionDate ? s.admission.admissionDate.toISOString().slice(0, 10) : '-',
      col16_admittedClass: `${s.admission?.admittedClass || s.currentClass}-${s.admission?.admittedDivision || s.currentDivision}`,
      col17_currentClass: `${s.currentClass}-${s.currentDivision}`,
      col18_leavingDate: s.transfer?.leavingDate ? s.transfer.leavingDate.toISOString().slice(0, 10) : '-',
      col19_reasonForLeaving: s.transfer?.reasonForLeaving || (s.status === 'ACTIVE' ? 'Currently Enrolled' : s.status),
      col20_tcNumber: s.transfer?.tcNumber || '-',
      status: s.status,
      hasOriginalScan: s.documents.length > 0,
      studentId: s.id,
    }));

    return NextResponse.json({
      folioRows,
      schoolMetadata: {
        schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME || 'Adarsh Vidya Mandir High School',
        schoolCode: process.env.NEXT_PUBLIC_SCHOOL_CODE || 'AVM-MH-1984',
        affiliation: 'State Board of Secondary & Higher Secondary Education',
        totalRecords: folioRows.length,
      },
    });
  } catch (error) {
    console.error('Error generating GR folio data:', error);
    return NextResponse.json({ error: 'Failed to generate GR folio' }, { status: 500 });
  }
}
