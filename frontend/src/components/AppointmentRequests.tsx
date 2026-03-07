interface AppointmentRequest {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  requestedDateTime: string;
  doctor?: { firstName: string; lastName: string };
  reason?: string;
}

interface AppointmentRequestsProps {
  requests: AppointmentRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  t: (key: string) => string;
}

export default function AppointmentRequests({
  requests,
  onApprove,
  onReject,
  isApproving,
  t,
}: AppointmentRequestsProps) {
  if (requests.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Pending Appointment Requests</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {requests.length} request{requests.length !== 1 ? 's' : ''} from online booking awaiting your review
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {req.patientName?.split(' ')[0]?.[0]}{req.patientName?.split(' ')[1]?.[0] || ''}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{req.patientName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {req.patientEmail && <span>{req.patientEmail}</span>}
                  {req.patientPhone && <span>{req.patientPhone}</span>}
                  <span>Dr. {req.doctor?.firstName} {req.doctor?.lastName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(req.requestedDateTime).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(req.requestedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {req.reason && (
                <span className="hidden sm:inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg max-w-[150px] truncate" title={req.reason}>
                  {req.reason}
                </span>
              )}
              <button
                onClick={() => onApprove(req.id)}
                disabled={isApproving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(req.id)}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
