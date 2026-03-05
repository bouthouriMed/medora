import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetPortalDataQuery, usePortalChatMutation } from '../api';
import type { PortalData } from '../types';
import { useTranslation } from 'react-i18next';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;
        if (trimmed.startsWith('# ')) return <h3 key={i} className="text-lg font-bold text-gray-900 dark:text-white mt-3">{trimmed.slice(2)}</h3>;
        if (trimmed.startsWith('## ')) return <h4 key={i} className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-2">{trimmed.slice(3)}</h4>;
        if (trimmed.startsWith('### ')) return <h5 key={i} className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2">{trimmed.slice(4)}</h5>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.slice(2);
          return <p key={i} className="pl-4 before:content-['•'] before:mr-2 before:text-blue-400">{formatInline(text)}</p>;
        }
        if (/^\d+\.\s/.test(trimmed)) {
          return <p key={i} className="pl-4">{formatInline(trimmed)}</p>;
        }
        return <p key={i}>{formatInline(trimmed)}</p>;
      })}
    </div>
  );
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function AIChatWidget({ token, patientName }: { token: string; patientName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hi ${patientName}! I can help answer questions about your health information. What would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [sendChat, { isLoading }] = usePortalChatMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: msg };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      const history = updatedMessages.filter(m => m !== updatedMessages[0]).map(m => ({ role: m.role, content: m.content }));
      const result = await sendChat({ token, message: msg, history }).unwrap();
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble right now. Please try again later or contact the clinic directly." }]);
    }
  };

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-50"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Health Assistant</h3>
              <p className="text-white/70 text-xs">Ask about your health info</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? <MarkdownContent content={msg.content} /> : msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your health..."
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    MILD: 'bg-yellow-100 text-yellow-700',
    MODERATE: 'bg-orange-100 text-orange-700',
    SEVERE: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[severity] || 'bg-gray-100 text-gray-700'}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    RESOLVED: 'bg-gray-100 text-gray-600',
    COMPLETED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    ABNORMAL: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export default function Portal() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useGetPortalDataQuery(token || '', {
    skip: !token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('portal.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('portal.unableToLoad')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            The link you followed may be invalid or expired. Please contact your healthcare provider for assistance.
          </p>
        </div>
      </div>
    );
  }

  const portalData = data as PortalData;
  const { patient, clinic, upcomingAppointments, pastAppointments, outstandingInvoices, diagnoses, prescriptions, allergies, conditions, vitals, labResults, summary } = portalData;

  const activeDiagnoses = diagnoses.filter(d => d.status === 'ACTIVE');
  const activePrescriptions = prescriptions.filter(p => p.status === 'ACTIVE');
  const activeConditions = conditions.filter(c => c.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{clinic.name}</h1>
              {clinic.address && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{clinic.address}</p>}
            </div>
            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
              {clinic.phone && <p>📞 {clinic.phone}</p>}
              {clinic.email && <p>✉️ {clinic.email}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome, {patient.firstName}!
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{t('portal.yourPersonalHealthPortal')}</p>
            </div>
          </div>
        </div>

        {/* Outstanding Invoices */}
        {outstandingInvoices.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-800">
                Outstanding Invoices: {formatCurrency(outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
              </h3>
            </div>
            <div className="space-y-3">
              {outstandingInvoices.map((invoice) => (
                <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('other.due')}: {invoice.dueDate ? formatDate(invoice.dueDate) : t('invoices.noDueDate')}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Summary */}
        {summary && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Health Summary
              </h3>
            </div>
            <div className="p-6">
              <MarkdownContent content={summary} />
            </div>
          </div>
        )}

        {/* Appointments */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upcoming Appointments
              </h3>
            </div>
            <div className="p-6">
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('portal.noUpcomingAppointments')}</p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="border-l-4 border-green-500 pl-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatDate(apt.dateTime)}</p>
                      <p className="text-gray-600 dark:text-gray-400">{formatTime(apt.dateTime)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('appointments.dr')} {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                        apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 dark:text-gray-300'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Appointment History
              </h3>
            </div>
            <div className="p-6">
              {pastAppointments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('portal.noPastAppointments')}</p>
              ) : (
                <div className="space-y-4">
                  {pastAppointments.slice(0, 5).map((apt) => (
                    <div key={apt.id} className="border-l-4 border-purple-400 pl-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatDate(apt.dateTime)}</p>
                      <p className="text-gray-600 dark:text-gray-400">{formatTime(apt.dateTime)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('appointments.dr')} {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                        apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 dark:text-gray-300'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information Grid */}
        {(activeDiagnoses.length > 0 || activePrescriptions.length > 0 || allergies.length > 0 || activeConditions.length > 0) && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Active Diagnoses */}
            {activeDiagnoses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Active Diagnoses
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  {activeDiagnoses.map((d) => (
                    <div key={d.id} className="flex items-start justify-between gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{d.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.icdCode} &middot; {formatShortDate(d.diagnosedAt)}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Medications */}
            {activePrescriptions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Current Medications
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  {activePrescriptions.map((p) => (
                    <div key={p.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{p.medication}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.dosage} &middot; {p.frequency}</p>
                      {p.duration && <p className="text-xs text-gray-400 dark:text-gray-500">Duration: {p.duration}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {allergies.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Allergies
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  {allergies.map((a) => (
                    <div key={a.id} className="flex items-start justify-between gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{a.allergen}</p>
                        {a.reaction && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reaction: {a.reaction}</p>}
                      </div>
                      <SeverityBadge severity={a.severity} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {activeConditions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Conditions
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  {activeConditions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Vitals */}
        {vitals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Recent Vitals
              </h3>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">BP</th>
                    <th className="pb-2 font-medium">HR</th>
                    <th className="pb-2 font-medium">Temp</th>
                    <th className="pb-2 font-medium">Weight</th>
                    <th className="pb-2 font-medium">O2</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-200">
                  {vitals.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2">{formatShortDate(v.recordedAt)}</td>
                      <td className="py-2">
                        {v.bloodPressureSystolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : '-'}
                      </td>
                      <td className="py-2">{v.heartRate ? `${v.heartRate} bpm` : '-'}</td>
                      <td className="py-2">{v.temperature ? `${v.temperature}°F` : '-'}</td>
                      <td className="py-2">{v.weight ? `${v.weight} kg` : '-'}</td>
                      <td className="py-2">{v.oxygenSat ? `${v.oxygenSat}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Lab Results */}
        {labResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Recent Lab Results
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {labResults.map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{l.testName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {l.result || 'Awaiting results'} {l.normalRange && `(Normal: ${l.normalRange})`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatShortDate(l.orderedAt)}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('portal.fullName')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('portal.email')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{patient.email || t('other.notProvided')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('portal.phone')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{patient.phone || t('other.notProvided')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('portal.dateOfBirth')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : t('other.notProvided')}
                </p>
              </div>
              {patient.address && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 md:col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('portal.address')}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{patient.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
            This is a read-only portal. For any questions, please contact the clinic directly.
          </p>
        </div>
      </footer>

      {/* AI Chat Widget */}
      {token && <AIChatWidget token={token} patientName={patient.firstName} />}

      <style>{`
        @media print {
          body { background: white; }
          footer, .no-print { display: none; }
          .shadow-lg, .shadow-md, .shadow-sm { box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
