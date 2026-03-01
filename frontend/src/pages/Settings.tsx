import { useState, useEffect } from 'react';
import { useGetClinicSettingsQuery, useUpdateClinicSettingsMutation, useSendTestEmailMutation } from '../api';
import { showToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const { data: settings, isLoading, refetch } = useGetClinicSettingsQuery(undefined);
  const [updateSettings, { isLoading: isSaving }] = useUpdateClinicSettingsMutation();
  const [sendTestEmail] = useSendTestEmailMutation();
  const [formData, setFormData] = useState({
    emailNotifications: false,
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        emailNotifications: settings.emailNotifications || false,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || '',
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || '',
        fromEmail: settings.fromEmail || '',
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(formData).unwrap();
      showToast('Settings saved!', 'success');
      refetch();
    } catch (error) {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleTestEmail = async () => {
    if (!formData.fromEmail) {
      showToast('Please enter a test email address', 'error');
      return;
    }
    try {
      await sendTestEmail({ email: formData.fromEmail }).unwrap();
      showToast('Test email sent!', 'success');
    } catch (error) {
      showToast('Failed to send test email', 'error');
    }
  };

  if (isLoading) {
    return <div className="p-6"><div className="h-64 skeleton rounded-xl"></div></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{t('settings.configureClinic')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">{t('settings.emailNotifications')}</h2>
        
        <div className="mb-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">{t('settings.enableEmailNotifications')}</span>
          </label>
        </div>

        {formData.emailNotifications && (
          <div className="space-y-4 pl-8 border-l-2 border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1.5">{t('settings.smtpHost')}</label>
              <input
                type="text"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1.5">{t('settings.smtpPort')}</label>
              <input
                type="text"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                placeholder="587"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1.5">{t('settings.smtpUsername')}</label>
              <input
                type="text"
                value={formData.smtpUser}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                placeholder="your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1.5">{t('settings.smtpPassword')}</label>
              <input
                type="password"
                value={formData.smtpPassword}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                placeholder="app password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1.5">{t('settings.fromEmail')}</label>
              <input
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                placeholder="noreply@yourclinic.com"
              />
            </div>
            <button
              type="button"
              onClick={handleTestEmail}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-xl font-medium transition-colors"
            >
              {t('settings.sendTestEmail')}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg font-medium disabled:opacity-50"
          >
            {isSaving ? t('settings.saving') : t('settings.saveSettings')}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
        <strong>{t('common.note')}:</strong> {t('settings.gmailNote')}
      </div>
    </div>
  );
}
