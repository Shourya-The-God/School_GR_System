/**
 * Export service for generating CSV and data tables for reports and downloads
 */

export const generateStudentsCSV = (students) => {
  const headers = [
    'GR Number',
    'Admission Number',
    'Full Name',
    'Gender',
    'Date of Birth',
    'Class',
    'Division',
    'Roll No',
    'Status',
    'Religion',
    'Caste',
    'Father Name',
    'Mother Name',
    'Parent Contact',
    'Aadhar Number'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = students.map(s => [
    escapeCSV(s.grNumber),
    escapeCSV(s.admissionNumber || ''),
    escapeCSV(s.fullName),
    escapeCSV(s.gender),
    escapeCSV(s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : ''),
    escapeCSV(s.currentClass ? s.currentClass.name : ''),
    escapeCSV(s.currentDivision ? s.currentDivision.name : ''),
    escapeCSV(s.rollNumber || ''),
    escapeCSV(s.status),
    escapeCSV(s.religion || ''),
    escapeCSV(s.caste || ''),
    escapeCSV(s.fatherName || ''),
    escapeCSV(s.motherName || ''),
    escapeCSV(s.parentContact || ''),
    escapeCSV(s.aadharNumber || '')
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
};
