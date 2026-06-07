import { NavLink } from 'react-router-dom';

// ---------------------------------------------------------------------------
//  AdminNav — admin bo'limlari orasidagi tab navigatsiyasi
// ---------------------------------------------------------------------------
export default function AdminNav() {
  const cls = ({ isActive }) => (isActive ? 'subnav-link active' : 'subnav-link');
  return (
    <div className="subnav">
      <NavLink to="/admin" end className={cls}>To'yxonalar</NavLink>
      <NavLink to="/admin/owners" className={cls}>Egalar</NavLink>
      <NavLink to="/admin/bookings" className={cls}>Bronlar</NavLink>
    </div>
  );
}
