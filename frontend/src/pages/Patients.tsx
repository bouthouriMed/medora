import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPatientsQuery, useGetPatientAppointmentsQuery, useCreatePatientMutation, useDeletePatientMutation, useGetPatientQuery, useRegeneratePatientTokenMutation, useGetTagsQuery, useGetPatientTagsQuery, useAddTagToPatientMutation, useRemoveTagFromPatientMutation, useGetPatientCustomFieldsQuery, useSavePatientCustomFieldMutation } from '../api';
import { showToast } from '../components/Toast';
import { exportPatients } from '../utils/export';
import Modal from '../components/Modal';
import type { Patient, Appointment, Tag } from '../types';
import { useTranslation } from 'react-i18next';

export default function Patients() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tag: '',
    dateFrom: '',
    dateTo: '',
  });
  const { data: patients, isLoading } = useGetPatientsQuery(search);
  
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    return patients.filter((patient: Patient) => {
      if (filters.tag) {
        const hasTag = patient.patientTags?.some((pt: any) => pt.tagId === filters.tag);
        if (!hasTag) return false;
      }
      if (filters.dateFrom) {
        const patientDate = new Date(patient.createdAt);
        const fromDate = new Date(filters.dateFrom);
        if (patientDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const patientDate = new Date(patient.createdAt);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        if (patientDate > toDate) return false;
      }
      return true;
    });
  }, [patients, filters]);
  
  const { data: patientDetails } = useGetPatientQuery(selectedPatient?.id || '', {
    skip: !selectedPatient?.id,
  });
  const { data: patientAppointments } = useGetPatientAppointmentsQuery(selectedPatient?.id || '', { 
    skip: !selectedPatient?.id 
  });
  const { data: allTags } = useGetTagsQuery(undefined);
  const { data: patientTags, refetch: refetchPatientTags } = useGetPatientTagsQuery(selectedPatient?.id || '', {
    skip: !selectedPatient?.id,
  });
  const { data: patientCustomFields, refetch: refetchCustomFields } = useGetPatientCustomFieldsQuery(selectedPatient?.id || '', {
    skip: !selectedPatient?.id,
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ info: true });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (patientCustomFields) {
      const values: Record<string, string> = {};
      patientCustomFields.forEach((f: any) => {
        values[f.id] = f.value || '';
      });
      setCustomFieldValues(values);
    }
  }, [patientCustomFields]);

  const [createPatient, { isLoading: isCreating }] = useCreatePatientMutation();
  const [deletePatient] = useDeletePatientMutation();
  const [regenerateToken] = useRegeneratePatientTokenMutation();
  const [addTagToPatient] = useAddTagToPatientMutation();
  const [removeTagFromPatient] = useRemoveTagFromPatientMutation();
  const [saveCustomField] = useSavePatientCustomFieldMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatient({
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
      }).unwrap();
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', address: '', notes: '' });
      showToast('Patient created successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create patient', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to archive this patient?')) {
      try {
        await deletePatient(id).unwrap();
        showToast('Patient archived successfully', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to archive patient', 'error');
      }
    }
  };

  const handleViewPatient = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">Manage your patient records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPatients}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            📥 Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
          >
            + {t('patients.addPatient')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
        >
          <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {[filters.tag, filters.dateFrom, filters.dateTo].filter(Boolean).length || 'All'}
          </span>
        </button>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tag</label>
                <select
                  value={filters.tag}
                  onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Tags</option>
                  {allTags?.map((tag: Tag) => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Registered From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Registered To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setFilters({ tag: '', dateFrom: '', dateTo: '' })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : filteredPatients?.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first patient</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            + {t('patients.addPatient')}
          </button>
        </div>
      ) : (
        /* Patients Grid (Cards for mobile, table for desktop) */
        <div className="hidden md:block bg-white shadow-lg border border-gray-100 rounded-2xl overflow-hidden">
          <div className="table-responsive">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date of Birth</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients?.map((patient: Patient) => (
                  <tr key={patient.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <span className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{patient.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{patient.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {patient.patientTags && patient.patientTags.length > 0 ? (
                          patient.patientTags.map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: tag.color + '20', color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewPatient(patient)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Cards View */}
      {patients && patients.length > 0 && (
        <div className="md:hidden grid grid-cols-1 gap-4">
          {patients?.map((patient: Patient) => (
            <div 
              key={patient.id} 
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 hover-lift"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</p>
                    <p className="text-sm text-gray-500">{patient.email || 'No email'}</p>
                    <p className="text-sm text-gray-500">{patient.phone || 'No phone'}</p>
                    {patient.patientTags && patient.patientTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {patient.patientTags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleViewPatient(patient)}
                  className="flex-1 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-medium text-center"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(patient.id)}
                  className="flex-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium text-center"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Patient Modal */}
      <Modal isOpen={!!selectedPatient} onClose={() => setSelectedPatient(null)} title="Patient Details">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {selectedPatient?.firstName[0]}{selectedPatient?.lastName[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selectedPatient?.firstName} {selectedPatient?.lastName}</h3>
              <p className="text-gray-500">Patient ID: {selectedPatient?.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{selectedPatient?.email || 'Not provided'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{selectedPatient?.phone || 'Not provided'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium text-gray-900">
                {selectedPatient?.dateOfBirth ? new Date(selectedPatient!.dateOfBirth).toLocaleDateString() : 'Not provided'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-900">{selectedPatient?.address || 'Not provided'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="font-medium text-gray-900">{selectedPatient?.notes || 'No notes'}</p>
            </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-600 mb-2">Patient Portal</p>
                {patientDetails?.portalToken ? (
                  <button
                    onClick={() => {
                      const portalUrl = `${window.location.origin}/portal/${patientDetails.portalToken}`;
                      navigator.clipboard.writeText(portalUrl);
                      showToast('Portal link copied to clipboard!', 'success');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Portal Link
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const result = await regenerateToken(selectedPatient!.id).unwrap();
                        showToast('Portal link generated!', 'success');
                        setSelectedPatient(result);
                      } catch (error) {
                        showToast('Failed to generate portal link', 'error');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Generate Portal Link
                  </button>
                )}
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-purple-600">Tags</p>
                  <button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    + Add Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patientTags && patientTags.length > 0 ? (
                    patientTags.map((tag: Tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await removeTagFromPatient({ patientId: selectedPatient!.id, tagId: tag.id }).unwrap();
                              showToast('Tag removed', 'success');
                              refetchPatientTags();
                            } catch (error) {
                              showToast('Failed to remove tag', 'error');
                            }
                          }}
                          className="hover:opacity-70 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No tags assigned</p>
                  )}
                </div>
                {showTagDropdown && allTags && allTags.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <select
                      onChange={async (e) => {
                        if (!e.target.value) return;
                        const tagId = e.target.value;
                        const alreadyHas = patientTags?.some((t: Tag) => t.id === tagId);
                        if (alreadyHas) {
                          showToast('Tag already assigned', 'error');
                          return;
                        }
                        try {
                          await addTagToPatient({ patientId: selectedPatient!.id, tagId }).unwrap();
                          setShowTagDropdown(false);
                          showToast('Tag added!', 'success');
                          refetchPatientTags();
                        } catch (error) {
                          showToast('Failed to add tag', 'error');
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      defaultValue=""
                    >
                      <option value="">Select a tag...</option>
                      {allTags.filter((t: Tag) => !patientTags?.some((pt: Tag) => pt.id === t.id)).map((tag: Tag) => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Fields Section - Collapsible */}
            {patientCustomFields && patientCustomFields.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, info: !prev.info }))}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900">Patient Info</span>
                  <span className="text-gray-500">
                    {expandedSections.info ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.info && (
                  <div className="p-4 space-y-3">
                    {patientCustomFields.map((field: any) => (
                      <div key={field.id}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{field.name}</label>
                        {field.fieldType === 'SELECT' && field.options ? (
                          <div className="flex gap-2">
                            <select
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select...</option>
                              {field.options.split(',').map((opt: string) => (
                                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                              ))}
                            </select>
                            <button
                              onClick={async () => {
                                if (savingFields.has(field.id)) return;
                                setSavingFields(prev => new Set(prev).add(field.id));
                                try {
                                  await saveCustomField({
                                    patientId: selectedPatient!.id,
                                    customFieldId: field.id,
                                    value: customFieldValues[field.id] || '',
                                  }).unwrap();
                                  refetchCustomFields();
                                  showToast('Saved!', 'success');
                                } catch (error) {
                                  showToast('Failed to save', 'error');
                                }
                                setSavingFields(prev => { const next = new Set(prev); next.delete(field.id); return next; });
                              }}
                              disabled={savingFields.has(field.id)}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {savingFields.has(field.id) ? '...' : 'Save'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'DATE' ? 'date' : 'text'}
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Enter ${field.name}`}
                            />
                            <button
                              onClick={async () => {
                                if (savingFields.has(field.id)) return;
                                setSavingFields(prev => new Set(prev).add(field.id));
                                try {
                                  await saveCustomField({
                                    patientId: selectedPatient!.id,
                                    customFieldId: field.id,
                                    value: customFieldValues[field.id] || '',
                                  }).unwrap();
                                  refetchCustomFields();
                                  showToast('Saved!', 'success');
                                } catch (error) {
                                  showToast('Failed to save', 'error');
                                }
                                setSavingFields(prev => { const next = new Set(prev); next.delete(field.id); return next; });
                              }}
                              disabled={savingFields.has(field.id)}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {savingFields.has(field.id) ? '...' : 'Save'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Appointments</h4>
              {patientAppointments?.length === 0 ? (
                <p className="text-gray-500 text-sm">No appointments found</p>
              ) : (
                <div className="space-y-2">
                  {patientAppointments?.slice(0, 5).map((apt: Appointment) => (
                    <div key={apt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{new Date(apt.dateTime).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        apt.status === 'COMPLETED' ? 'status-completed' :
                        apt.status === 'CANCELLED' ? 'status-cancelled' :
                        'status-scheduled'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="w-full mt-6 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Close
            </button>
        </div>
      </Modal>

      {/* Create Patient Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Patient">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium transition-all disabled:opacity-50 btn-shine"
                >
                  {isCreating ? 'Creating...' : 'Create Patient'}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
