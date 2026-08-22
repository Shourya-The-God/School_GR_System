'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  School,
  ShieldCheck,
  Download,
  AlertCircle,
} from 'lucide-react';

export default function TransferCertificatePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const resolvedParams = use(params);
  const { studentId } = resolvedParams;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data.student);
        }
      } catch (err) {
        console.error('Failed to load student for TC:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [studentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Transfer Certificate...</div>;
  }

  if (!student) {
    return <div className="p-12 text-center text-slate-400">Student record not found</div>;
  }

  const transfer = student.transfer;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Controls (Hidden on Print) */}
      <div className="no-print flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/students/${studentId}`}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Official School Leaving / Transfer Certificate (T.C.)
            </h1>
            <p className="text-xs text-slate-500">
              Government-prescribed statutory certificate format for student transfer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Formatted Sheet */}
      <div className="bg-[#fcfaf5] border-4 border-[#8c7b64] rounded-2xl p-8 md:p-12 shadow-xl print:border-2 print:border-black print:p-6 print:shadow-none font-serif text-slate-900 relative">
        {/* Decorative inner border */}
        <div className="border border-[#b5a48d] p-6 rounded-xl print:border-black">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <School size={28} className="text-slate-900" />
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-slate-950">
                {process.env.NEXT_PUBLIC_SCHOOL_NAME || 'ADARSH VIDYA MANDIR HIGH SCHOOL'}
              </h2>
            </div>
            <p className="text-xs text-slate-700">
              Kothrud, Pune - 411038, Maharashtra | Recognized by Govt. of Maharashtra
            </p>
            <p className="text-[11px] text-slate-600 font-sans">
              School Index No: 11.02.042 • U-DISE Code: 27251402804 • Affiliation: State Board
            </p>
            <div className="pt-2">
              <span className="inline-block px-4 py-1 border-2 border-slate-900 font-bold text-sm uppercase tracking-widest bg-[#f7f2e4]">
                SCHOOL LEAVING CERTIFICATE (T.C.)
              </span>
            </div>
          </div>

          {/* Certificate Metadata Numbers */}
          <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-400 text-xs font-sans font-semibold">
            <div>
              Book No: <span className="font-bold text-slate-950 font-mono">14</span>
            </div>
            <div className="text-center">
              Certificate No: <span className="font-bold text-amber-900 font-mono text-sm">{transfer?.tcNumber || 'TC-PENDING'}</span>
            </div>
            <div className="text-right">
              General Register No: <span className="font-bold text-blue-900 font-mono text-sm">{student.grNumber}</span>
            </div>
          </div>

          {/* 18 Formatted Statutory Questions */}
          <div className="py-4 space-y-3 text-xs leading-relaxed font-sans divide-y divide-slate-200">
            <div className="flex pt-2">
              <span className="w-8 font-bold">1.</span>
              <span className="w-72 font-semibold">Name of Pupil in full:</span>
              <span className="flex-1 font-bold text-sm uppercase text-slate-950">{student.fullName}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">2.</span>
              <span className="w-72 font-semibold">Father's / Guardian's Full Name:</span>
              <span className="flex-1 font-bold text-slate-900">{student.parent?.fatherName || '-'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">3.</span>
              <span className="w-72 font-semibold">Mother's Full Name:</span>
              <span className="flex-1 font-bold text-slate-900">{student.parent?.motherName || '-'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">4.</span>
              <span className="w-72 font-semibold">Nationality &amp; Mother Tongue:</span>
              <span className="flex-1 font-medium">{student.nationality} / {student.motherTongue || 'Marathi'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">5.</span>
              <span className="w-72 font-semibold">Religion &amp; Caste Category:</span>
              <span className="flex-1 font-bold">
                {student.religion || 'Hindu'} (Category: {student.casteCategory || 'General/Open'}{student.subCaste ? ` - Sub-caste: ${student.subCaste}` : ''})
              </span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">6.</span>
              <span className="w-72 font-semibold">Place of Birth (with District &amp; State):</span>
              <span className="flex-1 font-medium">
                {student.placeOfBirth || '-'}, District: {student.district || '-'}, State: {student.state || 'Maharashtra'}
              </span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">7.</span>
              <span className="w-72 font-semibold">Date of Birth (in Figures):</span>
              <span className="flex-1 font-mono font-bold">{new Date(student.dob).toLocaleDateString()}</span>
            </div>

            <div className="flex pt-2 bg-blue-50/40 p-1 rounded">
              <span className="w-8 font-bold">8.</span>
              <span className="w-72 font-semibold">Date of Birth (in Legal Words):</span>
              <span className="flex-1 font-serif font-bold text-slate-950">{student.dobInWords}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">9.</span>
              <span className="w-72 font-semibold">Last School Attended &amp; Std Passed:</span>
              <span className="flex-1 font-medium">{student.admission?.previousSchoolName || 'Admitted directly in primary standard'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">10.</span>
              <span className="w-72 font-semibold">Date of Admission &amp; Admitted Std:</span>
              <span className="flex-1 font-medium">
                {student.admission?.admissionDate ? new Date(student.admission.admissionDate).toLocaleDateString() : '-'} (Std {student.admission?.admittedClass || student.currentClass})
              </span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">11.</span>
              <span className="w-72 font-semibold">Progress in Studies:</span>
              <span className="flex-1 font-bold text-slate-900">{transfer?.progressRemark || 'Satisfactory'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">12.</span>
              <span className="w-72 font-semibold">Conduct &amp; Character in School:</span>
              <span className="flex-1 font-bold text-slate-900">{transfer?.conductRemark || 'Good'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">13.</span>
              <span className="w-72 font-semibold">Date of Leaving School:</span>
              <span className="flex-1 font-mono font-bold">
                {transfer?.leavingDate ? new Date(transfer.leavingDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">14.</span>
              <span className="w-72 font-semibold">Standard from which Leaving:</span>
              <span className="flex-1 font-bold">Standard {transfer?.leavingClass || student.currentClass}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">15.</span>
              <span className="w-72 font-semibold">Reason for Leaving School:</span>
              <span className="flex-1 font-bold text-amber-950">{transfer?.reasonForLeaving || 'Transferred'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">16.</span>
              <span className="w-72 font-semibold">School Dues &amp; Fees Paid Up To:</span>
              <span className="flex-1 font-medium">{transfer?.duesRemarks || 'All fees and library dues cleared in full.'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">17.</span>
              <span className="w-72 font-semibold">Destination Institution:</span>
              <span className="flex-1 font-medium">{transfer?.destinationSchool || 'Not specified'}</span>
            </div>

            <div className="flex pt-2">
              <span className="w-8 font-bold">18.</span>
              <span className="w-72 font-semibold">General Remarks / Notes:</span>
              <span className="flex-1 font-medium">{transfer?.notes || 'Certified that the above information is in accordance with the School General Register.'}</span>
            </div>
          </div>

          {/* Statutory Verification Declaration */}
          <div className="pt-4 text-[10px] text-slate-600 font-serif italic text-center border-t border-slate-300">
            Certified that the above information is in accordance with the School General Register maintained under statutory educational regulations. No change in any entry in this certificate shall be made except by the authority issuing it.
          </div>

          {/* Signature Blocks and Rubber Stamp */}
          <div className="pt-14 grid grid-cols-3 gap-6 text-center text-xs font-sans print:pt-16">
            <div>
              <div className="border-t border-slate-700 w-36 mx-auto pt-1 font-bold">
                Class Teacher
              </div>
            </div>

            {/* Official Stamp Placement */}
            <div className="relative">
              <div className="border-t border-slate-700 w-36 mx-auto pt-1 font-bold">
                Head Clerk / Registrar
              </div>
              <div className="text-[9px] text-slate-400 mt-1">[ School Seal / Stamp ]</div>
            </div>

            <div>
              <div className="border-t border-slate-700 w-36 mx-auto pt-1 font-bold">
                Headmaster / Principal
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">{transfer?.approvedByName || 'Dr. Rameshwar Kulkarni'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
