import { useState, useEffect } from 'react';
import { useGetClinicSettingsQuery, useUpdateClinicSettingsMutation, useSendTestEmailMutation } from '../api';
import { showToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

export default function EmailSettings() {
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
  const [testEmail, setTestEmail] = useState('');

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
      showToast(t('other.settingsSaved'), 'success');
      refetch();
    } catch (error) {
      showToast(t('other.failedToSaveSettings'), 'error');
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      showToast(t('other.enterTestEmail'), 'error');
      return;
    }
    try {
      await sendTestEmail({ email: testEmail }).unwrap();
      showToast(t('other.testEmailSent'), 'success');
    } catch (error) {
      showToast(t('other.failedToSendTestEmail'), 'error');
    }
  };

  if (isLoading) {
    return <div className="p-6"><div className="h-64 skeleton rounded-xl"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('settings.emailSettings')}</h1>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mt-1">{t('settings.configureClinic')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 dark:border-gray-700 p-6">
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
          <div className="space-y-4 pl-8 border-l-2 border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">SMTP Host</label>
              <input
                type="text"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="smtp.gmail.com" placeholder-gray-500
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">SMTP Port</label>
              <input
                type="text"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="587" placeholder-gray-500
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">SMTP Username</label>
              <input
                type="text"
                value={formData.smtpUser}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your email" placeholder-gray-500
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">SMTP Password</label>
              <input
                type="password"
                value={formData.smtpPassword}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="app password" placeholder-gray-500
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fromEmail')}</label>
              <input
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="noreply@yourclinic.com" placeholder-gray-500
              />
            </div>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com" placeholder-gray-500
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
              >
                Test
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg font-medium disabled:opacity-50"
          >
            {isSaving ? t('other.savingButton') : t('settings.saveSettings')}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
        <strong>{t('settings.note')}:</strong> {t('settings.gmailNote')} <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="underline">App Password</a>.
      </div>
    </div>
  );
}
