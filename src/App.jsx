import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import RegisterPage from './pages/auth/RegisterPage'
import AboutPage from './pages/static/AboutPage'
import ContactPage from './pages/static/ContactPage'
import PrivacyPage from './pages/static/PrivacyPage'
import TermsPage from './pages/static/TermsPage'
import CookiePage from './pages/static/CookiePage'
import ScrollToTop from './components/ScrollToTop'
import SuperAdminLayout from './pages/dashboard/superadmin/SuperAdminLayout'
import SADashboard from './pages/dashboard/superadmin/SADashboard'
import SASchools from './pages/dashboard/superadmin/SASchools'
import SAUsers from './pages/dashboard/superadmin/SAUsers'
import SettingsPage from './pages/dashboard/superadmin/SettingsPage'
import AdminLayout from './pages/dashboard/admin/AdminLayout'
import AdminDashboard from './pages/dashboard/admin/AdminDashboard'
import AdminStudents from './pages/dashboard/admin/AdminStudents'
import AdminSupervisors from './pages/dashboard/admin/AdminSupervisors'
import AdminSettings from './pages/dashboard/admin/AdminSettings'
import { DialogProvider } from './components/DialogProvider'

const App = () => {
  return (
    <DialogProvider>
      <BrowserRouter>
        <ScrollToTop/>
        <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiePage />} />

        <Route path="/unauthorized" element={
          <div className="container mt-5">
            <h3 className="text-center text-danger">Access Denied</h3>
          </div>
        } />

        {/* Protected */}
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['student']}>
            <div>Student Dashboard</div>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['it_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="supervisors" element={<AdminSupervisors />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="/supervisor/*" element={
          <ProtectedRoute allowedRoles={['school_supervisor']}>
            <div>Supervisor Dashboard</div>
          </ProtectedRoute>
        } />
        
        <Route path="/super-admin" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<SADashboard />} />
          <Route path="schools" element={<SASchools />} />
          <Route path="users" element={<SAUsers />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DialogProvider>
  )
}

export default App
