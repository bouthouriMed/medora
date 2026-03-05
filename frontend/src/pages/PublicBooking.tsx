import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, User, Phone, Mail, FileText, ChevronLeft, CheckCircle, AlertTriangle, Video } from 'lucide-react';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClinicInfo {
  name: string;
  address: string | null;
  phone: string | null;
}

interface TriageResult {
  urgency: 'emergency' | 'urgent' | 'routine' | 'telehealth';
  recommendation: string;
  reason: string;
}

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea', 'Sore throat',
  'Shortness of breath', 'Chest pain', 'Abdominal pain', 'Back pain',
  'Skin rash', 'Joint pain', 'Dizziness', 'Other'
];

export default function PublicBooking() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    reason: '',
  });
  const [symptoms, setSymptoms] = useState('');
  const [otherSymptoms, setOtherSymptoms] = useState('');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const loadClinicAndDoctors = async () => {
    if (!clinicId) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/public/clinic/${clinicId}/doctors`);
      if (!res.ok) throw new Error('Clinic not found');
      const data = await res.json();
      setClinic(data.clinic);
      setDoctors(data.doctors);
      setIsLoading(false);
    } catch (err) {
      setError('Clinic not found');
      setIsLoading(false);
    }
  };

  const runTriage = async () => {
    if (!symptoms.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/public/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptoms + (otherSymptoms ? `, ${otherSymptoms}` : '') }),
      });
      const data = await res.json();
      setTriageResult(data);
      setIsLoading(false);
      
      if (data.urgency === 'emergency') {
        alert('⚠️ This appears to be a medical emergency. Please call emergency services (911) immediately!');
      }
    } catch {
      setTriageResult({ urgency: 'routine', recommendation: 'Schedule an appointment', reason: 'Unable to assess symptoms' });
      setIsLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!clinicId || !selectedDoctor || !selectedDate) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/public/clinic/${clinicId}/${selectedDoctor.id}/slots/${selectedDate}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
      setIsLoading(false);
    } catch {
      setAvailableSlots([]);
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!clinicId || !selectedDoctor || !selectedSlot) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/public/clinic/${clinicId}/appointment/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          doctorId: selectedDoctor.id,
          dateTime: selectedSlot,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit appointment request');
      setIsSubmitted(true);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to submit request. Please try again.');
      setIsLoading(false);
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates.slice(0, 7);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (!clinic && clinicId) {
      loadClinicAndDoctors();
    }
  }, [clinicId]);

  useEffect(() => {
    if (selectedDate && selectedDoctor && clinicId) {
      loadSlots();
    }
  }, [selectedDate, selectedDoctor]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('portal.bookingRequestReceived')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('portal.bookingRequestMessage')}
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('portal.appointmentDetails')}:</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDisplayDate(new Date(selectedSlot))}</p>
            <p className="text-gray-600 dark:text-gray-300">{formatTime(selectedSlot)}</p>
            <p className="text-gray-600 dark:text-gray-300">{t('appointments.doctor')}. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{clinic?.name || t('portal.bookAppointment')}</h1>
              {clinic?.address && <p className="text-sm text-gray-500 dark:text-gray-400">{clinic.address}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 5 && (
                <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: AI Triage */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                {t('portal.triageTitle')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                {t('portal.triageDescription')}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('portal.selectSymptoms')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SYMPTOMS.map((symptom) => (
                      <button
                        key={symptom}
                        onClick={() => setSymptoms(prev => prev.includes(symptom) ? prev : (prev ? `${prev}, ${symptom}` : symptom))}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          symptoms.includes(symptom)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                        }`}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('portal.describeSymptoms')}
                  </label>
                  <textarea
                    value={otherSymptoms}
                    onChange={(e) => setOtherSymptoms(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder={t('portal.symptomsPlaceholder')}
                  />
                </div>

                <button
                  onClick={runTriage}
                  disabled={!symptoms.trim() || isLoading}
                  className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      {t('portal.checkUrgency')}
                    </>
                  )}
                </button>

                {triageResult && (
                  <div className={`rounded-xl p-4 ${
                    triageResult.urgency === 'emergency' ? 'bg-red-50 border border-red-200' :
                    triageResult.urgency === 'urgent' ? 'bg-orange-50 border border-orange-200' :
                    triageResult.urgency === 'telehealth' ? 'bg-blue-50 border border-blue-200' :
                    'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {triageResult.urgency === 'emergency' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                      {triageResult.urgency === 'urgent' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
                      {triageResult.urgency === 'telehealth' && <Video className="w-5 h-5 text-blue-600" />}
                      {triageResult.urgency === 'routine' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      <span className={`font-semibold ${
                        triageResult.urgency === 'emergency' ? 'text-red-700' :
                        triageResult.urgency === 'urgent' ? 'text-orange-700' :
                        triageResult.urgency === 'telehealth' ? 'text-blue-700' :
                        'text-green-700'
                      }`}>
                        {triageResult.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{triageResult.recommendation}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{triageResult.reason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep(2); }}
                disabled={!triageResult}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('appointments.selectDoctor')}
            </h2>
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => { setSelectedDoctor(doctor); setStep(3); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {doctor.firstName[0]}{doctor.lastName[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Dr. {doctor.firstName} {doctor.lastName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('appointments.doctor')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('appointments.selectDate')}
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {getWeekDates().map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => { setSelectedDate(formatDate(date)); setSelectedSlot(''); }}
                    disabled={date.getDay() === 0}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedDate === formatDate(date)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 disabled:opacity-50'
                    }`}
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{date.getDate()}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {t('appointments.selectTime')}
                </h2>
                {isLoading ? (
                  <div className="animate-pulse grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-10 bg-gray-200 rounded-lg" />)}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('portal.noAvailableSlots')}</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedSlot === slot
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                {t('common.back')}
              </button>
              <button
                onClick={() => selectedSlot && setStep(4)}
                disabled={!selectedSlot}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('portal.yourInformation')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('portal.fullName')} *</label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.email')}</label>
                  <input
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.phone')} *</label>
                  <input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('appointments.reason')}</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder={t('portal.reasonPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">{t('portal.appointmentSummary')}</p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>{formatDisplayDate(new Date(selectedSlot))}</strong> at <strong>{formatTime(selectedSlot)}</strong>
              </p>
              <p className="text-gray-600 dark:text-gray-400">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                {t('common.back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.patientName || !formData.patientPhone || isLoading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    {t('portal.confirmBooking')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
