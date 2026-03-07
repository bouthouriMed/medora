import { useTranslation } from 'react-i18next';
import { Icons } from '../components/Icons';
import { useAppSelector } from '../store/hooks';
import { hasPermission } from '../utils/permissions';
import { showToast } from '../components/Toast';

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

interface PatientDetailTabsProps {
  activeTab: string;
  patient: any;
  history: any;
  onShowVitalModal: () => void;
  onShowDiagnosisModal: () => void;
  onShowPrescriptionModal: () => void;
  onShowAllergyModal: () => void;
  onShowConditionModal: () => void;
  updateDiagnosis: any;
  deleteDiagnosis: any;
  updatePrescription: any;
  deletePrescription: any;
  deleteAllergy: any;
  deleteCondition: any;
}

export function PatientDetailTabs({
  activeTab,
  patient,
  history,
  onShowVitalModal,
  onShowDiagnosisModal,
  onShowPrescriptionModal,
  onShowAllergyModal,
  onShowConditionModal,
  updateDiagnosis,
  deleteDiagnosis,
  updatePrescription,
  deletePrescription,
  deleteAllergy,
  deleteCondition,
}: PatientDetailTabsProps) {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);

  const latestVitals = history?.vitals?.[0];
  const activeDiagnoses = history?.diagnoses?.filter((d: Diagnosis) => d.status === 'ACTIVE') || [];
  const activePrescriptions = history?.prescriptions?.filter((p: Prescription) => p.status === 'ACTIVE') || [];

  if (activeTab === 'overview') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('other.patientInformation')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('common.email')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{patient?.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('common.phone')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{patient?.phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('patients.dateOfBirth')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('common.address')}</span>
              <span className="font-medium text-right text-gray-900 dark:text-white">{patient?.address || '-'}</span>
            </div>
          </div>
        </div>

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

        {latestVitals && (
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('other.latestVitals')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {latestVitals.bloodPressureSystolic && (
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('other.bloodPressure')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.mmhg')}</p>
                </div>
              )}
              {latestVitals.heartRate && (
                <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/30 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('other.heartRate')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.heartRate}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.bpm')}</p>
                </div>
              )}
              {latestVitals.temperature && (
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('other.temperature')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.temperature}°</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.fahrenheit')}</p>
                </div>
              )}
              {latestVitals.weight && (
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('other.weight')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.weight}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.kg')}</p>
                </div>
              )}
              {latestVitals.height && (
                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('other.height')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.height}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('other.cm')}</p>
                </div>
              )}
              {latestVitals.bmi && (
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('other.bmi')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.bmi.toFixed(1)}</p>
                </div>
              )}
              {latestVitals.oxygenSat && (
                <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('other.spo2')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.oxygenSat}%</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{t('other.recorded')}: {new Date(latestVitals.recordedAt).toLocaleString()}</p>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'vitals') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.vitalSignsHistory')}</h3>
          {hasPermission(user, 'create_medical_records') && (
            <button onClick={onShowVitalModal} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
              + {t('medical.recordVitals')}
            </button>
          )}
        </div>
        {history?.vitals?.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Icons.activity size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('other.noVitalsRecorded')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history?.vitals?.map((vital: Vitals) => (
              <div key={vital.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{new Date(vital.recordedAt).toLocaleString()}</p>
                <div className="flex flex-wrap gap-4">
                  {vital.bloodPressureSystolic && (
                    <div className="text-center px-3 py-1 bg-red-50 dark:bg-red-900/30 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('other.bp')}</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}</p>
                    </div>
                  )}
                  {vital.heartRate && (
                    <div className="text-center px-3 py-1 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('other.hr')}</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{vital.heartRate}</p>
                    </div>
                  )}
                  {vital.temperature && (
                    <div className="text-center px-3 py-1 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('other.temp')}</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{vital.temperature}°F</p>
                    </div>
                  )}
                  {vital.weight && (
                    <div className="text-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('other.wt')}</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{vital.weight}kg</p>
                    </div>
                  )}
                  {vital.bmi && (
                    <div className="text-center px-3 py-1 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('other.bmi')}</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{vital.bmi.toFixed(1)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'diagnoses') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.diagnosesIcd')}</h3>
          {hasPermission(user, 'create_medical_records') && (
            <button onClick={onShowDiagnosisModal} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
              + {t('medical.addDiagnosis')}
            </button>
          )}
        </div>
        {history?.diagnoses?.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Icons.stethoscope size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('other.noDiagnosesRecorded')}</p>
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
                  {diagnosis.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{diagnosis.notes}</p>}
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
                            await deleteDiagnosis({ id: diagnosis.id, patientId: patient?.id }).unwrap();
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
    );
  }

  if (activeTab === 'prescriptions') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.prescriptions')}</h3>
          {hasPermission(user, 'create_medical_records') && (
            <button onClick={onShowPrescriptionModal} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
              + {t('other.addPrescription')}
            </button>
          )}
        </div>
        {history?.prescriptions?.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Icons.pill size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('other.noPrescriptions')}</p>
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
                    {rx.duration && <p className="text-sm text-gray-500 dark:text-gray-400">{t('other.duration')}: {rx.duration}</p>}
                    {rx.instructions && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('other.instructions')}: {rx.instructions}</p>}
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
                            await updatePrescription({ id: rx.id, patientId: patient?.id, status: 'COMPLETED' }).unwrap();
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
                          if (confirm(t('other.confirmDelete') + ' prescription?')) {
                            try {
                              await deletePrescription({ id: rx.id, patientId: patient?.id }).unwrap();
                              showToast(t('medical.prescriptionDeleted'), 'success');
                            } catch (err) {
                              showToast(t('medical.failedToDeletePrescription'), 'error');
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
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'allergies') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.allergies')}</h3>
          {hasPermission(user, 'create_medical_records') && (
            <button onClick={onShowAllergyModal} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
              + {t('other.addAllergy')}
            </button>
          )}
        </div>
        {history?.allergies?.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Icons.alert size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('other.noAllergiesRecorded')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history?.allergies?.map((allergy: Allergy) => (
              <div key={allergy.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{allergy.allergen}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      allergy.severity === 'SEVERE' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                      allergy.severity === 'MODERATE' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                      'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    }`}>{t(`other.${allergy.severity.toLowerCase()}`)}</span>
                  </div>
                  {allergy.reaction && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('other.reaction')}: {allergy.reaction}</p>}
                </div>
                {hasPermission(user, 'create_medical_records') && (
                  <button
                    onClick={async () => {
                      if (confirm(t('other.confirmDelete') + ' allergy?')) {
                        try {
                          await deleteAllergy({ id: allergy.id, patientId: patient?.id }).unwrap();
                          showToast(t('medical.allergyDeleted'), 'success');
                        } catch (err) {
                          showToast(t('medical.failedToDeleteAllergy'), 'error');
                        }
                      }
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Icons.trash size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'conditions') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.conditions')}</h3>
          {hasPermission(user, 'create_medical_records') && (
            <button onClick={onShowConditionModal} className="btn-gradient px-4 py-2 rounded-xl text-white font-medium">
              + {t('other.addCondition')}
            </button>
          )}
        </div>
        {history?.conditions?.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Icons.heart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('other.noConditionsRecorded')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history?.conditions?.map((condition: Condition) => (
              <div key={condition.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{condition.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      condition.status === 'ACTIVE' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                      condition.status === 'CHRONIC' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                      'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    }`}>{t(`medical.${condition.status.toLowerCase()}`)}</span>
                  </div>
                  {condition.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{condition.notes}</p>}
                  {condition.diagnosedAt && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('other.diagnosed')}: {new Date(condition.diagnosedAt).toLocaleDateString()}</p>}
                </div>
                {hasPermission(user, 'create_medical_records') && (
                  <button
                    onClick={async () => {
                      if (confirm(t('other.confirmDelete') + ' condition?')) {
                        try {
                          await deleteCondition({ id: condition.id, patientId: patient?.id }).unwrap();
                          showToast(t('medical.conditionDeleted'), 'success');
                        } catch (err) {
                          showToast(t('medical.failedToDeleteCondition'), 'error');
                        }
                      }
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Icons.trash size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'timeline') {
    const records = history?.medicalRecords || [];
    const isAI = (r: any) => r.type === 'AI_CLINICAL_NOTE';
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('other.medicalTimeline')}</h3>
        {records.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Icons.clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('other.noMedicalRecords')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record: any) => (
              <div key={record.id} className="relative pl-10">
                <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${isAI(record) ? 'bg-purple-500' : 'bg-blue-500'}`} />
                <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border p-4 ${isAI(record) ? 'border-purple-100 dark:border-purple-800/40' : 'border-gray-100 dark:border-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    {isAI(record) && <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full font-medium">✨ AI Note</span>}
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(record.createdAt || record.date).toLocaleString()}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mt-1">{record.title}</h4>
                  {record.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">{record.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
