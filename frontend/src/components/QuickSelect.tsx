import { useState } from 'react';
import { useGetPresetsQuery } from '../api';
import type { Preset, PresetType } from '../types';

interface QuickSelectProps {
  type: PresetType | PresetType[];
  onSelect: (preset: Preset) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function QuickSelect({ type, onSelect, placeholder = 'Select...', disabled = false }: QuickSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const types = Array.isArray(type) ? type : [type];
  const { data: allPresets } = useGetPresetsQuery(undefined);
  
  const presets = allPresets?.filter((p: Preset) => types.includes(p.type)) || [];
  const filteredPresets = presets.filter((p: Preset) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (preset: Preset) => {
    onSelect(preset);
    setIsOpen(false);
    setSearch('');
  };

  if (disabled) {
    return (
      <div className="relative">
        <select disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-400">
          <option>{placeholder}</option>
        </select>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-left flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        <span className="text-gray-500">{placeholder}</span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search presets..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-52">
            {filteredPresets.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No presets found. Add presets in the Presets page.
              </div>
            ) : (
              filteredPresets.map((preset: Preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelect(preset)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{preset.name}</p>
                    {preset.description && (
                      <p className="text-xs text-gray-500">{preset.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {preset.price && (
                      <span className="text-sm font-medium text-green-600">${preset.price}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      preset.type === 'DIAGNOSIS' ? 'bg-blue-100 text-blue-700' :
                      preset.type === 'PRESCRIPTION' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {preset.type}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
