import { useState } from 'react';
import Modal from './Modal';
import type { Patient, User } from '../types';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    patientId: string;
    doctorId: string;
    dateTime: string;
    notes: string;
    isRecurring: boolean;
    repeatFrequency: string;
    repeatInterval: number;
    repeatEndDate: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    patientId: string;
    doctorId: string;
    dateTime: string;
    notes: string;
    isRecurring: boolean;
    repeatFrequency: string;
    repeatInterval: number;
    repeatEndDate: string;
  }>>;
  patients: Patient[];
  doctors: User[];
  isLoading: boolean;
  t: (key: string) => string;
}

export default function AppointmentForm({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  patients,
  doctors,
  isLoading,
  t,
}: AppointmentFormProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('appointments.newAppointment')}>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('other.patient')} *
          </label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{t('common.select')} {t('other.patient')}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('other.doctor')} *
          </label>
          <select
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{t('common.select')} {t('other.doctor')}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('other.dateTime')} *
          </label>
          <input
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('common.notes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.isRecurring}
            onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="isRecurring" className="text-sm text-gray-700 dark:text-gray-300">
            {t('appointments.recurring')}
          </label>
        </div>

        {formData.isRecurring && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('appointments.frequency')}
              </label>
              <select
                value={formData.repeatFrequency}
                onChange={(e) => setFormData({ ...formData, repeatFrequency: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg"
              >
                <option value="DAILY">{t('appointments.daily')}</option>
                <option value="WEEKLY">{t('appointments.weekly')}</option>
                <option value="MONTHLY">{t('appointments.monthly')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('appointments.every')}
              </label>
              <input
                type="number"
                min={1}
                value={formData.repeatInterval}
                onChange={(e) => setFormData({ ...formData, repeatInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('appointments.endDate')}
              </label>
              <input
                type="date"
                value={formData.repeatEndDate}
                onChange={(e) => setFormData({ ...formData, repeatEndDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium transition-all disabled:opacity-50 btn-shine"
          >
            {isLoading ? t('other.creating') : t('appointments.newAppointment')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
