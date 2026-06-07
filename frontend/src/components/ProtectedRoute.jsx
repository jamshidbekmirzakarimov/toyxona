import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// ---------------------------------------------------------------------------
//  ProtectedRoute — route'ni himoyalaydi.
//   - token yo'q bo'lsa -> /login
//   - roles berilgan bo'lib, user roli mos kelmasa -> /unauthorized
//   - roles berilmasa -> faqat kirish (har qanday rol) yetarli
//
//  Foydalanish:
//    <ProtectedRoute roles={['admin']}><AdminVenuesPage /></ProtectedRoute>
//    <ProtectedRoute><MyBookings /></ProtectedRoute>
// ---------------------------------------------------------------------------
export default function ProtectedRoute({ roles, children }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
