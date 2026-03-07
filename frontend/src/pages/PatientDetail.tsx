import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGetUsersQuery, useGeneratePatientSummaryMutation } from '../api';
import { showToast } from '../components/Toast';
import { Icons } from '../components/Icons';
import { useAppSelector } from '../store/hooks';
import { hasPermission } from '../utils/permissions';
import { useTranslation } from 'react-i18next';
import { usePatientDetailData, usePatientDetailActions } from '../hooks/usePatientDetail';
import { PatientDetailModals } from '../components/PatientDetailModals';
import { PatientDetailTabs } from '../components/PatientDetailTabs';

type TabType = 'overview' | 'vitals' | 'diagnoses' | 'prescriptions' | 'allergies' | 'conditions' | 'timeline';

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

  const { patient, appointments, medicalHistory: history, isLoading } = usePatientDetailData(id || '');
  const { createDiagnosis, updateDiagnosis, deleteDiagnosis, createPrescription, updatePrescription, deletePrescription, createAllergy, deleteAllergy, createCondition, deleteCondition } = usePatientDetailActions(id || '');

  const [generatePatientSummary, { isLoading: isGeneratingSummary }] = useGeneratePatientSummaryMutation();

  const hasAISummary = history?.medicalRecords?.some((r: any) => r.type === 'AI_CLINICAL_NOTE' && r.title?.startsWith('Clinical Summary'));

  const tabs = [
    { id: 'overview', label: t('patients.overview'), icon: Icons.user },
    { id: 'vitals', label: t('patients.vitals'), icon: Icons.activity },
    { id: 'diagnoses', label: t('patients.diagnoses'), icon: Icons.stethoscope },
    { id: 'prescriptions', label: t('patients.prescriptions'), icon: Icons.pill },
    { id: 'allergies', label: t('patients.allergies'), icon: Icons.alert },
    { id: 'conditions', label: t('patients.conditions'), icon: Icons.heart },
    { id: 'timeline', label: t('patients.timeline'), icon: Icons.clock },
  ];

  const handleRegenerateSummary = async () => {
    try {
      const existingRecord = history?.medicalRecords?.find((r: any) => r.type === 'AI_CLINICAL_NOTE' && r.title?.startsWith('Clinical Summary'));
      setEditingRecordId(existingRecord?.id || null);
      const result = await generatePatientSummary({ patientId: id }).unwrap();
      setGeneratedSummaryText(result.generatedText);
      setShowSummaryModal(true);
    } catch {
      showToast('Failed to generate summary', 'error');
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setEditingRecordId(null);
      const result = await generatePatientSummary({ patientId: id }).unwrap();
      setGeneratedSummaryText(result.generatedText);
      setShowSummaryModal(true);
    } catch {
      showToast('Failed to generate summary', 'error');
    }
  };

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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/patients')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
            <Icons.arrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient?.firstName} {patient?.lastName}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('patients.patientID')}: {patient?.id?.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasAISummary ? (
            <button
              onClick={handleRegenerateSummary}
              disabled={isGeneratingSummary}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-60 text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 border border-gray-200 dark:border-gray-600 hover:border-purple-300 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
            >
              {isGeneratingSummary ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>
              ) : <><span>↺</span> Regenerate Summary</>}
            </button>
          ) : (
            <button
              onClick={handleGenerateSummary}
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

      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <PatientDetailTabs
        activeTab={activeTab}
        patient={patient}
        history={history}
        onShowVitalModal={() => setShowVitalModal(true)}
        onShowDiagnosisModal={() => setShowDiagnosisModal(true)}
        onShowPrescriptionModal={() => setShowPrescriptionModal(true)}
        onShowAllergyModal={() => setShowAllergyModal(true)}
        onShowConditionModal={() => setShowConditionModal(true)}
        updateDiagnosis={updateDiagnosis}
        deleteDiagnosis={deleteDiagnosis}
        updatePrescription={updatePrescription}
        deletePrescription={deletePrescription}
        deleteAllergy={deleteAllergy}
        deleteCondition={deleteCondition}
      />

      <PatientDetailModals
        patientId={id || ''}
        patient={patient}
        showVitalModal={showVitalModal}
        setShowVitalModal={setShowVitalModal}
        showDiagnosisModal={showDiagnosisModal}
        setShowDiagnosisModal={setShowDiagnosisModal}
        showPrescriptionModal={showPrescriptionModal}
        setShowPrescriptionModal={setShowPrescriptionModal}
        showAllergyModal={showAllergyModal}
        setShowAllergyModal={setShowAllergyModal}
        showConditionModal={showConditionModal}
        setShowConditionModal={setShowConditionModal}
        showSummaryModal={showSummaryModal}
        setShowSummaryModal={setShowSummaryModal}
        generatedSummaryText={generatedSummaryText}
        setGeneratedSummaryText={setGeneratedSummaryText}
        summaryIsEditing={summaryIsEditing}
        setSummaryIsEditing={setSummaryIsEditing}
        editingRecordId={editingRecordId}
        setEditingRecordId={setEditingRecordId}
        showInvoiceModal={showInvoiceModal}
        setShowInvoiceModal={setShowInvoiceModal}
        consultationAppointmentId={consultationAppointmentId}
        onComplete={() => {
          if (consultationAppointmentId) {
            navigate('/appointments');
          } else {
            setActiveTab('timeline');
          }
        }}
      />
    </div>
  );
}
