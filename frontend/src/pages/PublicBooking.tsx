import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetClinicDoctorsQuery, useGetAvailableSlotsQuery, useRequestAppointmentMutation, useTriageSymptomsMutation } from '../api';
import { Icons } from '../components/Icons';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
}

interface TriageResult {
  urgency: 'emergency' | 'urgent' | 'routine' | 'telehealth';
  recommendation: string;
  reason: string;
}

const COMMON_SYMPTOMS = [
  { id: 'fever', label: 'Fever', icon: '🌡️' },
  { id: 'cough', label: 'Cough', icon: '😷' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'nausea', label: 'Nausea', icon: '🤢' },
  { id: 'sore-throat', label: 'Sore throat', icon: '🗣️' },
  { id: 'breathing', label: 'Shortness of breath', icon: '😮‍💨' },
  { id: 'chest-pain', label: 'Chest pain', icon: '❤️' },
  { id: 'abdominal', label: 'Abdominal pain', icon: '🤲' },
  { id: 'back-pain', label: 'Back pain', icon: '🦴' },
  { id: 'skin', label: 'Skin rash', icon: '🩹' },
  { id: 'joint', label: 'Joint pain', icon: '🦿' },
];

export default function PublicBooking() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    reason: '',
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState('');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { data: clinicData, isLoading: isLoadingClinic, error: clinicError } = useGetClinicDoctorsQuery(clinicId || '', {
    skip: !clinicId,
  });

  const { data: slotsData, isLoading: isLoadingSlots } = useGetAvailableSlotsQuery(
    { clinicId: clinicId || '', doctorId: selectedDoctor?.id || '', date: selectedDate ? selectedDate.toISOString().split('T')[0] : '' },
    { skip: !clinicId || !selectedDoctor?.id || !selectedDate }
  );

  const [requestAppointment, { isLoading: isSubmitting }] = useRequestAppointmentMutation();
  const [runTriage, { isLoading: isTriaging }] = useTriageSymptomsMutation();

  const doctors = clinicData?.doctors || [];
  const clinic = clinicData?.clinic;
  const availableSlots = slotsData?.slots || [];

  const steps = [
    { num: 1, label: t('portal.stepSymptoms') },
    { num: 2, label: t('portal.stepDoctor') },
    { num: 3, label: t('portal.stepDateTime') },
    { num: 4, label: t('portal.stepConfirm') },
  ];

  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates.slice(0, 7);
  }, []);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedSymptoms.length > 0 || otherSymptoms.trim() || triageResult;
      case 2:
        return selectedDoctor !== null;
      case 3:
        return selectedSlot !== '';
      case 4:
        return formData.firstName.trim() && formData.lastName.trim() && formData.phone.trim();
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleTriage = async () => {
    const allSymptoms = [...selectedSymptoms];
    if (otherSymptoms.trim()) allSymptoms.push(otherSymptoms);
    if (allSymptoms.length === 0) return;

    try {
      const result = await runTriage({ symptoms: allSymptoms.join(', ') }).unwrap();
      setTriageResult(result);
      if (result.urgency === 'emergency') {
        alert('⚠️ This appears to be a medical emergency. Please call emergency services (911) immediately!');
      }
    } catch {
      setTriageResult({ urgency: 'routine', recommendation: 'Schedule an appointment', reason: 'Continue with booking' });
    }
  };

  const handleSubmit = async () => {
    if (!clinicId || !selectedDoctor || !selectedSlot) return;
    setError('');
    try {
      await requestAppointment({
        clinicId,
        patientName: `${formData.firstName} ${formData.lastName}`,
        patientEmail: formData.email,
        patientPhone: formData.phone,
        doctorId: selectedDoctor.id,
        dateTime: selectedSlot,
        reason: formData.reason,
      }).unwrap();
      setIsSubmitted(true);
    } catch {
      setError(t('portal.bookingError'));
    }
  };

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms(prev => prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <Icons.check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('portal.bookingSuccess')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('portal.bookingSuccessMessage')}</p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-5 text-left mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Icons.calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('portal.dateTime')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Icons.clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('portal.time')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatTime(selectedSlot)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Icons.user className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('portal.doctor')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('portal.confirmationEmail')}</p>
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-medium"
          >
            {t('portal.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  if (clinicError || !clinicData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.alert className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('portal.error')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{clinicError ? t('portal.errorLoadingClinic') : t('portal.clinicNotFound')}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <Icons.arrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{clinic?.name || t('portal.bookAppointment')}</h1>
                {clinic?.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Icons.mapPin className="w-3 h-3" /> {clinic.address}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('portal.step')} {step} {t('portal.of')} 4</p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s.num 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}>
                  {step > s.num ? <Icons.check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`hidden sm:block ml-2 text-sm font-medium ${step >= s.num ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 ${step > s.num ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icons.sparkle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">{t('portal.triageTitle')}</h2>
                    <p className="text-orange-100 text-sm">{t('portal.triageSubtitle')}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{t('portal.selectSymptomsPrompt')}</p>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                  {COMMON_SYMPTOMS.map((symptom) => (
                    <button
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.label)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        selectedSymptoms.includes(symptom.label)
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <span className="text-xl">{symptom.icon}</span>
                      <span className={`text-xs font-medium ${selectedSymptoms.includes(symptom.label) ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-300'}`}>
                        {symptom.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('portal.otherSymptoms')}
                  </label>
                  <textarea
                    value={otherSymptoms}
                    onChange={(e) => setOtherSymptoms(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={t('portal.describeSymptomsPlaceholder')}
                  />
                </div>

                <button
                  onClick={handleTriage}
                  disabled={(!selectedSymptoms.length && !otherSymptoms.trim()) || isTriaging}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
                >
                  {isTriaging ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Icons.stethoscope className="w-5 h-5" />
                      {t('portal.analyzeSymptoms')}
                    </>
                  )}
                </button>

                {triageResult && (
                  <div className={`mt-4 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    triageResult.urgency === 'emergency' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                    triageResult.urgency === 'urgent' ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' :
                    triageResult.urgency === 'telehealth' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
                    'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {triageResult.urgency === 'emergency' && <Icons.alert className="w-5 h-5 text-red-600 dark:text-red-400" />}
                      {triageResult.urgency === 'urgent' && <Icons.alert className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                      {triageResult.urgency === 'telehealth' && <Icons.video className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                      {triageResult.urgency === 'routine' && <Icons.check className="w-5 h-5 text-green-600 dark:text-green-400" />}
                      <span className={`font-bold ${
                        triageResult.urgency === 'emergency' ? 'text-red-700 dark:text-red-300' :
                        triageResult.urgency === 'urgent' ? 'text-orange-700 dark:text-orange-300' :
                        triageResult.urgency === 'telehealth' ? 'text-blue-700 dark:text-blue-300' :
                        'text-green-700 dark:text-green-300'
                      }`}>
                        {triageResult.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">{triageResult.recommendation}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{triageResult.reason}</p>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-4 px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 font-medium flex items-center justify-center gap-2 transition-all"
                >
                  {t('portal.skipTriage')} <Icons.arrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icons.user className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">{t('portal.selectDoctor')}</h2>
                    <p className="text-blue-100 text-sm">{t('portal.chooseDoctor')}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {isLoadingClinic ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="text-center py-8">
                    <Icons.user className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">{t('portal.noDoctorsAvailable')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          selectedDoctor?.id === doctor.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-gray-100 dark:border-gray-700 hover:border-blue-300 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {doctor.firstName[0]}{doctor.lastName[0]}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">Dr. {doctor.firstName} {doctor.lastName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.specialty || t('portal.generalPractice')}</p>
                        </div>
                        {selectedDoctor?.id === doctor.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Icons.check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center gap-2 transition-colors"
              >
                <Icons.arrowLeft className="w-4 h-4" /> {t('common.back')}
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedDoctor}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
              >
                {t('common.next')} <Icons.arrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icons.calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">{t('portal.selectDateTime')}</h2>
                    <p className="text-purple-100 text-sm">{t('portal.chooseTime')}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('portal.selectDate')}</p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
                  {weekDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                      disabled={date.getDay() === 0}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-100 dark:border-gray-700 hover:border-purple-300 bg-white dark:bg-gray-700 disabled:opacity-50'
                      }`}
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{date.getDate()}</p>
                    </button>
                  ))}
                </div>

                {selectedDate && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('portal.availableSlots')}</p>
                    {isLoadingSlots ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <Icons.clock className="w-8 h-8 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">{t('portal.noSlotsAvailable')}</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{t('portal.tryDifferentDate')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                              selectedSlot === slot
                                ? 'border-purple-500 bg-purple-500 text-white shadow-md'
                                : 'border-gray-100 dark:border-gray-700 hover:border-purple-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center gap-2 transition-colors"
              >
                <Icons.arrowLeft className="w-4 h-4" /> {t('common.back')}
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedSlot}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
              >
                {t('common.next')} <Icons.arrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icons.fileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">{t('portal.yourInformation')}</h2>
                    <p className="text-green-100 text-sm">{t('portal.fillDetails')}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('portal.firstName')} *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('portal.lastName')} *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.phone')} *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('portal.reasonForVisit')}</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('portal.reasonPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-4">{t('portal.appointmentSummary')}</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                    <Icons.calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{t('portal.date')}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                    <Icons.clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">{t('portal.time')}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatTime(selectedSlot)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                    <Icons.user className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400">{t('portal.doctor')}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedDoctor ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center gap-2 transition-colors"
              >
                <Icons.arrowLeft className="w-4 h-4" /> {t('common.back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.check className="w-5 h-5" />
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
