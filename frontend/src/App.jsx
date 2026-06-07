import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import VenueDetailPage from './pages/VenueDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import MyBookings from './pages/MyBookings';
import OwnerVenuesPage from './pages/owner/OwnerVenuesPage';
import OwnerVenueForm from './pages/owner/OwnerVenueForm';
import OwnerBookingsPage from './pages/owner/OwnerBookingsPage';
import AdminVenuesPage from './pages/admin/AdminVenuesPage';
import AdminVenueForm from './pages/admin/AdminVenueForm';
import AdminOwnersPage from './pages/admin/AdminOwnersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

// ---------------------------------------------------------------------------
//  App — barcha route'lar. Layout (Navbar + konteyner) ichida render bo'ladi.
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Ommaviy */}
        <Route path="/" element={<HomePage />} />
        <Route path="/venues/:id" element={<VenueDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Har qanday kirgan user */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Faqat owner */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute roles={['owner']}>
              <OwnerVenuesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/venues/new"
          element={
            <ProtectedRoute roles={['owner']}>
              <OwnerVenueForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/venues/:id/edit"
          element={
            <ProtectedRoute roles={['owner']}>
              <OwnerVenueForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/bookings"
          element={
            <ProtectedRoute roles={['owner']}>
              <OwnerBookingsPage />
            </ProtectedRoute>
          }
        />

        {/* Faqat admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminVenuesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venues/new"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminVenueForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venues/:id/edit"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminVenueForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/owners"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminOwnersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminBookingsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
