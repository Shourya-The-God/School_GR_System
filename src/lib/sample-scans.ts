export interface SampleScanPreset {
  id: string;
  name: string;
  description: string;
  pageCount: number;
  simulatedText: string;
  previewSvg: string;
}

export const SAMPLE_GR_SCANS: SampleScanPreset[] = [
  {
    id: 'sample-ledger-1998',
    name: 'General Register Vol. III (1998-2002) - Page 48',
    description: 'Scanned ledger page from 1998 featuring 3 student admission rows with ink stamps and handwriting.',
    pageCount: 1,
    simulatedText: `
GENERAL REGISTER OF PUPILS - ADARSH VIDYA MANDIR HIGH SCHOOL
---------------------------------------------------------------------------------------------------------
GR No: GR-1050 | Reg. Date: 14/06/2000 | Std Admitted: I-A
Pupil's Name: Kulkarni Omkar Shripad | Gender: Male | DOB: 18/03/1994 (Eighteenth March Nineteen Ninety Four)
Religion: Hindu | Caste: Brahmin | Sub-caste: Deshastha | Mother Tongue: Marathi | Birth Place: Pune
Father's Name: Shripad Waman Kulkarni (Govt Officer) | Mother's Name: Anuradha Shripad Kulkarni
Previous School: Balvikas Shishu Mandir, Pune | Last Std Passed: Sr. KG
Address: 14/A, Saraswati Colony, Sadashiv Peth, Pune - 411030
---------------------------------------------------------------------------------------------------------
GR No: GR-1051 | Reg. Date: 16/06/2000 | Std Admitted: I-B
Pupil's Name: Shaikh Ayesha Imran | Gender: Female | DOB: 25/08/1994 (Twenty Fifth August Nineteen Ninety Four)
Religion: Muslim | Caste: General/Open | Mother Tongue: Urdu | Birth Place: Solapur
Father's Name: Imran Yakub Shaikh (Trader) | Mother's Name: Parveen Imran Shaikh
Previous School: Model Kindergarten, Solapur | Last Std Passed: UKG
Address: House No 42, Ganj Peth, Pune - 411002
---------------------------------------------------------------------------------------------------------
GR No: GR-1052 | Reg. Date: 20/06/2000 | Std Admitted: I-A
Pupil's Name: Jadhav Siddharth Sanjay | Gender: Male | DOB: 09/12/1993 (Ninth December Nineteen Ninety Three)
Religion: Buddhist | Caste: SC | Sub-caste: Mahar | Mother Tongue: Marathi | Birth Place: Satara
Father's Name: Sanjay Baban Jadhav (Teacher) | Mother's Name: Pratibha Sanjay Jadhav
Previous School: Z.P. Primary School No. 2, Satara | Last Std Passed: Sr. KG
Address: B-202, Anand Park, Dhanori, Pune - 411015
---------------------------------------------------------------------------------------------------------
    `.trim(),
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
  <rect width="1000" height="650" fill="%23f7f2e4" stroke="%238c7b64" stroke-width="6"/>
  <rect x="20" y="20" width="960" height="610" fill="none" stroke="%23a3937d" stroke-width="2"/>
  
  <!-- Aging lines -->
  <line x1="20" y1="90" x2="980" y2="90" stroke="%235a4d3b" stroke-width="2"/>
  <line x1="20" y1="130" x2="980" y2="130" stroke="%235a4d3b" stroke-width="2"/>
  <line x1="20" y1="280" x2="980" y2="280" stroke="%237a6b57" stroke-width="1.5" stroke-dasharray="4,2"/>
  <line x1="20" y1="440" x2="980" y2="440" stroke="%237a6b57" stroke-width="1.5" stroke-dasharray="4,2"/>
  <line x1="20" y1="600" x2="980" y2="600" stroke="%235a4d3b" stroke-width="2"/>
  
  <!-- Column Grid Lines -->
  <line x1="90" y1="90" x2="90" y2="600" stroke="%238c7b64" stroke-width="1.5"/>
  <line x1="260" y1="90" x2="260" y2="600" stroke="%238c7b64" stroke-width="1.5"/>
  <line x1="390" y1="90" x2="390" y2="600" stroke="%238c7b64" stroke-width="1.5"/>
  <line x1="510" y1="90" x2="510" y2="600" stroke="%238c7b64" stroke-width="1.5"/>
  <line x1="680" y1="90" x2="680" y2="600" stroke="%238c7b64" stroke-width="1.5"/>
  <line x1="840" y1="90" x2="840" y2="600" stroke="%238c7b64" stroke-width="1.5"/>

  <!-- Title -->
  <text x="500" y="55" font-family="serif" font-size="22" font-weight="bold" fill="%232c2217" text-anchor="middle">GENERAL REGISTER OF PUPILS - ADARSH VIDYA MANDIR</text>
  <text x="500" y="78" font-family="serif" font-size="14" fill="%235a4d3b" text-anchor="middle">Volume IV (1998-2002) - Page No: 48 | Established 1984</text>
  
  <!-- Column Headers -->
  <text x="55" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="%232c2217" text-anchor="middle">GR NO.</text>
  <text x="175" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="%232c2217" text-anchor="middle">PUPIL'S FULL NAME</text>
  <text x="325" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="%232c2217" text-anchor="middle">DATE OF BIRTH</text>
  <text x="450" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="%232c2217" text-anchor="middle">RELIGION &amp; CASTE</text>
  <text x="595" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="%232c2217" text-anchor="middle">PARENTS / GUARDIAN</text>
  <text x="760" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="%232c2217" text-anchor="middle">ADMISSION / PREV SCHOOL</text>
  <text x="910" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="%232c2217" text-anchor="middle">LEAVING / REMARKS</text>

  <!-- Row 1 -->
  <text x="55" y="180" font-family="monospace" font-size="16" font-weight="bold" fill="%231a365d" text-anchor="middle">GR-1050</text>
  <text x="100" y="170" font-family="serif" font-size="15" font-weight="bold" fill="%231f2937">Kulkarni Omkar Shripad</text>
  <text x="100" y="195" font-family="serif" font-size="12" fill="%234b5563">Mother: Anuradha | Marathi</text>
  <text x="270" y="170" font-family="sans-serif" font-size="13" fill="%231f2937">18/03/1994</text>
  <text x="270" y="195" font-family="sans-serif" font-size="10" fill="%236b7280">Eighteenth March 1994</text>
  <text x="400" y="170" font-family="sans-serif" font-size="12" fill="%231f2937">Hindu (Brahmin)</text>
  <text x="400" y="195" font-family="sans-serif" font-size="11" fill="%234b5563">General/Open | Pune</text>
  <text x="520" y="170" font-family="sans-serif" font-size="12" fill="%231f2937">Shripad Waman Kulkarni</text>
  <text x="520" y="195" font-family="sans-serif" font-size="11" fill="%234b5563">Govt Officer, Sadashiv Peth</text>
  <text x="690" y="170" font-family="sans-serif" font-size="12" fill="%231f2937">Adm: 14/06/2000 (Std I-A)</text>
  <text x="690" y="195" font-family="sans-serif" font-size="11" fill="%234b5563">Balvikas Shishu Mandir</text>
  <text x="850" y="180" font-family="sans-serif" font-size="11" fill="%23059669">Admitted &amp; Verified</text>

  <!-- Row 2 -->
  <text x="55" y="335" font-family="monospace" font-size="16" font-weight="bold" fill="%231a365d" text-anchor="middle">GR-1051</text>
  <text x="100" y="325" font-family="serif" font-size="15" font-weight="bold" fill="%231f2937">Shaikh Ayesha Imran</text>
  <text x="100" y="350" font-family="serif" font-size="12" fill="%234b5563">Mother: Parveen | Urdu</text>
  <text x="270" y="325" font-family="sans-serif" font-size="13" fill="%231f2937">25/08/1994</text>
  <text x="270" y="350" font-family="sans-serif" font-size="10" fill="%236b7280">Twenty Fifth Aug 1994</text>
  <text x="400" y="325" font-family="sans-serif" font-size="12" fill="%231f2937">Muslim (General)</text>
  <text x="400" y="350" font-family="sans-serif" font-size="11" fill="%234b5563">Birth: Solapur</text>
  <text x="520" y="325" font-family="sans-serif" font-size="12" fill="%231f2937">Imran Yakub Shaikh</text>
  <text x="520" y="350" font-family="sans-serif" font-size="11" fill="%234b5563">Businessman, Ganj Peth</text>
  <text x="690" y="325" font-family="sans-serif" font-size="12" fill="%231f2937">Adm: 16/06/2000 (Std I-B)</text>
  <text x="690" y="350" font-family="sans-serif" font-size="11" fill="%234b5563">Model Kindergarten Solapur</text>
  <text x="850" y="335" font-family="sans-serif" font-size="11" fill="%23059669">Verified OK</text>

  <!-- Row 3 -->
  <text x="55" y="495" font-family="monospace" font-size="16" font-weight="bold" fill="%231a365d" text-anchor="middle">GR-1052</text>
  <text x="100" y="485" font-family="serif" font-size="15" font-weight="bold" fill="%231f2937">Jadhav Siddharth Sanjay</text>
  <text x="100" y="510" font-family="serif" font-size="12" fill="%234b5563">Mother: Pratibha | Marathi</text>
  <text x="270" y="485" font-family="sans-serif" font-size="13" fill="%231f2937">09/12/1993</text>
  <text x="270" y="510" font-family="sans-serif" font-size="10" fill="%236b7280">Ninth Dec 1993</text>
  <text x="400" y="485" font-family="sans-serif" font-size="12" fill="%231f2937">Buddhist (SC Mahar)</text>
  <text x="400" y="510" font-family="sans-serif" font-size="11" fill="%234b5563">Birth: Satara</text>
  <text x="520" y="485" font-family="sans-serif" font-size="12" fill="%231f2937">Sanjay Baban Jadhav</text>
  <text x="520" y="510" font-family="sans-serif" font-size="11" fill="%234b5563">Teacher, Dhanori Pune</text>
  <text x="690" y="485" font-family="sans-serif" font-size="12" fill="%231f2937">Adm: 20/06/2000 (Std I-A)</text>
  <text x="690" y="510" font-family="sans-serif" font-size="11" fill="%234b5563">Z.P. Primary School Satara</text>
  <text x="850" y="495" font-family="sans-serif" font-size="11" fill="%23059669">Verified OK</text>

  <!-- Official School Rubber Stamp -->
  <g transform="translate(860, 520) rotate(-12)">
    <circle cx="45" cy="45" r="42" fill="none" stroke="%23991b1b" stroke-width="2.5" stroke-dasharray="2,1"/>
    <text x="45" y="32" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23991b1b" text-anchor="middle">ADARSH VIDYA MANDIR</text>
    <text x="45" y="48" font-family="sans-serif" font-size="7" font-weight="bold" fill="%23991b1b" text-anchor="middle">* PUNE *</text>
    <text x="45" y="62" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23991b1b" text-anchor="middle">GEN. REGISTER</text>
  </g>
</svg>`,
  },
  {
    id: 'sample-transfer-certificate',
    name: 'Historical Transfer Certificate (TC/LC Scan)',
    description: 'Scanned Transfer Certificate / School Leaving Certificate issued in 2004.',
    pageCount: 1,
    simulatedText: `
LEAVING CERTIFICATE / TRANSFER CERTIFICATE
ADARSH VIDYA MANDIR HIGH SCHOOL, PUNE
TC No: TC-AVM-2004/048 | GR No: GR-0812
1. Name of Pupil in full: Deshmukh Aditya Vijay
2. Father's Name: Vijay Govind Deshmukh
3. Mother's Name: Radhika Vijay Deshmukh
4. Nationality: Indian | Religion: Hindu | Caste: Maratha (Open)
5. Date of Birth: 04/07/1988 (Fourth July Nineteen Eighty Eight)
6. Place of Birth: Pune, Maharashtra
7. Last School Attended: Balbharti Pre-School
8. Date of Admission: 15/06/1994 | Admitted Std: I
9. Progress: Good | Conduct: Exemplary
10. Date of Leaving: 31/05/2004 | Standard: X (Passed SSC)
11. Reason for Leaving: Passed SSC Board Exam 2004
12. Remarks: Fees paid up to date. Character very good.
    `.trim(),
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <rect width="800" height="600" fill="%23fdfbf7" stroke="%239c8868" stroke-width="4"/>
  <rect x="25" y="25" width="750" height="550" fill="none" stroke="%23b89d70" stroke-width="1.5"/>
  <text x="400" y="70" font-family="serif" font-size="22" font-weight="bold" fill="%231e293b" text-anchor="middle">ADARSH VIDYA MANDIR HIGH SCHOOL</text>
  <text x="400" y="95" font-family="serif" font-size="14" fill="%23475569" text-anchor="middle">Kothrud, Pune - 411038 | Recognized by Govt. of Maharashtra</text>
  <line x1="50" y1="110" x2="750" y2="110" stroke="%231e293b" stroke-width="2"/>
  <text x="400" y="145" font-family="serif" font-size="18" font-weight="bold" fill="%23991b1b" text-anchor="middle">SCHOOL LEAVING CERTIFICATE (T.C.)</text>
  <text x="70" y="185" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23334155">Book No: 12</text>
  <text x="350" y="185" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23334155">Certificate No: TC-AVM-2004/048</text>
  <text x="650" y="185" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23334155">G.R. No: GR-0812</text>
  
  <line x1="50" y1="200" x2="750" y2="200" stroke="%23cbd5e1" stroke-width="1"/>
  
  <text x="70" y="240" font-family="sans-serif" font-size="13" fill="%23334155">1. Name of Pupil in full: <tspan font-weight="bold" fill="%230f172a">Deshmukh Aditya Vijay</tspan></text>
  <text x="70" y="275" font-family="sans-serif" font-size="13" fill="%23334155">2. Father's Name: <tspan font-weight="bold" fill="%230f172a">Vijay Govind Deshmukh</tspan></text>
  <text x="70" y="310" font-family="sans-serif" font-size="13" fill="%23334155">3. Mother's Name: <tspan font-weight="bold" fill="%230f172a">Radhika Vijay Deshmukh</tspan></text>
  <text x="70" y="345" font-family="sans-serif" font-size="13" fill="%23334155">4. Nationality &amp; Religion: <tspan font-weight="bold" fill="%230f172a">Indian | Hindu (Maratha / Open)</tspan></text>
  <text x="70" y="380" font-family="sans-serif" font-size="13" fill="%23334155">5. Date of Birth: <tspan font-weight="bold" fill="%230f172a">04/07/1988 (Fourth July Nineteen Eighty Eight)</tspan></text>
  <text x="70" y="415" font-family="sans-serif" font-size="13" fill="%23334155">6. Date of Admission &amp; Std: <tspan font-weight="bold" fill="%230f172a">15/06/1994 (Std I)</tspan></text>
  <text x="70" y="450" font-family="sans-serif" font-size="13" fill="%23334155">7. Date of Leaving School: <tspan font-weight="bold" fill="%230f172a">31/05/2004</tspan></text>
  <text x="70" y="485" font-family="sans-serif" font-size="13" fill="%23334155">8. Reason for Leaving: <tspan font-weight="bold" fill="%230f172a">Passed SSC Board Examination 2004</tspan></text>
  <text x="70" y="520" font-family="sans-serif" font-size="13" fill="%23334155">9. Progress &amp; Conduct: <tspan font-weight="bold" fill="%230f172a">Good &amp; Exemplary</tspan></text>
  
  <text x="120" y="565" font-family="sans-serif" font-size="11" fill="%23475569">Clerk / Registrar</text>
  <text x="620" y="565" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23475569">Headmaster / Principal</text>
</svg>`,
  },
];
