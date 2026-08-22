/**
 * Specialized parser for School General Register (GR) documents
 * Extracts standard GR fields using heuristic patterns and assigns confidence scores.
 */

export const parseGRData = (rawText, ocrMeta = {}) => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = rawText.replace(/\r\n/g, '\n');

  const parsed = {
    grNumber: '',
    admissionNumber: '',
    admissionDate: '',
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    gender: 'MALE',
    dateOfBirth: '',
    birthPlace: '',
    religion: '',
    caste: '',
    subCaste: '',
    nationality: 'Indian',
    motherTongue: '',
    fatherName: '',
    motherName: '',
    admittedClass: '',
    previousSchool: '',
    remarks: ''
  };

  const confidence = {
    overall: 0,
    fields: {
      grNumber: 0,
      admissionNumber: 0,
      admissionDate: 0,
      fullName: 0,
      dateOfBirth: 0,
      gender: 0,
      religion: 0,
      caste: 0,
      fatherName: 0,
      motherName: 0,
      admittedClass: 0
    }
  };

  // 1. GR Number extraction (e.g., "G.R. No: 1245", "GR Number: A-304", "Reg No: 502")
  const grMatch = fullText.match(/(?:G\.?R\.?\s*(?:No\.?|Number)|General\s*Register\s*(?:No\.?|Number)|Reg(?:ister)?\.?\s*No\.?)[:\s.-]*([A-Za-z0-9\/-]+)/i);
  if (grMatch && grMatch[1]) {
    parsed.grNumber = grMatch[1].trim();
    confidence.fields.grNumber = 88;
  } else {
    // Fallback: look for leading number sequence
    const fallbackNum = lines.find(l => /^(\d{2,6})$/.test(l));
    if (fallbackNum) {
      parsed.grNumber = fallbackNum;
      confidence.fields.grNumber = 50;
    }
  }

  // 2. Admission Number
  const admMatch = fullText.match(/(?:Admission\s*(?:No\.?|Number)|Adm\.?\s*No\.?)[:\s.-]*([A-Za-z0-9\/-]+)/i);
  if (admMatch && admMatch[1]) {
    parsed.admissionNumber = admMatch[1].trim();
    confidence.fields.admissionNumber = 85;
  }

  // 3. Admission Date (e.g. 15/06/2020, 15-06-2020, 15.06.2020)
  const admDateMatch = fullText.match(/(?:Date\s*of\s*Admission|Admission\s*Date|Date\s*Admitted)[:\s.-]*(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i);
  if (admDateMatch && admDateMatch[1]) {
    parsed.admissionDate = formatDateString(admDateMatch[1]);
    confidence.fields.admissionDate = 85;
  }

  // 4. Date of Birth (e.g. "Date of Birth: 04/11/2012", "DOB: 12-05-2010")
  const dobMatch = fullText.match(/(?:Date\s*of\s*Birth|D\.?O\.?B\.?|Birth\s*Date)[:\s.-]*(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i);
  if (dobMatch && dobMatch[1]) {
    parsed.dateOfBirth = formatDateString(dobMatch[1]);
    confidence.fields.dateOfBirth = 90;
  }

  // 5. Full Name / Student Name
  const nameMatch = fullText.match(/(?:Name\s*of\s*(?:the\s*)?(?:Pupil|Student)|Student\s*Name|Pupil'?s?\s*Name|Full\s*Name)[:\s.-]*([A-Za-z\s.'-]+)/i);
  if (nameMatch && nameMatch[1]) {
    const rawName = nameMatch[1].split('\n')[0].trim();
    if (rawName.length > 2) {
      parsed.fullName = rawName;
      splitNames(rawName, parsed);
      confidence.fields.fullName = 85;
    }
  }

  // 6. Father's Name
  const fatherMatch = fullText.match(/(?:Father'?s?\s*Name|Guardian'?s?\s*Name)[:\s.-]*([A-Za-z\s.'-]+)/i);
  if (fatherMatch && fatherMatch[1]) {
    parsed.fatherName = fatherMatch[1].split('\n')[0].trim();
    confidence.fields.fatherName = 80;
  }

  // 7. Mother's Name
  const motherMatch = fullText.match(/(?:Mother'?s?\s*Name)[:\s.-]*([A-Za-z\s.'-]+)/i);
  if (motherMatch && motherMatch[1]) {
    parsed.motherName = motherMatch[1].split('\n')[0].trim();
    confidence.fields.motherName = 80;
  }

  // 8. Gender (Male / Female)
  const genderMatch = fullText.match(/(?:Gender|Sex)[:\s.-]*(Male|Female|Boy|Girl|Other)/i);
  if (genderMatch && genderMatch[1]) {
    const g = genderMatch[1].toLowerCase();
    if (g === 'female' || g === 'girl') parsed.gender = 'FEMALE';
    else if (g === 'other') parsed.gender = 'OTHER';
    else parsed.gender = 'MALE';
    confidence.fields.gender = 90;
  } else {
    confidence.fields.gender = 40;
  }

  // 9. Religion & Caste
  const religionMatch = fullText.match(/(?:Religion)[:\s.-]*([A-Za-z]+)/i);
  if (religionMatch && religionMatch[1]) {
    parsed.religion = religionMatch[1].trim();
    confidence.fields.religion = 80;
  }

  const casteMatch = fullText.match(/(?:Caste|Category)[:\s.-]*([A-Za-z0-9\s-]+)/i);
  if (casteMatch && casteMatch[1]) {
    parsed.caste = casteMatch[1].split('\n')[0].trim();
    confidence.fields.caste = 80;
  }

  const subCasteMatch = fullText.match(/(?:Sub[-\s]?Caste)[:\s.-]*([A-Za-z0-9\s-]+)/i);
  if (subCasteMatch && subCasteMatch[1]) {
    parsed.subCaste = subCasteMatch[1].split('\n')[0].trim();
  }

  // 10. Place of Birth
  const birthPlaceMatch = fullText.match(/(?:Place\s*of\s*Birth|Birth\s*Place)[:\s.-]*([A-Za-z0-9\s,.-]+)/i);
  if (birthPlaceMatch && birthPlaceMatch[1]) {
    parsed.birthPlace = birthPlaceMatch[1].split('\n')[0].trim();
  }

  // 11. Mother Tongue
  const mtMatch = fullText.match(/(?:Mother\s*Tongue)[:\s.-]*([A-Za-z]+)/i);
  if (mtMatch && mtMatch[1]) {
    parsed.motherTongue = mtMatch[1].trim();
  }

  // 12. Admitted Standard / Class
  const classMatch = fullText.match(/(?:Standard|Std\.?|Class\s*Admitted|Class)[:\s.-]*([0-9]{1,2}(?:st|nd|rd|th)?|[IVXLCDM]+|[A-Za-z0-9\s]+)/i);
  if (classMatch && classMatch[1]) {
    parsed.admittedClass = classMatch[1].split('\n')[0].trim();
    confidence.fields.admittedClass = 75;
  }

  // 13. Previous School
  const prevSchoolMatch = fullText.match(/(?:Last\s*School\s*Attended|Previous\s*School)[:\s.-]*([A-Za-z0-9\s.,'-]+)/i);
  if (prevSchoolMatch && prevSchoolMatch[1]) {
    parsed.previousSchool = prevSchoolMatch[1].split('\n')[0].trim();
  }

  // Compute overall average confidence
  const scoredFields = Object.values(confidence.fields);
  const sum = scoredFields.reduce((acc, curr) => acc + curr, 0);
  confidence.overall = Math.round(sum / scoredFields.length);

  // If OCR overall score exists, factor it in
  if (ocrMeta.confidence) {
    confidence.overall = Math.round((confidence.overall * 0.7) + (ocrMeta.confidence * 0.3));
  }

  return {
    parsed,
    confidence
  };
};

function splitNames(fullName, target) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    target.firstName = parts[0];
    target.lastName = parts[0];
  } else if (parts.length === 2) {
    target.firstName = parts[0];
    target.lastName = parts[1];
  } else if (parts.length >= 3) {
    target.firstName = parts[0];
    target.middleName = parts.slice(1, parts.length - 1).join(' ');
    target.lastName = parts[parts.length - 1];
  }
}

function formatDateString(dateStr) {
  const cleaned = dateStr.replace(/[\.-]/g, '/');
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) {
      year = parseInt(year, 10) > 30 ? '19' + year : '20' + year;
    }
    // Return standard YYYY-MM-DD format for HTML date inputs
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}
