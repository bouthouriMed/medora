import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPatientQuery, useGetPatientMedicalHistoryQuery, useCreateVitalMutation, useCreateDiagnosisMutation, useUpdateDiagnosisMutation, useDeleteDiagnosisMutation, useCreatePrescriptionMutation, useUpdatePrescriptionMutation, useDeletePrescriptionMutation, useCreateAllergyMutation, useDeleteAllergyMutation, useCreateConditionMutation, useDeleteConditionMutation, useGetUsersQuery } from '../api';
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

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

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
      showToast('Vital signs recorded!', 'success');
      setShowVitalModal(false);
      setVitalForm({ bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', temperature: '', weight: '', height: '', oxygenSat: '', notes: '' });
    } catch (error) {
      showToast('Failed to record vitals', 'error');
    }
  };

  const handleDiagnosisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDiagnosis({ patientId: id!, ...diagnosisForm }).unwrap();
      showToast('Diagnosis added!', 'success');
      setShowDiagnosisModal(false);
      setDiagnosisForm({ icdCode: '', description: '', status: 'ACTIVE', notes: '' });
    } catch (error) {
      showToast('Failed to add diagnosis', 'error');
    }
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPrescription({ patientId: id!, ...prescriptionForm, refills: parseInt(prescriptionForm.refills) }).unwrap();
      showToast('Prescription added!', 'success');
      setShowPrescriptionModal(false);
      setPrescriptionForm({ medication: '', dosage: '', frequency: '', duration: '', instructions: '', refills: '0' });
    } catch (error) {
      showToast('Failed to add prescription', 'error');
    }
  };

  const handleAllergySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAllergy({ patientId: id!, ...allergyForm }).unwrap();
      showToast('Allergy added!', 'success');
      setShowAllergyModal(false);
      setAllergyForm({ allergen: '', severity: 'MODERATE', reaction: '' });
    } catch (error) {
      showToast('Failed to add allergy', 'error');
    }
  };

  const handleConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCondition({ patientId: id!, ...conditionForm }).unwrap();
      showToast('Condition added!', 'success');
      setShowConditionModal(false);
      setConditionForm({ name: '', status: 'ACTIVE', notes: '' });
    } catch (error) {
      showToast('Failed to add condition', 'error');
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
          <button onClick={() => navigate('/patients')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Icons.arrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{patient?.firstName} {patient?.lastName}</h1>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{t('patients.patientID')}: {patient?.id?.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission(user, 'create_medical_records') && (
            <button onClick={() => setShowVitalModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
              + {t('medical.recordVitals')}
            </button>
          )}
        </div>
      </div>

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
            <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Email</span>
                <span className="font-medium">{patient?.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Phone</span>
                <span className="font-medium">{patient?.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Date of Birth</span>
                <span className="font-medium">{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Address</span>
                <span className="font-medium text-right">{patient?.address || '-'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
              <Icons.activity size={24} className="mb-2" />
              <p className="text-3xl font-bold">{activeDiagnoses.length}</p>
              <p className="text-blue-100">Active Diagnoses</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
              <Icons.pill size={24} className="mb-2" />
              <p className="text-3xl font-bold">{activePrescriptions.length}</p>
              <p className="text-purple-100">Active Rxs</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
              <Icons.alert size={24} className="mb-2" />
              <p className="text-3xl font-bold">{history?.allergies?.length || 0}</p>
              <p className="text-red-100">Allergies</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
              <Icons.heart size={24} className="mb-2" />
              <p className="text-3xl font-bold">{history?.conditions?.length || 0}</p>
              <p className="text-green-100">Conditions</p>
            </div>
          </div>

          {/* Latest Vitals */}
          {latestVitals && (
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Latest Vitals</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {latestVitals.bloodPressureSystolic && (
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Blood Pressure</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}</p>
                    <p className="text-xs text-gray-400">mmHg</p>
                  </div>
                )}
                {latestVitals.heartRate && (
                  <div className="text-center p-3 bg-pink-50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Heart Rate</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.heartRate}</p>
                    <p className="text-xs text-gray-400">bpm</p>
                  </div>
                )}
                {latestVitals.temperature && (
                  <div className="text-center p-3 bg-orange-50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Temperature</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.temperature}°</p>
                    <p className="text-xs text-gray-400">F</p>
                  </div>
                )}
                {latestVitals.weight && (
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Weight</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.weight}</p>
                    <p className="text-xs text-gray-400">kg</p>
                  </div>
                )}
                {latestVitals.height && (
                  <div className="text-center p-3 bg-indigo-50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Height</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.height}</p>
                    <p className="text-xs text-gray-400">cm</p>
                  </div>
                )}
                {latestVitals.bmi && (
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">BMI</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.bmi.toFixed(1)}</p>
                  </div>
                )}
                {latestVitals.oxygenSat && (
                  <div className="text-center p-3 bg-cyan-50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">SpO2</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{latestVitals.oxygenSat}%</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">Recorded: {new Date(latestVitals.recordedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Vital Signs History</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowVitalModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + Record Vitals
              </button>
            )}
          </div>
          {history?.vitals?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.activity size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">No vital signs recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history?.vitals?.map((vital: Vitals) => (
                <div key={vital.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-2">{new Date(vital.recordedAt).toLocaleString()}</p>
                  <div className="flex flex-wrap gap-4">
                    {vital.bloodPressureSystolic && (
                      <div className="text-center px-3 py-1 bg-red-50 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">BP</span>
                        <p className="font-semibold">{vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}</p>
                      </div>
                    )}
                    {vital.heartRate && (
                      <div className="text-center px-3 py-1 bg-pink-50 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">HR</span>
                        <p className="font-semibold">{vital.heartRate}</p>
                      </div>
                    )}
                    {vital.temperature && (
                      <div className="text-center px-3 py-1 bg-orange-50 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Temp</span>
                        <p className="font-semibold">{vital.temperature}°F</p>
                      </div>
                    )}
                    {vital.weight && (
                      <div className="text-center px-3 py-1 bg-blue-50 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Wt</span>
                        <p className="font-semibold">{vital.weight}kg</p>
                      </div>
                    )}
                    {vital.bmi && (
                      <div className="text-center px-3 py-1 bg-purple-50 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">BMI</span>
                        <p className="font-semibold">{vital.bmi.toFixed(1)}</p>
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
            <h3 className="text-lg font-semibold">Diagnoses (ICD-10)</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowDiagnosisModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + Add Diagnosis
              </button>
            )}
          </div>
          {history?.diagnoses?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.stethoscope size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">No diagnoses recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history?.diagnoses?.map((diagnosis: Diagnosis) => (
                <div key={diagnosis.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{diagnosis.icdCode}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        diagnosis.status === 'ACTIVE' ? 'bg-red-100 text-red-700' :
                        diagnosis.status === 'CHRONIC' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{diagnosis.status}</span>
                    </div>
                    <p className="font-medium mt-1">{diagnosis.description}</p>
                    {diagnosis.notes && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{diagnosis.notes}</p>}
                    <p className="text-xs text-gray-400 mt-2">Diagnosed: {new Date(diagnosis.diagnosedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {hasPermission(user, 'create_medical_records') && (
                      <select
                        value={diagnosis.status}
                        onChange={async (e) => {
                          try {
                            await updateDiagnosis({ id: diagnosis.id, status: e.target.value }).unwrap();
                            showToast('Diagnosis updated', 'success');
                          } catch (error) {
                            showToast('Failed to update', 'error');
                          }
                        }}
                        className="text-sm border rounded-lg px-2 py-1"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="CHRONIC">Chronic</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    )}
                    {hasPermission(user, 'create_medical_records') && (
                      <button
                        onClick={async () => {
                          if (confirm('Delete this diagnosis?')) {
                            try {
                              await deleteDiagnosis({ id: diagnosis.id, patientId: id! }).unwrap();
                              showToast('Diagnosis deleted', 'success');
                            } catch (err) {
                              showToast('Failed to delete diagnosis', 'error');
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
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Prescriptions</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowPrescriptionModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + Add Prescription
              </button>
            )}
          </div>
          {history?.prescriptions?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.pill size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">No prescriptions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history?.prescriptions?.map((rx: Prescription) => (
                <div key={rx.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{rx.medication}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          rx.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700 dark:text-gray-300'
                        }`}>{rx.status}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{rx.dosage} - {rx.frequency}</p>
                      {rx.duration && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Duration: {rx.duration}</p>}
                      {rx.instructions && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">Instructions: {rx.instructions}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                        Started: {new Date(rx.startDate).toLocaleDateString()}
                        {rx.endDate && ` - Ended: ${new Date(rx.endDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {rx.status === 'ACTIVE' && (
                        <button
                          onClick={async () => {
                            try {
                              await updatePrescription({ id: rx.id, patientId: id, status: 'COMPLETED' }).unwrap();
                              showToast('Prescription completed', 'success');
                            } catch (err) {
                              showToast('Failed to update prescription', 'error');
                            }
                          }}
                          className="text-sm text-green-600 hover:text-green-700"
                        >
                          Mark Complete
                        </button>
                        )}
                        {hasPermission(user, 'create_medical_records') && (
                          <button
                            onClick={async () => {
                              if (confirm('Delete this prescription?')) {
                                try {
                                  await deletePrescription({ id: rx.id, patientId: id }).unwrap();
                                  showToast('Prescription deleted', 'success');
                                } catch (err) {
                                  showToast('Failed to delete prescription', 'error');
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
            <h3 className="text-lg font-semibold">Allergies</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowAllergyModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + Add Allergy
              </button>
            )}
          </div>
          {history?.allergies?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.alert size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">No allergies recorded</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {history?.allergies?.map((allergy: Allergy) => (
                <div key={allergy.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{allergy.allergen}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        allergy.severity === 'SEVERE' ? 'bg-red-100 text-red-700' :
                        allergy.severity === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{allergy.severity}</span>
                    </div>
                    {allergy.reaction && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">Reaction: {allergy.reaction}</p>}
                  </div>
                  {hasPermission(user, 'create_medical_records') && (
                    <button
                      onClick={async () => {
                        if (confirm('Delete this allergy?')) {
                          try {
                            await deleteAllergy({ id: allergy.id, patientId: id }).unwrap();
                            showToast('Allergy deleted', 'success');
                          } catch (err) {
                            showToast('Failed to delete allergy', 'error');
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
            <h3 className="text-lg font-semibold">Medical Conditions</h3>
            {hasPermission(user, 'create_medical_records') && (
              <button onClick={() => setShowConditionModal(true)} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
                + Add Condition
              </button>
            )}
          </div>
          {history?.conditions?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Icons.heart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">No conditions recorded</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {history?.conditions?.map((condition: Condition) => (
                <div key={condition.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{condition.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        condition.status === 'ACTIVE' ? 'bg-red-100 text-red-700' :
                        condition.status === 'CHRONIC' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{condition.status}</span>
                    </div>
                    {condition.notes && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{condition.notes}</p>}
                    {condition.diagnosedAt && <p className="text-xs text-gray-400 mt-2">Diagnosed: {new Date(condition.diagnosedAt).toLocaleDateString()}</p>}
                  </div>
                  {hasPermission(user, 'create_medical_records') && (
                    <button
                      onClick={async () => {
                        if (confirm('Delete this condition?')) {
                          try {
                            await deleteCondition({ id: condition.id, patientId: id }).unwrap();
                            showToast('Condition deleted', 'success');
                          } catch (err) {
                            showToast('Failed to delete condition', 'error');
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
          <h3 className="text-lg font-semibold">Medical Timeline</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-4">
              {history?.medicalRecords?.map((record: any, index: number) => (
                <div key={index} className="relative pl-10">
                  <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                    <span className="text-xs text-gray-400">{new Date(record.date).toLocaleString()}</span>
                    <h4 className="font-semibold">{record.title}</h4>
                    {record.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.description}</p>}
                  </div>
                </div>
              ))}
              {history?.labResults?.slice(0, 5).map((lab: any, index: number) => (
                <div key={`lab-${index}`} className="relative pl-10">
                  <div className="absolute left-2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white"></div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                    <span className="text-xs text-gray-400">{new Date(lab.orderedAt).toLocaleString()}</span>
                    <h4 className="font-semibold">Lab: {lab.testName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{lab.status} {lab.result && `- ${lab.result}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showVitalModal} onClose={() => setShowVitalModal(false)} title="Record Vitals">
        <div className="p-6">
          <form onSubmit={handleVitalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">BP Systolic</label>
                  <input type="number" value={vitalForm.bloodPressureSystolic} onChange={e => setVitalForm({...vitalForm, bloodPressureSystolic: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="120" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">BP Diastolic</label>
                  <input type="number" value={vitalForm.bloodPressureDiastolic} onChange={e => setVitalForm({...vitalForm, bloodPressureDiastolic: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="80" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Heart Rate (bpm)</label>
                  <input type="number" value={vitalForm.heartRate} onChange={e => setVitalForm({...vitalForm, heartRate: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="72" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Temperature (°F)</label>
                  <input type="number" step="0.1" value={vitalForm.temperature} onChange={e => setVitalForm({...vitalForm, temperature: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="98.6" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Weight (kg)</label>
                  <input type="number" step="0.1" value={vitalForm.weight} onChange={e => setVitalForm({...vitalForm, weight: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="70" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Height (cm)</label>
                  <input type="number" value={vitalForm.height} onChange={e => setVitalForm({...vitalForm, height: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="170" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">SpO2 (%)</label>
                  <input type="number" value={vitalForm.oxygenSat} onChange={e => setVitalForm({...vitalForm, oxygenSat: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="98" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Notes</label>
                <textarea value={vitalForm.notes} onChange={e => setVitalForm({...vitalForm, notes: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowVitalModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">Save</button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showDiagnosisModal} onClose={() => setShowDiagnosisModal(false)} title="Add Diagnosis">
        <div className="p-6">
          <form onSubmit={handleDiagnosisSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">ICD-10 Code</label>
                <input type="text" value={diagnosisForm.icdCode} onChange={e => setDiagnosisForm({...diagnosisForm, icdCode: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder=" J06.9" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Description</label>
                <input type="text" value={diagnosisForm.description} onChange={e => setDiagnosisForm({...diagnosisForm, description: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder=" Acute upper respiratory infection" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Status</label>
                <select value={diagnosisForm.status} onChange={e => setDiagnosisForm({...diagnosisForm, status: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="ACTIVE">Active</option>
                  <option value="CHRONIC">Chronic</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Notes</label>
                <textarea value={diagnosisForm.notes} onChange={e => setDiagnosisForm({...diagnosisForm, notes: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDiagnosisModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">Save</button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showPrescriptionModal} onClose={() => setShowPrescriptionModal(false)} title="Add Prescription">
        <div className="p-6">
          <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Medication</label>
                <input type="text" value={prescriptionForm.medication} onChange={e => setPrescriptionForm({...prescriptionForm, medication: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Dosage</label>
                  <input type="text" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder=" 500mg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Frequency</label>
                  <input type="text" value={prescriptionForm.frequency} onChange={e => setPrescriptionForm({...prescriptionForm, frequency: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder=" 3 times daily" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Duration</label>
                  <input type="text" value={prescriptionForm.duration} onChange={e => setPrescriptionForm({...prescriptionForm, duration: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder=" 7 days" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Refills</label>
                  <input type="number" value={prescriptionForm.refills} onChange={e => setPrescriptionForm({...prescriptionForm, refills: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Instructions</label>
                <textarea value={prescriptionForm.instructions} onChange={e => setPrescriptionForm({...prescriptionForm, instructions: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPrescriptionModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">Save</button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showAllergyModal} onClose={() => setShowAllergyModal(false)} title="Add Allergy">
        <div className="p-6">
          <form onSubmit={handleAllergySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Allergen</label>
                <input type="text" value={allergyForm.allergen} onChange={e => setAllergyForm({...allergyForm, allergen: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder=" Penicillin" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Severity</label>
                <select value={allergyForm.severity} onChange={e => setAllergyForm({...allergyForm, severity: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="MILD">Mild</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Reaction</label>
                <input type="text" value={allergyForm.reaction} onChange={e => setAllergyForm({...allergyForm, reaction: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder=" Rash, swelling" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAllergyModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">Save</button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showConditionModal} onClose={() => setShowConditionModal(false)} title="Add Condition">
        <div className="p-6">
          <form onSubmit={handleConditionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Condition Name</label>
                <input type="text" value={conditionForm.name} onChange={e => setConditionForm({...conditionForm, name: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder=" Diabetes Type 2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Status</label>
                <select value={conditionForm.status} onChange={e => setConditionForm({...conditionForm, status: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="ACTIVE">Active</option>
                  <option value="CHRONIC">Chronic</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Notes</label>
                <textarea value={conditionForm.notes} onChange={e => setConditionForm({...conditionForm, notes: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowConditionModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 btn-gradient text-white py-2 rounded-lg">Save</button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
