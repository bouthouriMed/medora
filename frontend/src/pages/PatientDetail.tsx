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
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
              <Icons.activity size={24} className="mb-2" />
              <p className="text-3xl font-bold">{activeDiagnoses.length}</p>
              <p className="text-blue-100">{t('other.activeDiagnoses')}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
              <Icons.pill size={24} className="mb-2" />
              <p className="text-3xl font-bold">{activePrescriptions.length}</p>
              <p className="text-purple-100">{t('other.activeRxs')}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
              <Icons.alert size={24} className="mb-2" />
              <p className="text-3xl font-bold">{history?.allergies?.length || 0}</p>
              <p className="text-red-100">{t('other.allergies')}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
              <Icons.heart size={24} className="mb-2" />
              <p className="text-3xl font-bold">{history?.conditions?.length || 0}</p>
              <p className="text-green-100">{t('other.conditions')}</p>
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
              {history?.medicalRecords?.map((record: any, index: number) => (
                <div key={index} className="relative pl-10">
                  <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(record.date).toLocaleString()}</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{record.title}</h4>
                    {record.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.description}</p>}
                  </div>
                </div>
              ))}
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
    </div>
  );
}
