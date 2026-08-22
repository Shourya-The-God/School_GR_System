import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { parseGRData } from '../backend/services/ocr/grDataParser.js';
import { generateStudentsCSV } from '../backend/services/exportService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log(' School General Register (GR) - Automated Test Suite');
  console.log('====================================================\n');

  // Test 1: Password Hashing & Auth
  console.log('[1/4] Testing Security & Cryptographic Hashes...');
  const password = 'Admin@12345';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  assert(await bcrypt.compare(password, hash), 'Password bcrypt verification matches hash');
  assert(!(await bcrypt.compare('WrongPassword', hash)), 'Bcrypt correctly rejects invalid password');

  const tokenPayload = { userId: 'u-123', username: 'admin', role: 'ADMIN' };
  const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production-gr-system-2026';
  const token = jwt.sign(tokenPayload, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);
  assert(decoded.userId === 'u-123' && decoded.role === 'ADMIN', 'JWT token generates and verifies claims successfully');

  // Test 2: OCR Parser Heuristics & Confidence Scoring
  console.log('\n[2/4] Testing OCR GR Parser & Confidence Engine...');
  const sampleOCRText = `
    GENERAL REGISTER OF PUPILS
    G.R. No: GR-5520
    Admission No: ADM-2024-88
    Date of Admission: 18/06/2024
    Name of the Student: Sneha Deepak Kulkarni
    Father's Name: Deepak Kulkarni
    Mother's Name: Priya Kulkarni
    Date of Birth: 14/09/2014
    Gender: Female
    Religion: Hindu
    Caste: Brahmin
    Standard Admitted: 4th
    Last School Attended: Saraswati Vidyamandir
  `;

  const parsedResult = parseGRData(sampleOCRText, { confidence: 88 });
  assert(parsedResult.parsed.grNumber === 'GR-5520', `Extracted GR Number correctly: "${parsedResult.parsed.grNumber}"`);
  assert(parsedResult.parsed.admissionNumber === 'ADM-2024-88', `Extracted Admission Number correctly: "${parsedResult.parsed.admissionNumber}"`);
  assert(parsedResult.parsed.firstName === 'Sneha', `Extracted First Name: "${parsedResult.parsed.firstName}"`);
  assert(parsedResult.parsed.middleName === 'Deepak', `Extracted Middle Name: "${parsedResult.parsed.middleName}"`);
  assert(parsedResult.parsed.lastName === 'Kulkarni', `Extracted Last Name: "${parsedResult.parsed.lastName}"`);
  assert(parsedResult.parsed.gender === 'FEMALE', `Extracted Gender: "${parsedResult.parsed.gender}"`);
  assert(parsedResult.parsed.dateOfBirth === '2014-09-14', `Formatted DOB: "${parsedResult.parsed.dateOfBirth}"`);
  assert(parsedResult.confidence.overall >= 70, `Calculated overall confidence: ${parsedResult.confidence.overall}% (>=70%)`);

  // Test 3: CSV Generation & Export
  console.log('\n[3/4] Testing Reports & CSV Export Engine...');
  const mockStudents = [
    {
      grNumber: 'GR-101',
      admissionNumber: 'ADM-01',
      fullName: 'John Doe',
      gender: 'MALE',
      dateOfBirth: new Date('2012-01-01'),
      currentClass: { name: '5th' },
      currentDivision: { name: 'A' },
      rollNumber: 1,
      status: 'ACTIVE',
      religion: 'Christian',
      caste: 'General',
      fatherName: 'Robert Doe',
      motherName: 'Mary Doe',
      parentContact: '9876543210',
      aadharNumber: '123456789012'
    }
  ];

  const csv = generateStudentsCSV(mockStudents);
  assert(csv.includes('GR Number') && csv.includes('John Doe') && csv.includes('GR-101'), 'CSV generation produced valid formatted tabular output');

  // Test 4: Summary & Exit Status
  console.log('\n[4/4] Test Results:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error('\n❌ Tests failed.');
    process.exit(1);
  } else {
    console.log('\n✅ All unit and domain service tests passed successfully!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
