import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Dashboard pages
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';

// Feature pages
import CoursesPage from './pages/courses/CoursesPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import AssignmentsPage from './pages/assignments/AssignmentsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

// New feature pages
import LiveClassesPage from './pages/liveclasses/LiveClassesPage';
import BatchesPage from './pages/batches/BatchesPage';
import PaymentRemindersPage from './pages/reminders/PaymentRemindersPage';
import CourseMarketplace from './pages/marketplace/CourseMarketplace';
import SettingsPage from './pages/settings/SettingsPage';
import CertificatesPage from './pages/certificates/CertificatesPage';
import AttendancePage from './pages/attendance/AttendancePage';
import CommunityPage from './pages/community/CommunityPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';

function DashboardRouter() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Courses */}
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />

            {/* Live Classes */}
            <Route path="/live-classes" element={<LiveClassesPage />} />

            {/* Assignments */}
            <Route path="/assignments" element={<AssignmentsPage />} />

            {/* Attendance */}
            <Route path="/attendance" element={<AttendancePage />} />

            {/* Batches */}
            <Route path="/batches" element={<BatchesPage />} />

            {/* Payments */}
            <Route path="/payments" element={<PaymentsPage />} />

            {/* Payment Reminders */}
            <Route path="/reminders" element={<PaymentRemindersPage />} />

            {/* Certificates */}
            <Route path="/certificates" element={<CertificatesPage />} />

            {/* Community */}
            <Route path="/community" element={<CommunityPage />} />

            {/* Announcements */}
            <Route path="/announcements" element={<AnnouncementsPage />} />

            {/* Notifications */}
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Settings */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Public Marketplace */}
            <Route path="/marketplace" element={<CourseMarketplace />} />

            {/* Default route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
