'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import {
  User,
  ArrowLeft,
  Calendar,
  BookOpen,
  School,
  MapPin,
  FileText,
  UserMinus,
  History,
  ShieldCheck,
  Edit,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Paperclip,
  ZoomIn,
  Eye,
} from 'lucide-react';

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { user, hasPerm } = useAuth();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'academic' | 'parents' | 'transfer' | 'documents' | 'history'>('overview');

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        setEditData({
          grNumber: data.student.grNumber,
          firstName: data.student.firstName,
          middleName: data.student.middleName || '',
          lastName: data.student.lastName,
          dob: data.student.dob.slice(0, 10),
          gender: data.student.gender,
          currentClass: data.student.currentClass,
          currentDivision: data.student.currentDivision,
          rollNumber: data.student.rollNumber || '',
          casteCategory: data.student.casteCategory || 'General/Open',
          subCaste: data.student.subCaste || '',
          religion: data.student.religion || '',
          fatherName: data.student.parent?.fatherName || '',
          fatherOccupation: data.student.parent?.fatherOccupation || '',
          fatherPhone: data.student.parent?.fatherPhone || '',
          motherName: data.student.parent?.motherName || '',
          motherPhone: data.student.parent?.motherPhone || '',
          addressLine1: data.student.parent?.addressLine1 || '',
          city: data.student.parent?.city || '',
          pincode: data.student.parent?.pincode || '',
        });
      }
    } catch (err) {
      console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update record');

      setSuccessMsg('Student record updated and audit log entry created.');
      setIsEditing(false);
      fetchStudent();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading student profile...</div>;
  }

  if (!student) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Student Record Not Found</h2>
        <Link href="/students" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
          Return to Directory
        </Link>
      </div>
    );
  }

  const isTransferred = student.status === 'TRANSFERRED' || student.status === 'WITHDRAWN' || student.status === 'GRADUATED';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation & Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{student.fullName}</h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                {student.grNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Std {student.currentClass}-{student.currentDivision} • Admission No: {student.admissionNumber || 'N/A'} • Enrolled: {new Date(student.admission?.admissionDate || student.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasPerm('canEditStudents') && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Edit size={14} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          )}

          {!isTransferred && hasPerm('canTransferStudents') && (
            <Link
              href={`/students/${student.id}/transfer`}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserMinus size={14} />
              <span>Transfer / Discharge</span>
            </Link>
          )}

          {isTransferred && (
            <Link
              href={`/certificates/tc/${student.id}`}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer size={14} />
              <span>Print TC Certificate</span>
            </Link>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Status Warning Banner for Transferred Students */}
      {isTransferred && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 mt-0.5">
              <UserMinus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Student Status: {student.status} (Preserved Historical Archive)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                This student was transferred/discharged from the school on{' '}
                <strong>{student.transfer ? new Date(student.transfer.leavingDate).toLocaleDateString() : 'N/A'}</strong> under TC No:{' '}
                <strong>{student.transfer?.tcNumber || 'N/A'}</strong>. The permanent register entry remains legally archived.
              </p>
            </div>
          </div>
          {student.transfer && (
            <Link
              href={`/certificates/tc/${student.id}`}
              className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              View TC Record
            </Link>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview & ID' },
          { id: 'personal', label: 'Personal & DOB' },
          { id: 'academic', label: 'Academic & Admission' },
          { id: 'parents', label: 'Parent & Contacts' },
          { id: 'transfer', label: 'Transfer / Exit Details', badge: isTransferred ? student.status : null },
          { id: 'documents', label: `Documents & Scans (${student.documents?.length || 0})` },
          { id: 'history', label: `Audit Log (${student.auditLogs?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student ID Card Replica */}
          <div className="bg-linear-to-b from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <School size={16} className="text-blue-400" />
                <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                  Student Identity Card
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                student.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {student.status}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xl font-bold text-blue-300">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{student.fullName}</h3>
                <p className="text-xs text-slate-400 font-mono">GR No: {student.grNumber}</p>
                <p className="text-xs text-blue-400 font-semibold mt-0.5">
                  Std {student.currentClass} - Div {student.currentDivision}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-700/80">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Date of Birth</span>
                <span className="font-semibold">{new Date(student.dob).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Blood Group</span>
                <span className="font-semibold">{student.bloodGroup || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Father Phone</span>
                <span className="font-semibold truncate">{student.parent?.fatherPhone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Category</span>
                <span className="font-semibold">{student.casteCategory || 'General'}</span>
              </div>
            </div>
          </div>

          {/* Quick Summary Grid */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">General Register Highlights</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Permanent GR No</span>
                  <span className="font-bold font-mono text-blue-700 text-sm">{student.grNumber}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Admission Number</span>
                  <span className="font-bold text-slate-800">{student.admissionNumber || '-'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Admission Date</span>
                  <span className="font-bold text-slate-800">
                    {student.admission?.admissionDate ? new Date(student.admission.admissionDate).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Religion / Caste</span>
                  <span className="font-bold text-slate-800">
                    {student.religion || '-'} ({student.casteCategory || 'Open'})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Mother Tongue</span>
                  <span className="font-bold text-slate-800">{student.motherTongue || '-'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Place of Birth</span>
                  <span className="font-bold text-slate-800">{student.placeOfBirth || '-'}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-600" />
                  <span>DOB in Legal Words:</span>
                </div>
                <p className="font-medium pl-5">{student.dobInWords || 'Not converted'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Personal Details */}
      {activeTab === 'personal' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Personal &amp; Demographic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Full Legal Name</span>
              <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">First Name</span>
              <span className="font-semibold text-slate-800">{student.firstName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Middle Name</span>
              <span className="font-semibold text-slate-800">{student.middleName || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Last Name / Surname</span>
              <span className="font-semibold text-slate-800">{student.lastName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Date of Birth (Figures)</span>
              <span className="font-semibold text-slate-800">{new Date(student.dob).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Gender</span>
              <span className="font-semibold text-slate-800">{student.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Blood Group</span>
              <span className="font-semibold text-slate-800">{student.bloodGroup || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Aadhar UID</span>
              <span className="font-semibold text-slate-800">{student.aadharNumber || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Nationality</span>
              <span className="font-semibold text-slate-800">{student.nationality}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Religion</span>
              <span className="font-semibold text-slate-800">{student.religion || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Caste Category</span>
              <span className="font-semibold text-slate-800">{student.casteCategory || 'General/Open'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Sub-caste</span>
              <span className="font-semibold text-slate-800">{student.subCaste || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Mother Tongue</span>
              <span className="font-semibold text-slate-800">{student.motherTongue || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Place of Birth</span>
              <span className="font-semibold text-slate-800">{student.placeOfBirth || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Taluka / District / State</span>
              <span className="font-semibold text-slate-800">
                {student.taluka || '-'}, {student.district || '-'}, {student.state || 'Maharashtra'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Academic Details */}
      {activeTab === 'academic' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Academic &amp; Admission Records
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Current Standard &amp; Division</span>
              <span className="font-bold text-slate-900 text-sm">
                Std {student.currentClass} - Division {student.currentDivision}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Roll Number</span>
              <span className="font-semibold text-slate-800">{student.rollNumber || 'Not assigned'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Academic Session</span>
              <span className="font-semibold text-slate-800">{student.academicYear}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Date of First Admission</span>
              <span className="font-semibold text-slate-800">
                {student.admission?.admissionDate ? new Date(student.admission.admissionDate).toLocaleDateString() : '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Class in Which Admitted</span>
              <span className="font-semibold text-slate-800">
                Std {student.admission?.admittedClass || student.currentClass}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Previous School Attended</span>
              <span className="font-semibold text-slate-800">{student.admission?.previousSchoolName || 'None'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Previous TC / LC No.</span>
              <span className="font-semibold text-slate-800">{student.admission?.previousTcNumber || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Parent & Guardian Details */}
      {activeTab === 'parents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Parent &amp; Guardian Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Father's Name</span>
              <span className="font-bold text-slate-900">{student.parent?.fatherName || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Father's Occupation</span>
              <span className="font-semibold text-slate-800">{student.parent?.fatherOccupation || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Father's Contact Phone</span>
              <span className="font-semibold text-slate-800">{student.parent?.fatherPhone || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Mother's Name</span>
              <span className="font-bold text-slate-900">{student.parent?.motherName || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Mother's Occupation</span>
              <span className="font-semibold text-slate-800">{student.parent?.motherOccupation || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Mother's Contact Phone</span>
              <span className="font-semibold text-slate-800">{student.parent?.motherPhone || '-'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-400 text-[10px] uppercase block">Residential Address</span>
              <span className="font-semibold text-slate-800">{student.parent?.addressLine1 || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">City &amp; Pincode</span>
              <span className="font-semibold text-slate-800">
                {student.parent?.city || '-'} - {student.parent?.pincode || '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Transfer Details */}
      {activeTab === 'transfer' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">
              Transfer / School Leaving Certificate Record
            </h3>
            {student.transfer && (
              <Link
                href={`/certificates/tc/${student.id}`}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1"
              >
                <Printer size={13} />
                <span>Print Official TC</span>
              </Link>
            )}
          </div>

          {student.transfer ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase block">Transfer Certificate No</span>
                <span className="font-mono font-bold text-amber-700 text-sm">{student.transfer.tcNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase block">Date of Leaving School</span>
                <span className="font-bold text-slate-800">
                  {new Date(student.transfer.leavingDate).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase block">Standard from which Leaving</span>
                <span className="font-bold text-slate-800">Std {student.transfer.leavingClass}</span>
              </div>
              <div className="md:col-span-2 p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase block">Reason for Leaving</span>
                <span className="font-bold text-slate-800">{student.transfer.reasonForLeaving}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase block">Conduct &amp; Progress</span>
                <span className="font-bold text-slate-800">
                  {student.transfer.conductRemark} / {student.transfer.progressRemark}
                </span>
              </div>
              <div className="md:col-span-2 p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase block">Destination School / College</span>
                <span className="font-semibold text-slate-800">{student.transfer.destinationSchool || 'Not specified'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase block">Approved By Administrator</span>
                <span className="font-semibold text-slate-800">{student.transfer.approvedByName || 'Principal'}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500">
              <p className="font-medium">Student is currently actively enrolled.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                No transfer certificate or exit record has been issued.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Documents & Original GR Scan */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Attached Documents &amp; Original GR Scans
              </h3>
              <p className="text-xs text-slate-500">
                Permanent link between digital record and historical physical register scan
              </p>
            </div>
          </div>

          {student.documents?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.documents.map((doc: any) => (
                <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                        <Paperclip size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800">{doc.fileName}</div>
                        <div className="text-[10px] text-slate-400">
                          {doc.documentType} • Page {doc.pageNumber || 1}
                        </div>
                      </div>
                    </div>
                    {doc.isOriginalGrScan && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Original GR Scan
                      </span>
                    )}
                  </div>

                  {/* Document preview if SVG/Image */}
                  {doc.fileUrl && (
                    <div className="h-48 border border-slate-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={doc.fileUrl}
                        alt="Scanned Document Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
              No attached documents or historical scan links for this student record.
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Immutable Audit History for this Student Record
          </h3>

          <div className="space-y-3">
            {student.auditLogs?.length > 0 ? (
              student.auditLogs.map((log: any) => (
                <div key={log.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.userName || 'System'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                        {log.actionType}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">No audit events recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* In-place Edit Drawer / Form Modal */}
      {isEditing && (
        <div className="p-6 rounded-2xl bg-white border-2 border-blue-500 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Edit Student General Register Record
            </h3>
            <span className="text-xs text-slate-500">All modifications will be logged in the audit trail</span>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">First Name</label>
                <input
                  type="text"
                  value={editData.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Middle Name</label>
                <input
                  type="text"
                  value={editData.middleName}
                  onChange={(e) => setEditData({ ...editData, middleName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                <input
                  type="text"
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editData.dob}
                  onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Class / Standard</label>
                <input
                  type="text"
                  value={editData.currentClass}
                  onChange={(e) => setEditData({ ...editData, currentClass: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Division</label>
                <input
                  type="text"
                  value={editData.currentDivision}
                  onChange={(e) => setEditData({ ...editData, currentDivision: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Caste Category</label>
                <input
                  type="text"
                  value={editData.casteCategory}
                  onChange={(e) => setEditData({ ...editData, casteCategory: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
              >
                {saveLoading ? 'Saving...' : 'Save & Record Audit Diff'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
