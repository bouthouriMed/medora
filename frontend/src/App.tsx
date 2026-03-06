import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setCredentials } from './store/slices/authSlice';
import { useMeQuery } from './api';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import QuickSearch from './components/QuickSearch';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patients = lazy(() => import('./pages/Patients'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Presets = lazy(() => import('./pages/Presets'));
const Tags = lazy(() => import('./pages/Tags'));
const CustomFields = lazy(() => import('./pages/CustomFields'));
const NoteTemplates = lazy(() => import('./pages/NoteTemplates'));
const EmailSettings = lazy(() => import('./pages/EmailSettings'));
const Settings = lazy(() => import('./pages/Settings'));
const Users = lazy(() => import('./pages/Users'));
const Portal = lazy(() => import('./pages/Portal'));
const LabResults = lazy(() => import('./pages/LabResults'));
const Tasks = lazy(() => import('./pages/Tasks'));
const PatientDetail = lazy(() => import('./pages/PatientDetail'));
const PublicBooking = lazy(() => import('./pages/PublicBooking'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const Insurance = lazy(() => import('./pages/Insurance'));
const DoctorRatings = lazy(() => import('./pages/DoctorRatings'));
const Messages = lazy(() => import('./pages/Messages'));
const RemoteMonitoring = lazy(() => import('./pages/RemoteMonitoring'));
const Telemedicine = lazy(() => import('./pages/Telemedicine'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Notifications = lazy(() => import('./pages/Notifications'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { data: meData } = useMeQuery(undefined, { skip: !isAuthenticated || !!user });
  useTheme();

  useEffect(() => {
    if (meData?.user) {
      dispatch(setCredentials({ user: meData.user, token: localStorage.getItem('token') || '' }));
    }
  }, [meData, dispatch]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <QuickSearch />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
        <Route path="/portal/:token" element={<Portal />} />
        <Route path="/book/:clinicId" element={<PublicBooking />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/patients/:id" element={<PatientDetail />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/presets" element={<Presets />} />
                    <Route path="/tags" element={<Tags />} />
                    <Route path="/custom-fields" element={<CustomFields />} />
                    <Route path="/note-templates" element={<NoteTemplates />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/email-settings" element={<EmailSettings />} />
                    <Route path="/lab-results" element={<LabResults />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/waitlist" element={<Waitlist />} />
                    <Route path="/insurance" element={<Insurance />} />
                    <Route path="/doctor-ratings" element={<DoctorRatings />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/remote-monitoring" element={<RemoteMonitoring />} />
                    <Route path="/telemedicine" element={<Telemedicine />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/audit-logs" element={<AuditLogs />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Routes>
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
