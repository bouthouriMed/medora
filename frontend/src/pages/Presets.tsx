import { useState } from 'react';
import { useGetPresetsQuery, useCreatePresetMutation, useDeletePresetMutation, useCreatePresetsBulkMutation } from '../api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import type { Preset, PresetType } from '../types';
import { useTranslation } from 'react-i18next';

const PRESET_TYPES: { value: PresetType; label: string; color: string }[] = [
  { value: 'DIAGNOSIS', label: 'Diagnosis', color: 'bg-blue-100 text-blue-700' },
  { value: 'PRESCRIPTION', label: 'Prescription', color: 'bg-purple-100 text-purple-700' },
  { value: 'PROCEDURE', label: 'Procedure', color: 'bg-green-100 text-green-700' },
];

const DEFAULT_PRESETS: { name: string; type: PresetType; description?: string; price?: number }[] = [
  { name: 'Annual Checkup', type: 'PROCEDURE', description: 'General health checkup', price: 50 },
  { name: 'Flu', type: 'DIAGNOSIS', description: 'Common flu diagnosis' },
  { name: 'Amoxicillin 500mg', type: 'PRESCRIPTION', description: 'Antibiotic - take 3 times daily', price: 15 },
  { name: 'Blood Pressure Check', type: 'PROCEDURE', description: 'Basic BP measurement', price: 20 },
  { name: 'Common Cold', type: 'DIAGNOSIS', description: 'Upper respiratory infection' },
  { name: 'Ibuprofen 400mg', type: 'PRESCRIPTION', description: 'Pain reliever - take as needed', price: 8 },
  { name: 'Vaccination', type: 'PROCEDURE', description: 'General vaccination', price: 30 },
  { name: 'Diabetes Check', type: 'PROCEDURE', description: 'Blood glucose monitoring', price: 25 },
  { name: 'Allergies', type: 'DIAGNOSIS', description: 'Allergic rhinitis diagnosis' },
  { name: 'Vitamin D Supplement', type: 'PRESCRIPTION', description: '1000IU daily', price: 12 },
];

export default function Presets() {
  const [filterType, setFilterType] = useState<PresetType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [search, setSearch] = useState('');

  const { data: presets, isLoading } = useGetPresetsQuery(filterType || undefined);
  const [createPreset, { isLoading: isCreating }] = useCreatePresetMutation();
  const [deletePreset] = useDeletePresetMutation();
  const [createPresetsBulk] = useCreatePresetsBulkMutation();

  const [formData, setFormData] = useState({
    name: '',
    type: 'DIAGNOSIS' as PresetType,
    description: '',
    price: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPreset({
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
      }).unwrap();
      setShowModal(false);
      setFormData({ name: '', type: 'DIAGNOSIS', description: '', price: '' });
      showToast('Preset created successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create preset', 'error');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await createPresetsBulk({ presets: DEFAULT_PRESETS }).unwrap();
      setShowBulkModal(false);
      showToast('Default presets added successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to add presets', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      try {
        await deletePreset(id).unwrap();
        showToast('Preset deleted successfully', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to delete preset', 'error');
      }
    }
  };

  const filteredPresets = presets?.filter((p: Preset) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getTypeStyle = (type: PresetType) => {
    return PRESET_TYPES.find((t) => t.value === type)?.color || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quick Presets</h1>
          <p className="text-gray-500 mt-1">Manage common diagnoses, prescriptions, and procedures</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Seed Defaults
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
          >
            + Add Preset
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search presets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              filterType === '' ? 'btn-gradient text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {PRESET_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filterType === type.value
                  ? 'btn-gradient text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : filteredPresets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">⚡</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No presets found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first preset</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            + Add Preset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map((preset: Preset) => (
            <div
              key={preset.id}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover-lift transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{preset.name}</h3>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${getTypeStyle(preset.type)}`}>
                    {preset.type}
                  </span>
                </div>
                {preset.price && (
                  <span className="text-lg font-bold text-green-600">${preset.price}</span>
                )}
              </div>
              {preset.description && (
                <p className="text-gray-500 text-sm mb-4">{preset.description}</p>
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleDelete(preset.id)}
                  className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Preset">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Annual Checkup, Flu, Amoxicillin 500mg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PresetType })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {PRESET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Optional notes or usage instructions"
                />
              </div>
              {formData.type === 'PROCEDURE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                  />
                </div>
              )}
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
                  {isCreating ? 'Creating...' : 'Create Preset'}
                </button>
              </div>
            </form>
        </div>
      </Modal>

      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Seed Default Presets">
        <div className="p-6">
            
            <p className="text-gray-600 mb-4">
              This will add the following default presets to your clinic:
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto mb-6">
              <div className="space-y-2">
                {DEFAULT_PRESETS.map((preset, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-900">{preset.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${PRESET_TYPES.find(t => t.value === preset.type)?.color}`}>
                      {preset.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSeedDefaults}
                className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium transition-all btn-shine"
              >
                Add Defaults
              </button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
