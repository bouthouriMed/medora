import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import { Icons } from '../components/Icons';
import { useAppSelector } from '../store/hooks';
import { hasPermission } from '../utils/permissions';
import { showToast } from '../components/Toast';
import { 
  useCreateVitalMutation,
  useCreateDiagnosisMutation,
  useCreatePrescriptionMutation,
  useCreateAllergyMutation,
  useCreateConditionMutation,
  useUpdateMedicalRecordMutation,
  useCreateMedicalRecordMutation,
  useCompleteWithInvoiceMutation,
} from '../api';

interface VitalFormData {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  oxygenSat: string;
  notes: string;
}

interface DiagnosisFormData {
  icdCode: string;
  description: string;
  status: string;
  notes: string;
}

interface PrescriptionFormData {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refills: string;
}

interface AllergyFormData {
  allergen: string;
  severity: string;
  reaction: string;
}

interface ConditionFormData {
  name: string;
  status: string;
  notes: string;
}

interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
}

interface PatientDetailModalsProps {
  patientId: string;
  patient: any;
  showVitalModal: boolean;
  setShowVitalModal: (show: boolean) => void;
  showDiagnosisModal: boolean;
  setShowDiagnosisModal: (show: boolean) => void;
  showPrescriptionModal: boolean;
  setShowPrescriptionModal: (show: boolean) => void;
  showAllergyModal: boolean;
  setShowAllergyModal: (show: boolean) => void;
  showConditionModal: boolean;
  setShowConditionModal: (show: boolean) => void;
  showSummaryModal: boolean;
  setShowSummaryModal: (show: boolean) => void;
  generatedSummaryText: string;
  setGeneratedSummaryText: (text: string) => void;
  summaryIsEditing: boolean;
  setSummaryIsEditing: (editing: boolean) => void;
  editingRecordId: string | null;
  setEditingRecordId: (id: string | null) => void;
  showInvoiceModal: boolean;
  setShowInvoiceModal: (show: boolean) => void;
  consultationAppointmentId: string | null;
  onComplete: () => void;
}

export function PatientDetailModals({
  patientId,
  patient,
  showVitalModal,
  setShowVitalModal,
  showDiagnosisModal,
  setShowDiagnosisModal,
  showPrescriptionModal,
  setShowPrescriptionModal,
  showAllergyModal,
  setShowAllergyModal,
  showConditionModal,
  setShowConditionModal,
  showSummaryModal,
  setShowSummaryModal,
  generatedSummaryText,
  setGeneratedSummaryText,
  summaryIsEditing,
  setSummaryIsEditing,
  editingRecordId,
  setEditingRecordId,
  showInvoiceModal,
  setShowInvoiceModal,
  consultationAppointmentId,
  onComplete,
}: PatientDetailModalsProps) {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  
  const [createVital] = useCreateVitalMutation();
  const [createDiagnosis] = useCreateDiagnosisMutation();
  const [createPrescription] = useCreatePrescriptionMutation();
  const [createAllergy] = useCreateAllergyMutation();
  const [createCondition] = useCreateConditionMutation();
  const [updateMedicalRecord, { isLoading: isUpdatingSummary }] = useUpdateMedicalRecordMutation();
  const [createMedicalRecord, { isLoading: isSavingSummary }] = useCreateMedicalRecordMutation();
  const [completeWithInvoice, { isLoading: isCompleting }] = useCompleteWithInvoiceMutation();

  const [vitalForm, setVitalForm] = useState<VitalFormData>({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygenSat: '',
    notes: '',
  });

  const [diagnosisForm, setDiagnosisForm] = useState<DiagnosisFormData>({
    icdCode: '',
    description: '',
    status: 'ACTIVE',
    notes: '',
  });

  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionFormData>({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    refills: '0',
  });

  const [allergyForm, setAllergyForm] = useState<AllergyFormData>({
    allergen: '',
    severity: 'MODERATE',
    reaction: '',
  });

  const [conditionForm, setConditionForm] = useState<ConditionFormData>({
    name: '',
    status: 'ACTIVE',
    notes: '',
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: 'Consultation Fee', amount: 100, quantity: 1 }
  ]);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const handleVitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVital({
        patientId,
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
      await createDiagnosis({ patientId, ...diagnosisForm }).unwrap();
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
      await createPrescription({ patientId, ...prescriptionForm, refills: parseInt(prescriptionForm.refills) }).unwrap();
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
      await createAllergy({ patientId, ...allergyForm }).unwrap();
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
      await createCondition({ patientId, ...conditionForm }).unwrap();
      showToast(t('medical.conditionAdded'), 'success');
      setShowConditionModal(false);
      setConditionForm({ name: '', status: 'ACTIVE', notes: '' });
    } catch (error) {
      showToast(t('medical.failedToAddCondition'), 'error');
    }
  };

  const handleSaveSummary = async () => {
    try {
      if (editingRecordId) {
        await updateMedicalRecord({
          id: editingRecordId,
          patientId,
          title: `Clinical Summary - ${new Date().toLocaleDateString()}`,
          description: generatedSummaryText,
          data: { generatedBy: 'gemini-2.5-flash' },
        }).unwrap();
      } else {
        await createMedicalRecord({
          patientId,
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
      onComplete();
    } catch {
      showToast('Failed to save summary', 'error');
    }
  };

  const handleCompleteVisit = async () => {
    if (!consultationAppointmentId) return;
    try {
      const result = await completeWithInvoice({
        id: consultationAppointmentId,
        items: invoiceItems.filter(item => item.description && item.amount > 0),
        notes: invoiceNotes,
      }).unwrap();
      showToast(`Visit completed! Invoice #${result.invoice.id.slice(0, 8)} created.`, 'success');
      setShowInvoiceModal(false);
      onComplete();
    } catch (err: any) {
      showToast(err?.data?.error || 'Failed to complete visit', 'error');
    }
  };

  return (
    <>
      <Modal isOpen={showVitalModal} onClose={() => setShowVitalModal(false)} title={t('medical.recordVitals')}>
        <div className="p-6">
          <form onSubmit={handleVitalSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('medical.bpSystolic')}</label>
                <input type="number" value={vitalForm.bloodPressureSystolic} onChange={e => setVitalForm({...vitalForm, bloodPressureSystolic: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="120" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('medical.bpDiastolic')}</label>
                <input type="number" value={vitalForm.bloodPressureDiastolic} onChange={e => setVitalForm({...vitalForm, bloodPressureDiastolic: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="80" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('medical.heartRate')}</label>
                <input type="number" value={vitalForm.heartRate} onChange={e => setVitalForm({...vitalForm, heartRate: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="72 bpm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('medical.temperature')}</label>
                <input type="number" step="0.1" value={vitalForm.temperature} onChange={e => setVitalForm({...vitalForm, temperature: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="98.6°F" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('medical.weight')}</label>
                <input type="number" step="0.1" value={vitalForm.weight} onChange={e => setVitalForm({...vitalForm, weight: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="kg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('medical.height')}</label>
                <input type="number" step="0.1" value={vitalForm.height} onChange={e => setVitalForm({...vitalForm, height: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="cm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">{t('medical.oxygenSat')}</label>
              <input type="number" value={vitalForm.oxygenSat} onChange={e => setVitalForm({...vitalForm, oxygenSat: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="98%" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">{t('common.notes')}</label>
              <textarea value={vitalForm.notes} onChange={e => setVitalForm({...vitalForm, notes: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowVitalModal(false)} className="flex-1 border py-2 rounded-lg">{t('common.cancel')}</button>
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
              <input type="text" value={diagnosisForm.icdCode} onChange={e => setDiagnosisForm({...diagnosisForm, icdCode: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="J06.9" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">{t('common.description')}</label>
              <input type="text" value={diagnosisForm.description} onChange={e => setDiagnosisForm({...diagnosisForm, description: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Acute upper respiratory infection" required />
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
                <input type="text" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="500mg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.frequency')}</label>
                <input type="text" value={prescriptionForm.frequency} onChange={e => setPrescriptionForm({...prescriptionForm, frequency: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="3 times daily" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">{t('other.duration')}</label>
                <input type="text" value={prescriptionForm.duration} onChange={e => setPrescriptionForm({...prescriptionForm, duration: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="7 days" />
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
              <input type="text" value={allergyForm.allergen} onChange={e => setAllergyForm({...allergyForm, allergen: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Penicillin" required />
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
              <input type="text" value={allergyForm.reaction} onChange={e => setAllergyForm({...allergyForm, reaction: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Rash, swelling" />
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
              <input type="text" value={conditionForm.name} onChange={e => setConditionForm({...conditionForm, name: e.target.value})} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Diabetes Type 2" required />
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
              <div className="space-y-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {generatedSummaryText.split('\n').map((line, i) => {
                  if (!line.trim()) return <div key={i} className="h-3" />;
                  return <p key={i} className="text-gray-700 dark:text-gray-300">{line}</p>;
                })}
              </div>
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
              onClick={handleSaveSummary}
              disabled={isSavingSummary || isUpdatingSummary}
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors"
            >
              {(isSavingSummary || isUpdatingSummary) ? 'Saving...' : 'Save to Records'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Complete Visit" size="xl">
        <div className="space-y-6">
          <div className="bg-white border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
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

            <div className="bg-slate-100 dark:bg-slate-700 p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Thank you for choosing Medora Health Clinic!</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Payment is due within 30 days. Please contact us for payment arrangements.</p>
            </div>
          </div>

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

          <div className="flex gap-3">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteVisit}
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
    </>
  );
}
