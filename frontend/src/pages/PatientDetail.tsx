import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGetPatientQuery, useGetPatientMedicalHistoryQuery, useCreateVitalMutation, useCreateDiagnosisMutation, useUpdateDiagnosisMutation, useDeleteDiagnosisMutation, useCreatePrescriptionMutation, useUpdatePrescriptionMutation, useDeletePrescriptionMutation, useCreateAllergyMutation, useDeleteAllergyMutation, useCreateConditionMutation, useDeleteConditionMutation, useGetUsersQuery, useGeneratePatientSummaryMutation, useCreateMedicalRecordMutation, useUpdateMedicalRecordMutation, useCompleteWithInvoiceMutation } from '../api';
import { showToast } from '../components/Toast';
import { Icons } from '../components/Icons';
import Modal from '../components/Modal';
import { useAppSelector } from '../store/hooks';
import { hasPermission } from '../utils/permissions';
import { useTranslation } from 'react-i18next';

interface Vitals {
  id: string;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  oxygenSat: number | null;
  recordedAt: string;
}

interface Diagnosis {
  id: string;
  icdCode: string;
  description: string;
  status: string;
  notes: string | null;
  diagnosedAt: string;
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  instructions: string | null;
  refills: number;
  refillsUsed: number;
  status: string;
  startDate: string;
  endDate: string | null;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: string;
  reaction: string | null;
}

interface Condition {
  id: string;
  name: string;
  status: string;
  notes: string | null;
  diagnosedAt: string | null;
}

type TabType = 'overview' | 'vitals' | 'diagnoses' | 'prescriptions' | 'allergies' | 'conditions' | 'timeline';

function AITimelineRecord({ record, isAI, onEdit, onRegenerate, isRegenerating }: {
  record: any; isAI: boolean;
  onEdit: () => void; onRegenerate: () => void; isRegenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="relative pl-10">
      <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${isAI ? 'bg-purple-500' : 'bg-blue-500'}`} />
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border p-4 ${isAI ? 'border-purple-100 dark:border-purple-800/40' : 'border-gray-100 dark:border-gray-700'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isAI && <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full font-medium">✨ AI Note</span>}
            <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(record.date).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAI && (
              <>
                <button onClick={onEdit} className="text-xs px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Edit">✏️ Edit</button>
                <button onClick={onRegenerate} disabled={isRegenerating} className="text-xs px-2 py-1 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 transition-colors" title="Regenerate">
                  {isRegenerating ? '...' : '↺ Regen'}
                </button>
              </>
            )}
            {isAI && record.description && (
              <button onClick={() => setExpanded(e => !e)} className="text-xs px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                {expanded ? '▲ Collapse' : '▼ Expand'}
              </button>
            )}
          </div>
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white mt-1">{record.title}</h4>
        {record.description && (
          isAI ? (
            expanded ? (
              <div className="border-t border-purple-100 dark:border-purple-800/30 pt-3 mt-3">
                <MarkdownContent text={record.description} />
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 cursor-pointer" onClick={() => setExpanded(true)}>
                {record.description.slice(0, 120).replace(/[#*_`]/g, '')}… <span className="text-purple-500">expand</span>
              </p>
            )
          ) : <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.description}</p>
        )}
      </div>
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-3" />;
        if (/^---+$/.test(line.trim())) return <hr key={i} className="border-gray-200 dark:border-gray-600 my-3" />;

        // Markdown headings
        if (/^#{1,3}\s/.test(line)) {
          const content = line.replace(/^#{1,3}\s+/, '').replace(/^\*\*|\*\*$/g, '');
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <div className="w-1 h-5 bg-purple-500 rounded-full flex-shrink-0" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">{content}</h3>
            </div>
          );
        }

        // Numbered section headers like "**1. Patient Overview**"
        if (/^\*\*\d+\.\s/.test(line)) {
          const content = line.replace(/^\*\*/, '').replace(/\*\*:?\s*$/, '').replace(/\*\*$/, '');
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <div className="w-1 h-5 bg-purple-500 rounded-full flex-shrink-0" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">{content}</h3>
            </div>
          );
        }

        const inline = (s: string) => s
          .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
          .replace(/\*([^*\n]+)\*/g, '<em class="italic">$1</em>');

        // Bullet points (including nested with spaces)
        const bulletMatch = line.match(/^(\s*)[\*\-]\s+(.*)/);
        if (bulletMatch) {
          const indent = Math.floor(bulletMatch[1].length / 4);
          return (
            <div key={i} className="flex gap-2" style={{ paddingLeft: `${indent * 16 + 12}px` }}>
              <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: inline(bulletMatch[2]) }} />
            </div>
          );
        }

        // Numbered list items like "1.  text" or "1. text"
        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
        if (numMatch && parseInt(numMatch[2]) < 20) {
          const indent = Math.floor(numMatch[1].length / 4);
          return (
            <div key={i} className="flex gap-2" style={{ paddingLeft: `${indent * 16 + 12}px` }}>
              <span className="text-purple-400 font-semibold flex-shrink-0 w-5">{numMatch[2]}.</span>
              <span dangerouslySetInnerHTML={{ __html: inline(numMatch[3]) }} />
            </div>
          );
        }

        return <p key={i} className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: inline(line) }} />;
      })}
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();
  
  const consultationMode = searchParams.get('mode') === 'consultation';
  const consultationAppointmentId = searchParams.get('appointmentId');
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [generatedSummaryText, setGeneratedSummaryText] = useState('');
  const [summaryIsEditing, setSummaryIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([{ description: 'Consultation Fee', amount: 100, quantity: 1 }]);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  
  // Consultation notes
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [assessmentPlan, setAssessmentPlan] = useState('');
  const [isEditingConsultation, setIsEditingConsultation] = useState(false);

  const { data: patient } = useGetPatientQuery(id || '');
  const { data: history, isLoading } = useGetPatientMedicalHistoryQuery(id || '', { skip: !id });
  const { data: users } = useGetUsersQuery(undefined);

  const [createVital] = useCreateVitalMutation();
  const [createDiagnosis] = useCreateDiagnosisMutation();
  const [updateDiagnosis] = useUpdateDiagnosisMutation();
  const [deleteDiagnosis] = useDeleteDiagnosisMutation();
  const [createPrescription] = useCreatePrescriptionMutation();
  const [updatePrescription] = useUpdatePrescriptionMutation();
  const [deletePrescription] = useDeletePrescriptionMutation();
  const [createAllergy] = useCreateAllergyMutation();
  const [deleteAllergy] = useDeleteAllergyMutation();
  const [createCondition] = useCreateConditionMutation();
  const [deleteCondition] = useDeleteConditionMutation();
  const [generatePatientSummary, { isLoading: isGeneratingSummary }] = useGeneratePatientSummaryMutation();
  const [createMedicalRecord, { isLoading: isSavingSummary }] = useCreateMedicalRecordMutation();
  const [updateMedicalRecord, { isLoading: isUpdatingSummary }] = useUpdateMedicalRecordMutation();
  const [completeWithInvoice, { isLoading: isCompleting }] = useCompleteWithInvoiceMutation();

  const [vitalForm, setVitalForm] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygenSat: '',
    notes: '',
  });

  const [diagnosisForm, setDiagnosisForm] = useState({
    icdCode: '',
    description: '',
    status: 'ACTIVE',
    notes: '',
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    refills: '0',
  });

  const [allergyForm, setAllergyForm] = useState({
    allergen: '',
    severity: 'MODERATE',
    reaction: '',
  });

  const [conditionForm, setConditionForm] = useState({
    name: '',
    status: 'ACTIVE',
    notes: '',
  });

  const handleVitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVital({
        patientId: id!,
        ...vitalForm,
        bloodPressureSystolic: vitalForm.bloodPressureSystolic ? parseInt(vitalForm.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: vitalForm.bloodPressureDiastolic ? parseInt(vitalForm.bloodPressureDiastolic) : undefined,
        heartRate: vitalForm.heartRate ? parseInt(vitalForm.heartRate) : undefined,
        temperature: vitalForm.temperature ? parseFloat(vitalForm.temperature) : undefined,
        weight: vitalForm.weight ? parseFloat(vitalForm.weight) : undefined,
        height: vitalForm.height ? parseFloat(vitalForm.height) : undefined,
        oxygenSat: vitalForm.oxygenSat ? parseInt(vitalForm.oxygenSat) : undefined,
      }).unwrap();
      showToast(t('medical.vitalSignsRecorded'), 'success');
      setShowVitalModal(false);
      setVitalForm({ bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', temperature: '', weight: '', height: '', oxygenSat: '', notes: '' });
    } catch (error) {
      showToast(t('medical.failedToRecordVitals'), 'error');
    }
  };

  const handleDiagnosisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDiagnosis({ patientId: id!, ...diagnosisForm }).unwrap();
      showToast(t('medical.diagnosisAdded'), 'success');
      setShowDiagnosisModal(false);
      setDiagnosisForm({ icdCode: '', description: '', status: 'ACTIVE', notes: '' });
    } catch (error) {
      showToast(t('medical.failedToAddDiagnosis'), 'error');
    }
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPrescription({ patientId: id!, ...prescriptionForm, refills: parseInt(prescriptionForm.refills) }).unwrap();
      showToast(t('medical.prescriptionAdded'), 'success');
      setShowPrescriptionModal(false);
      setPrescriptionForm({ medication: '', dosage: '', frequency: '', duration: '', instructions: '', refills: '0' });
    } catch (error) {
      showToast(t('medical.failedToAddPrescription'), 'error');
    }
  };

  const handleAllergySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAllergy({ patientId: id!, ...allergyForm }).unwrap();
      showToast(t('medical.allergyAdded'), 'success');
      setShowAllergyModal(false);
      setAllergyForm({ allergen: '', severity: 'MODERATE', reaction: '' });
    } catch (error) {
      showToast(t('medical.failedToAddAllergy'), 'error');
    }
  };

  const handleConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCondition({ patientId: id!, ...conditionForm }).unwrap();
      showToast(t('medical.conditionAdded'), 'success');
      setShowConditionModal(false);
      setConditionForm({ name: '', status: 'ACTIVE', notes: '' });
    } catch (error) {
      showToast(t('medical.failedToAddCondition'), 'error');
    }
  };

  const tabs = [
    { id: 'overview', label: t('patients.overview'), icon: Icons.user },
    { id: 'vitals', label: t('patients.vitals'), icon: Icons.activity },
    { id: 'diagnoses', label: t('patients.diagnoses'), icon: Icons.stethoscope },
    { id: 'prescriptions', label: t('patients.prescriptions'), icon: Icons.pill },
    { id: 'allergies', label: t('patients.allergies'), icon: Icons.alert },
    { id: 'conditions', label: t('patients.conditions'), icon: Icons.heart },
    { id: 'timeline', label: t('patients.timeline'), icon: Icons.clock },
  ];

  const latestVitals = history?.vitals?.[0];
  const activeDiagnoses = history?.diagnoses?.filter((d: Diagnosis) => d.status === 'ACTIVE') || [];
  const activePrescriptions = history?.prescriptions?.filter((p: Prescription) => p.status === 'ACTIVE') || [];
  const hasAISummary = history?.medicalRecords?.some((r: any) => r.type === 'AI_CLINICAL_NOTE' && r.title?.startsWith('Clinical Summary'));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="h-64 skeleton rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
            {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/patients')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
            <Icons.arrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{patient?.firstName} {patient?.lastName}</h1>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{t('patients.patientID')}: {patient?.id?.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/appointments?patientId=${patient?.id}&action=new`)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
          >
            {Icons.calendar({ size: 16 })} {t('appointments.newAppointment')}
          </button>
          <button
            onClick={() => navigate(`/invoices?patientId=${patient?.id}&action=new`)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
          >
            {Icons.plus({ size: 16 })} {t('invoices.createInvoice')}
          </button>
          {hasAISummary ? (
            <button
              onClick={async () => {
                try {
                  const existingRecord = history?.medicalRecords?.find((r: any) => r.type === 'AI_CLINICAL_NOTE' && r.title?.startsWith('Clinical Summary'));
                  setEditingRecordId(existingRecord?.id || null);
                  const result = await generatePatientSummary({ patientId: id }).unwrap();
                  setGeneratedSummaryText(result.generatedText);
                  setShowSummaryModal(true);
                } catch {
                  showToast('Failed to generate summary', 'error');
                }
              }}
              disabled={isGeneratingSummary}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-60 text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 border border-gray-200 dark:border-gray-600 hover:border-purple-300 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
              title="A summary already exists. Click to regenerate."
            >
              {isGeneratingSummary ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>
              ) : <><span>↺</span> Regenerate Summary</>}
            </button>
          ) : (
            <button
              onClick={async () => {
                try {
                  setEditingRecordId(null);
                  const result = await generatePatientSummary({ patientId: id }).unwrap();
                  setGeneratedSummaryText(result.generatedText);
                  setShowSummaryModal(true);
                } catch {
                  showToast('Failed to generate summary', 'error');
                }
              }}
              disabled={isGeneratingSummary}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {isGeneratingSummary ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>
              ) : '✨ AI Summary'}
            </button>
          )}
          {hasPermission(user, 'create_medical_records') && (
            <button onClick={() => setShowVitalModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
              + {t('medical.recordVitals')}
            </button>
          )}
        </div>
      </div>
      
      {/* Consultation Mode Banner */}
      {consultationMode && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Icons.stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Consultation in Progress</h2>
                <p className="text-orange-100 text-sm">Recording visit details for this appointment</p>
              </div>
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Icons.check className="w-5 h-5" />
              Complete Visit
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setShowVitalModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icons.activity className="w-4 h-4" /> Add Vitals
            </button>
            <button
              onClick={() => setShowDiagnosisModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icons.fileText className="w-4 h-4" /> Add Diagnosis
            </button>
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icons.pill className="w-4 h-4" /> Add Prescription
            </button>
            <button
              onClick={() => setShowSummaryModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icons.sparkle className="w-4 h-4" /> AI Summary
            </button>
          </div>
        </div>
      )}

      {/* Consultation Notes Section */}
      {consultationMode && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icons.fileText className="w-5 h-5 text-white" />
              <h3 className="text-white font-semibold">Visit Documentation</h3>
            </div>
            <button
              onClick={() => setIsEditingConsultation(!isEditingConsultation)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              {isEditingConsultation ? <Icons.check size={16} /> : <Icons.edit size={16} />}
              {isEditingConsultation ? 'Save Notes' : 'Edit Notes'}
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Chief Complaint */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Icons.alert className="w-4 h-4 text-orange-500" />
                Chief Complaint / Reason for Visit
              </label>
              {isEditingConsultation ? (
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What brings the patient in today? Describe the main symptoms or concerns..."
                />
              ) : (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl p-4">
                  {chiefComplaint ? (
                    <p className="text-gray-700 dark:text-gray-300">{chiefComplaint}</p>
                  ) : (
                    <p className="text-orange-400 italic">No chief complaint recorded. Click edit to add.</p>
                  )}
                </div>
              )}
            </div>

            {/* Physical Examination */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Icons.heart className="w-4 h-4 text-red-500" />
                Physical Examination Findings
              </label>
              {isEditingConsultation ? (
                <textarea
                  value={physicalExam}
                  onChange={(e) => setPhysicalExam(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Document relevant physical examination findings: general appearance, vital signs, system-specific findings..."
                />
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4">
                  {physicalExam ? (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{physicalExam}</p>
                  ) : (
                    <p className="text-red-400 italic">No examination findings recorded. Click edit to add.</p>
                  )}
                </div>
              )}
            </div>

            {/* Assessment & Plan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Icons.clipboard className="w-4 h-4 text-green-500" />
                Assessment & Plan
              </label>
              {isEditingConsultation ? (
                <textarea
                  value={assessmentPlan}
                  onChange={(e) => setAssessmentPlan(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your clinical assessment and treatment plan: diagnosis, medications, follow-up, patient education..."
                />
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4">
                  {assessmentPlan ? (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{assessmentPlan}</p>
                  ) : (
                    <p className="text-green-400 italic">No assessment/plan recorded. Click edit to add.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('other.patientInformation')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('common.email')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{patient?.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('common.phone')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{patient?.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('patients.dateOfBirth')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('common.address')}</span>
                <span className="font-medium text-right text-gray-900 dark:text-white">{patient?.address || '-'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
              <Icons.activity size={24} className="mb-2 text-blue-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeDiagnoses.length}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('other.activeDiagnoses')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-2xl p-5">
              <Icons.pill size={24} className="mb-2 text-purple-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{activePrescriptions.length}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('other.activeRxs')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-2xl p-5">
              <Icons.alert size={24} className="mb-2 text-red-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{history?.allergies?.length || 0}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('other.allergies')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-2xl p-5">
              <Icons.heart size={24} className="mb-2 text-green-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{history?.conditions?.length || 0}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('other.conditions')}</p>
            </div>
          </div>

          {/* Latest Vitals */}
          {latestVitals && (
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('other.latestVitals')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {latestVitals.bloodPressureSystolic && (
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.bloodPressure')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.mmhg')}</p>
                  </div>
                )}
                {latestVitals.heartRate && (
                  <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.heartRate')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.heartRate}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.bpm')}</p>
                  </div>
                )}
                {latestVitals.temperature && (
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.temperature')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.temperature}°</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.fahrenheit')}</p>
                  </div>
                )}
                {latestVitals.weight && (
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.weight')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.weight}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.kg')}</p>
                  </div>
                )}
                {latestVitals.height && (
                  <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.height')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.height}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.cm')}</p>
                  </div>
                )}
                {latestVitals.bmi && (
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.bmi')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.bmi.toFixed(1)}</p>
                  </div>
                )}
                {latestVitals.oxygenSat && (
                  <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.spo2')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.oxygenSat}%</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{t('other.recorded')}: {new Date(latestVitals.recordedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.vitalSignsHistory')}</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowVitalModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + {t('medical.recordVitals')}
              </button>
            )}
          </div>
          {history?.vitals?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.activity size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.noVitalsRecorded')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history?.vitals?.map((vital: Vitals) => (
                <div key={vital.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-2">{new Date(vital.recordedAt).toLocaleString()}</p>
                  <div className="flex flex-wrap gap-4">
                    {vital.bloodPressureSystolic && (
                      <div className="text-center px-3 py-1 bg-red-50 dark:bg-red-900/30 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.bp')}</span>
                        <p className="font-semibold text-gray-900 dark:text-white">{vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}</p>
                      </div>
                    )}
                    {vital.heartRate && (
                      <div className="text-center px-3 py-1 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.hr')}</span>
                        <p className="font-semibold text-gray-900 dark:text-white">{vital.heartRate}</p>
                      </div>
                    )}
                    {vital.temperature && (
                      <div className="text-center px-3 py-1 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.temp')}</span>
                        <p className="font-semibold text-gray-900 dark:text-white">{vital.temperature}°F</p>
                      </div>
                    )}
                    {vital.weight && (
                      <div className="text-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.wt')}</span>
                        <p className="font-semibold text-gray-900 dark:text-white">{vital.weight}kg</p>
                      </div>
                    )}
                    {vital.bmi && (
                      <div className="text-center px-3 py-1 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.bmi')}</span>
                        <p className="font-semibold text-gray-900 dark:text-white">{vital.bmi.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'diagnoses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.diagnosesIcd')}</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowDiagnosisModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + {t('medical.addDiagnosis')}
              </button>
            )}
          </div>
          {history?.diagnoses?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.stethoscope size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.noDiagnosesRecorded')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history?.diagnoses?.map((diagnosis: Diagnosis) => (
                <div key={diagnosis.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">{diagnosis.icdCode}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        diagnosis.status === 'ACTIVE' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                        diagnosis.status === 'CHRONIC' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      }`}>{t(`medical.${diagnosis.status.toLowerCase()}`)}</span>
                    </div>
                    <p className="font-medium mt-1 text-gray-900 dark:text-white">{diagnosis.description}</p>
                    {diagnosis.notes && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{diagnosis.notes}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('other.diagnosed')}: {new Date(diagnosis.diagnosedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {hasPermission(user, 'create_medical_records') && (
                      <select
                        value={diagnosis.status}
                        onChange={async (e) => {
                          try {
                            await updateDiagnosis({ id: diagnosis.id, status: e.target.value }).unwrap();
                            showToast(t('medical.diagnosisUpdated'), 'success');
                          } catch (error) {
                            showToast(t('medical.failedToUpdate'), 'error');
                          }
                        }}
                        className="text-sm border rounded-lg px-2 py-1 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                      >
                        <option value="ACTIVE">{t('medical.active')}</option>
                        <option value="CHRONIC">{t('medical.chronic')}</option>
                        <option value="RESOLVED">{t('medical.resolved')}</option>
                      </select>
                    )}
                    {hasPermission(user, 'create_medical_records') && (
                      <button
                        onClick={async () => {
                          if (confirm(t('other.confirmDelete') + ' diagnosis?')) {
                            try {
                              await deleteDiagnosis({ id: diagnosis.id, patientId: id! }).unwrap();
                              showToast(t('medical.diagnosisDeleted'), 'success');
                            } catch (err) {
                              showToast(t('medical.failedToDeleteDiagnosis'), 'error');
                            }
                          }
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Icons.trash size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.prescriptions')}</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowPrescriptionModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + {t('other.addPrescription')}
              </button>
            )}
          </div>
          {history?.prescriptions?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.pill size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.noPrescriptions')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history?.prescriptions?.map((rx: Prescription) => (
                <div key={rx.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{rx.medication}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          rx.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>{t(`medical.${rx.status.toLowerCase()}`)}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{rx.dosage} - {rx.frequency}</p>
                      {rx.duration && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.duration')}: {rx.duration}</p>}
                      {rx.instructions && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{t('other.instructions')}: {rx.instructions}</p>}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {t('other.started')}: {new Date(rx.startDate).toLocaleDateString()}
                        {rx.endDate && ` - ${t('other.ended')}: ${new Date(rx.endDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {rx.status === 'ACTIVE' && (
                        <button
                          onClick={async () => {
                            try {
                              await updatePrescription({ id: rx.id, patientId: id, status: 'COMPLETED' }).unwrap();
                              showToast(t('medical.prescriptionCompleted'), 'success');
                            } catch (err) {
                              showToast(t('medical.failedToUpdatePrescription'), 'error');
                            }
                          }}
                          className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        >
                          {t('other.markComplete')}
                        </button>
                        )}
                        {hasPermission(user, 'create_medical_records') && (
                          <button
                            onClick={async () => {
                              if (confirm(t('other.deleteThisPrescription'))) {
                                try {
                                  await deletePrescription({ id: rx.id, patientId: id }).unwrap();
                                  showToast(t('medical.prescriptionDeleted'), 'success');
                                } catch (err) {
                                  showToast(t('medical.failedToDeletePrescription'), 'error');
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Icons.trash size={18} />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'allergies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.allergies')}</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowAllergyModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + {t('other.addAllergy')}
              </button>
            )}
          </div>
          {history?.allergies?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.alert size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.noAllergiesRecorded')}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {history?.allergies?.map((allergy: Allergy) => (
                <div key={allergy.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{allergy.allergen}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        allergy.severity === 'SEVERE' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                        allergy.severity === 'MODERATE' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      }`}>{t(`medical.${allergy.severity.toLowerCase()}`)}</span>
                    </div>
                    {allergy.reaction && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{t('other.reaction')}: {allergy.reaction}</p>}
                  </div>
                  {hasPermission(user, 'create_medical_records') && (
                    <button
                      onClick={async () => {
                        if (confirm(t('other.deleteThisAllergy'))) {
                          try {
                            await deleteAllergy({ id: allergy.id, patientId: id }).unwrap();
                            showToast(t('medical.allergyDeleted'), 'success');
                          } catch (err) {
                            showToast(t('medical.failedToDeleteAllergy'), 'error');
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Icons.trash size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'conditions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.medicalConditions')}</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowConditionModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + {t('other.addCondition')}
              </button>
            )}
          </div>
          {history?.conditions?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.heart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.noConditionsRecorded')}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {history?.conditions?.map((condition: Condition) => (
                <div key={condition.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{condition.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        condition.status === 'ACTIVE' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                        condition.status === 'CHRONIC' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      }`}>{t(`medical.${condition.status.toLowerCase()}`)}</span>
                    </div>
                    {condition.notes && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{condition.notes}</p>}
                    {condition.diagnosedAt && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('other.diagnosed')}: {new Date(condition.diagnosedAt).toLocaleDateString()}</p>}
                  </div>
                  {hasPermission(user, 'create_medical_records') && (
                    <button
                      onClick={async () => {
                        if (confirm(t('other.deleteThisCondition'))) {
                          try {
                            await deleteCondition({ id: condition.id, patientId: id }).unwrap();
                            showToast(t('medical.conditionDeleted'), 'success');
                          } catch (err) {
                            showToast(t('medical.failedToDeleteCondition'), 'error');
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Icons.trash size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.medicalTimeline')}</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-4">
              {history?.medicalRecords?.map((record: any, index: number) => {
                const isAI = record.type === 'AI_CLINICAL_NOTE';
                return (
                <AITimelineRecord
                  key={index}
                  record={record}
                  isAI={isAI}
                  onEdit={() => {
                    setEditingRecordId(record.id);
                    setGeneratedSummaryText(record.description || '');
                    setSummaryIsEditing(true);
                    setShowSummaryModal(true);
                  }}
                  onRegenerate={async () => {
                    try {
                      setEditingRecordId(record.id);
                      const result = await generatePatientSummary({ patientId: id }).unwrap();
                      setGeneratedSummaryText(result.generatedText);
                      setShowSummaryModal(true);
                    } catch {
                      showToast('Failed to regenerate summary', 'error');
                    }
                  }}
                  isRegenerating={isGeneratingSummary}
                />
              )})}
              {history?.labResults?.slice(0, 5).map((lab: any, index: number) => (
                <div key={`lab-${index}`} className="relative pl-10">
                  <div className="absolute left-2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(lab.orderedAt).toLocaleString()}</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{t('other.lab')}: {lab.testName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{lab.status === 'COMPLETED' ? t('appointments.completed') : lab.status === 'PENDING' ? t('other.statusPending') : lab.status} {lab.result && `- ${lab.result}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showVitalModal} onClose={() => setShowVitalModal(false)} title={t('medical.recordVitals')}>
        <div className="p-6">
          <form onSubmit={handleVitalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.bpSystolic')}</label>
                  <input type="number" value={vitalForm.bloodPressureSystolic} onChange={e => setVitalForm({...vitalForm, bloodPressureSystolic: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="120" placeholder-gray-500 />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.bpDiastolic')}</label>
                  <input type="number" value={vitalForm.bloodPressureDiastolic} onChange={e => setVitalForm({...vitalForm, bloodPressureDiastolic: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="80" placeholder-gray-500 />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.heartRateBpm')}</label>
                  <input type="number" value={vitalForm.heartRate} onChange={e => setVitalForm({...vitalForm, heartRate: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="72" placeholder-gray-500 />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.temperatureF')}</label>
                  <input type="number" step="0.1" value={vitalForm.temperature} onChange={e => setVitalForm({...vitalForm, temperature: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="98.6" placeholder-gray-500 />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.weightKg')}</label>
                  <input type="number" step="0.1" value={vitalForm.weight} onChange={e => setVitalForm({...vitalForm, weight: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="70" placeholder-gray-500 />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.heightCm')}</label>
                  <input type="number" value={vitalForm.height} onChange={e => setVitalForm({...vitalForm, height: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="170" placeholder-gray-500 />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.spo2')}</label>
                  <input type="number" value={vitalForm.oxygenSat} onChange={e => setVitalForm({...vitalForm, oxygenSat: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="98" placeholder-gray-500 />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('common.notes')}</label>
                <textarea value={vitalForm.notes} onChange={e => setVitalForm({...vitalForm, notes: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowVitalModal(false)} className="flex-1 border border-gray-200 dark:border-gray-600 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">{t('common.save')}</button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showDiagnosisModal} onClose={() => setShowDiagnosisModal(false)} title={t('medical.addDiagnosis')}>
        <div className="p-6">
          <form onSubmit={handleDiagnosisSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.icdCode')}</label>
                <input type="text" value={diagnosisForm.icdCode} onChange={e => setDiagnosisForm({...diagnosisForm, icdCode: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="J06.9" placeholder-gray-500 required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('common.description')}</label>
                <input type="text" value={diagnosisForm.description} onChange={e => setDiagnosisForm({...diagnosisForm, description: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Acute upper respiratory infection" placeholder-gray-500 required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('common.status')}</label>
                <select value={diagnosisForm.status} onChange={e => setDiagnosisForm({...diagnosisForm, status: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="ACTIVE">{t('medical.active')}</option>
                  <option value="CHRONIC">{t('medical.chronic')}</option>
                  <option value="RESOLVED">{t('medical.resolved')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('common.notes')}</label>
                <textarea value={diagnosisForm.notes} onChange={e => setDiagnosisForm({...diagnosisForm, notes: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDiagnosisModal(false)} className="flex-1 border py-2 rounded-lg">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">{t('common.save')}</button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showPrescriptionModal} onClose={() => setShowPrescriptionModal(false)} title={t('other.addPrescription')}>
        <div className="p-6">
          <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.medication')}</label>
                <input type="text" value={prescriptionForm.medication} onChange={e => setPrescriptionForm({...prescriptionForm, medication: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.dosage')}</label>
                  <input type="text" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="500mg" placeholder-gray-500 required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.frequency')}</label>
                  <input type="text" value={prescriptionForm.frequency} onChange={e => setPrescriptionForm({...prescriptionForm, frequency: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="3 times daily" placeholder-gray-500 required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.duration')}</label>
                  <input type="text" value={prescriptionForm.duration} onChange={e => setPrescriptionForm({...prescriptionForm, duration: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="7 days" placeholder-gray-500 />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.refills')}</label>
                  <input type="number" value={prescriptionForm.refills} onChange={e => setPrescriptionForm({...prescriptionForm, refills: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.instructions')}</label>
                <textarea value={prescriptionForm.instructions} onChange={e => setPrescriptionForm({...prescriptionForm, instructions: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPrescriptionModal(false)} className="flex-1 border py-2 rounded-lg">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">{t('common.save')}</button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showAllergyModal} onClose={() => setShowAllergyModal(false)} title={t('other.addAllergy')}>
        <div className="p-6">
          <form onSubmit={handleAllergySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.allergen')}</label>
                <input type="text" value={allergyForm.allergen} onChange={e => setAllergyForm({...allergyForm, allergen: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Penicillin" placeholder-gray-500 required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.severity')}</label>
                <select value={allergyForm.severity} onChange={e => setAllergyForm({...allergyForm, severity: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="MILD">{t('other.mild')}</option>
                  <option value="MODERATE">{t('other.moderate')}</option>
                  <option value="SEVERE">{t('other.severe')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.reaction')}</label>
                <input type="text" value={allergyForm.reaction} onChange={e => setAllergyForm({...allergyForm, reaction: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Rash, swelling" placeholder-gray-500 />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAllergyModal(false)} className="flex-1 border py-2 rounded-lg">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">{t('common.save')}</button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showConditionModal} onClose={() => setShowConditionModal(false)} title={t('other.addCondition')}>
        <div className="p-6">
          <form onSubmit={handleConditionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.condition')}</label>
                <input type="text" value={conditionForm.name} onChange={e => setConditionForm({...conditionForm, name: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Diabetes Type 2" placeholder-gray-500 required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('common.status')}</label>
                <select value={conditionForm.status} onChange={e => setConditionForm({...conditionForm, status: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="ACTIVE">{t('medical.active')}</option>
                  <option value="CHRONIC">{t('medical.chronic')}</option>
                  <option value="RESOLVED">{t('medical.resolved')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('common.notes')}</label>
                <textarea value={conditionForm.notes} onChange={e => setConditionForm({...conditionForm, notes: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowConditionModal(false)} className="flex-1 border py-2 rounded-lg">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">{t('common.save')}</button>
              </div>
            </form>
        </div>
      </Modal>

      {/* AI Patient Summary Modal */}
      <Modal isOpen={showSummaryModal} onClose={() => { setShowSummaryModal(false); setSummaryIsEditing(false); setEditingRecordId(null); }} title="✨ AI Clinical Summary">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">AI-generated clinical summary — click to edit</p>
            <button onClick={() => setSummaryIsEditing(!summaryIsEditing)} className="text-xs px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
              {summaryIsEditing ? '👁 Preview' : '✏️ Edit'}
            </button>
          </div>
          {summaryIsEditing ? (
            <textarea
              value={generatedSummaryText}
              onChange={(e) => setGeneratedSummaryText(e.target.value)}
              rows={22}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
              autoFocus
            />
          ) : (
            <div
              onClick={() => setSummaryIsEditing(true)}
              className="cursor-text max-h-[32rem] overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              <MarkdownContent text={generatedSummaryText} />
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setShowSummaryModal(false); setSummaryIsEditing(false); setEditingRecordId(null); }}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Discard
            </button>
            <button
              onClick={async () => {
                try {
                  if (editingRecordId) {
                    await updateMedicalRecord({
                      id: editingRecordId,
                      patientId: id,
                      title: `Clinical Summary - ${new Date().toLocaleDateString()}`,
                      description: generatedSummaryText,
                      data: { generatedBy: 'gemini-2.5-flash' },
                    }).unwrap();
                  } else {
                    await createMedicalRecord({
                      patientId: id,
                      type: 'AI_CLINICAL_NOTE',
                      title: `Clinical Summary - ${new Date().toLocaleDateString()}`,
                      description: generatedSummaryText,
                      data: { generatedBy: 'gemini-2.5-flash' },
                    }).unwrap();
                  }
                  showToast('Summary saved to medical records', 'success');
                  setShowSummaryModal(false);
                  setSummaryIsEditing(false);
                  setGeneratedSummaryText('');
                  setEditingRecordId(null);
                  setActiveTab('timeline');
                } catch {
                  showToast('Failed to save summary', 'error');
                }
              }}
              disabled={isSavingSummary || isUpdatingSummary}
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors"
            >
              {(isSavingSummary || isUpdatingSummary) ? 'Saving...' : 'Save to Records'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Complete Visit - Invoice Modal */}
      <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Complete Visit" size="xl">
        <div className="space-y-6">
          {/* Invoice Preview - Real World Design */}
          <div className="bg-white border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">INVOICE</h3>
                  <p className="text-slate-300 text-sm">Medora Health Clinic</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">#{new Date().getFullYear()}-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                  <p className="text-slate-300 text-sm">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Patient & Provider Info */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Bill To</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">{patient?.firstName} {patient?.lastName}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Patient ID: {patient?.id?.slice(0, 8)}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{patient?.dateOfBirth ? `DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Provider</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.role}</p>
                </div>
              </div>
            </div>

            {/* Invoice Items Table */}
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                    <th className="text-left py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</th>
                    <th className="text-center py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 w-20">Qty</th>
                    <th className="text-right py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 w-28">Unit Price</th>
                    <th className="text-right py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.filter(item => item.description && item.amount > 0).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 text-gray-900 dark:text-white">{item.description}</td>
                      <td className="py-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-300">${item.amount.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium text-gray-900 dark:text-white">${(item.amount * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  {invoiceItems.filter(item => item.description && item.amount > 0).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">No items added yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span>${invoiceItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-green-600">${invoiceItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 dark:bg-slate-700 p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Thank you for choosing Medora Health Clinic!</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Payment is due within 30 days. Please contact us for payment arrangements.</p>
            </div>
          </div>

          {/* Edit Section - Collapsible */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <button
              onClick={() => {
                const el = document.getElementById('invoice-edit-section');
                if (el) el.classList.toggle('hidden');
              }}
              className="w-full px-4 py-3 flex items-center justify-between text-amber-800 dark:text-amber-200 font-medium"
            >
              <span className="flex items-center gap-2">
                <Icons.edit size={18} />
                Edit Invoice Items
              </span>
              <Icons.chevronDown size={18} />
            </button>
            <div id="invoice-edit-section" className="hidden px-4 pb-4 space-y-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center bg-white dark:bg-gray-800 p-2 rounded-lg">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...invoiceItems];
                        newItems[index].description = e.target.value;
                        setInvoiceItems(newItems);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...invoiceItems];
                        newItems[index].quantity = parseInt(e.target.value) || 1;
                        setInvoiceItems(newItems);
                      }}
                      className="w-16 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...invoiceItems];
                        newItems[index].amount = parseFloat(e.target.value) || 0;
                        setInvoiceItems(newItems);
                      }}
                      className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== index))}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Icons.trash size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setInvoiceItems([...invoiceItems, { description: '', amount: 0, quantity: 1 }])}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Icons.plus size={16} /> Add Item
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Notes</label>
                <textarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Optional notes for the invoice..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!consultationAppointmentId) return;
                try {
                  const result = await completeWithInvoice({
                    id: consultationAppointmentId,
                    items: invoiceItems.filter(item => item.description && item.amount > 0),
                    notes: invoiceNotes,
                  }).unwrap();
                  showToast(`Visit completed! Invoice #${result.invoice.id.slice(0, 8)} created.`, 'success');
                  setShowInvoiceModal(false);
                  navigate('/appointments');
                } catch (err: any) {
                  showToast(err?.data?.error || 'Failed to complete visit', 'error');
                }
              }}
              disabled={isCompleting || invoiceItems.filter(i => i.description && i.amount > 0).length === 0}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {isCompleting ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</>
              ) : (
                <><Icons.check size={18} /> Complete Visit & Create Invoice</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
