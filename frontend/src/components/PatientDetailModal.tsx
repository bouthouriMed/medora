import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useGetTagsQuery, useGetPatientQuery, useGetPatientTagsQuery, useGetPatientCustomFieldsQuery, useGetPatientAppointmentsQuery, useRegeneratePatientTokenMutation, useAddTagToPatientMutation, useRemoveTagFromPatientMutation, useSavePatientCustomFieldMutation } from '../api';
import { showToast } from './Toast';
import type { Patient, Appointment, Tag } from '../types';

interface PatientDetailModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export default function PatientDetailModal({ patient, isOpen, onClose, t }: PatientDetailModalProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ info: true });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());

  const { data: patientDetails } = useGetPatientQuery(patient?.id || '', { skip: !patient?.id });
  const { data: patientAppointments } = useGetPatientAppointmentsQuery(patient?.id || '', { skip: !patient?.id });
  const { data: patientTags, refetch: refetchPatientTags } = useGetPatientTagsQuery(patient?.id || '', { skip: !patient?.id });
  const { data: patientCustomFields, refetch: refetchCustomFields } = useGetPatientCustomFieldsQuery(patient?.id || '', { skip: !patient?.id });
  const { data: allTags } = useGetTagsQuery(undefined);
  const [regenerateToken] = useRegeneratePatientTokenMutation();
  const [addTagToPatient] = useAddTagToPatientMutation();
  const [removeTagFromPatient] = useRemoveTagFromPatientMutation();
  const [saveCustomField] = useSavePatientCustomFieldMutation();

  useEffect(() => {
    if (patientCustomFields) {
      const values: Record<string, string> = {};
      patientCustomFields.forEach((f: any) => { values[f.id] = f.value || ''; });
      setCustomFieldValues(values);
    }
  }, [patientCustomFields]);

  const handleSaveCustomField = async (fieldId: string) => {
    if (savingFields.has(fieldId)) return;
    setSavingFields(prev => new Set(prev).add(fieldId));
    try {
      await saveCustomField({
        patientId: patient!.id,
        customFieldId: fieldId,
        value: customFieldValues[fieldId] || '',
      }).unwrap();
      refetchCustomFields();
      showToast(t('other.saved'), 'success');
    } catch (error) {
      showToast(t('other.failedToSave'), 'error');
    }
    setSavingFields(prev => { const next = new Set(prev); next.delete(fieldId); return next; });
  };

  const handleAddTag = async (tagId: string) => {
    const alreadyHas = patientTags?.some((t: Tag) => t.id === tagId);
    if (alreadyHas) {
      showToast(t('other.tagAlreadyAssigned'), 'error');
      return;
    }
    try {
      await addTagToPatient({ patientId: patient!.id, tagId }).unwrap();
      setShowTagDropdown(false);
      showToast(t('other.tagAdded'), 'success');
      refetchPatientTags();
    } catch (error) {
      showToast(t('other.failedToAddTag'), 'error');
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTagFromPatient({ patientId: patient!.id, tagId }).unwrap();
      showToast(t('other.tagRemoved'), 'success');
      refetchPatientTags();
    } catch (error) {
      showToast(t('other.failedToRemoveTag'), 'error');
    }
  };

  if (!patient) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('other.patientDetails')}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('other.patientIdLabel')} {patient.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="space-y-4">
          <InfoCard label={t('common.email')} value={patient.email || t('other.notProvided')} />
          <InfoCard label={t('common.phone')} value={patient.phone || t('other.notProvided')} />
          <InfoCard label={t('patients.dateOfBirth')} value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : t('other.notProvided')} />
          <InfoCard label={t('common.address')} value={patient.address || t('other.notProvided')} />
          <InfoCard label={t('common.notes')} value={patient.notes || t('other.noNotes')} />

          <PortalSection 
            patient={patient} 
            patientDetails={patientDetails}
            regenerateToken={regenerateToken}
            t={t}
          />

          <TagsSection 
            patientTags={patientTags}
            allTags={allTags}
            showTagDropdown={showTagDropdown}
            onToggleDropdown={() => setShowTagDropdown(!showTagDropdown)}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            t={t}
          />

          {patientCustomFields && patientCustomFields.length > 0 && (
            <CustomFieldsSection 
              fields={patientCustomFields}
              values={customFieldValues}
              onChange={setCustomFieldValues}
              onSave={handleSaveCustomField}
              savingFields={savingFields}
              t={t}
            />
          )}

          <AppointmentsSection appointments={patientAppointments} t={t} />

          <button
            onClick={onClose}
            className="w-full mt-6 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function PortalSection({ patient, patientDetails, regenerateToken, t }: { patient: Patient; patientDetails: any; regenerateToken: any; t: (key: string) => string }) {
  return (
    <div className="bg-blue-50 rounded-xl p-4">
      <p className="text-sm text-blue-600 mb-2">{t('other.patientPortal')}</p>
      {patientDetails?.portalToken ? (
        <button
          onClick={() => {
            const portalUrl = `${window.location.origin}/portal/${patientDetails.portalToken}`;
            navigator.clipboard.writeText(portalUrl);
            showToast(t('other.portalLinkCopied'), 'success');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {t('other.sharePortalLink')}
        </button>
      ) : (
        <button
          onClick={async () => {
            try {
              const result = await regenerateToken(patient.id).unwrap();
              showToast(t('other.portalLinkGenerated'), 'success');
            } catch (error) {
              showToast(t('other.failedToGeneratePortalLink'), 'error');
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {t('other.generatePortalLink')}
        </button>
      )}
    </div>
  );
}

function TagsSection({ patientTags, allTags, showTagDropdown, onToggleDropdown, onAddTag, onRemoveTag, t }: any) {
  return (
    <div className="bg-purple-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-purple-600">{t('other.tags')}</p>
        <button onClick={onToggleDropdown} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
          + {t('other.addTag')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {patientTags && patientTags.length > 0 ? (
          patientTags.map((tag: Tag) => (
            <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
              {tag.name}
              <button onClick={() => onRemoveTag(tag.id)} className="hover:opacity-70 ml-1">×</button>
            </span>
          ))
        ) : (
          <p className="text-xs text-gray-500">{t('other.noTagsAssigned')}</p>
        )}
      </div>
      {showTagDropdown && allTags && allTags.length > 0 && (
        <div className="mt-2 pt-2 border-t border-purple-200">
          <select
            onChange={(e) => { if (e.target.value) onAddTag(e.target.value); }}
            className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            defaultValue=""
          >
            <option value="">{t('other.selectATag')}</option>
            {allTags.filter((t: Tag) => !patientTags?.some((pt: Tag) => pt.id === t.id)).map((tag: Tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function CustomFieldsSection({ fields, values, onChange, onSave, savingFields, t }: any) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => {}}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-gray-900 dark:text-white">{t('other.patientInfo')}</span>
        <span className="text-gray-500">▼</span>
      </button>
      <div className="p-4 space-y-3">
        {fields.map((field: any) => (
          <div key={field.id}>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{field.name}</label>
            <div className="flex gap-2">
              <input
                type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'DATE' ? 'date' : 'text'}
                value={values[field.id] || ''}
                onChange={(e) => onChange({ ...values, [field.id]: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => onSave(field.id)}
                disabled={savingFields.has(field.id)}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingFields.has(field.id) ? '...' : t('common.save')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentsSection({ appointments, t }: { appointments: Appointment[] | undefined; t: (key: string) => string }) {
  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('nav.appointments')}</h4>
      {appointments?.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('other.noAppointmentsFound')}</p>
      ) : (
        <div className="space-y-2">
          {appointments?.slice(0, 5).map((apt: Appointment) => (
            <div key={apt.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{new Date(apt.dateTime).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {apt.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
