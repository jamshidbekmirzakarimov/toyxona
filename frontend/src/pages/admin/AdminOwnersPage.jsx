import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { toast } from '../../store/toastStore';
import AdminNav from '../../components/AdminNav';
import Spinner from '../../components/Spinner';
import { isRequired, isEmail, minLen } from '../../utils/validators';

// ---------------------------------------------------------------------------
//  AdminOwnersPage — egalar ro'yxati + yangi ega yaratish
// ---------------------------------------------------------------------------
export default function AdminOwnersPage() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', surname: '', email: '', username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchOwners = () => {
    setLoading(true);
    api
      .get('/admin/owners')
      .then((res) => setOwners(res.data.owners || []))
      .catch((err) => setError(err.response?.data?.message || 'Yuklab bo\'lmadi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!isRequired(form.name)) e.name = 'Ism majburiy';
    if (!isRequired(form.surname)) e.surname = 'Familiya majburiy';
    if (!isEmail(form.email)) e.email = 'Email noto\'g\'ri';
    if (!minLen(form.username, 3)) e.username = 'Username kamida 3 ta belgi';
    if (!minLen(form.password, 6)) e.password = 'Parol kamida 6 ta belgi';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await api.post('/admin/owners', form);
      toast.success('Yangi ega yaratildi');
      setForm({ name: '', surname: '', email: '', username: '', password: '' });
      fetchOwners(); // refetch
    } catch (err) {
      toast.error(err.response?.data?.message || 'Yaratishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminNav />
      <h1>Egalar</h1>

      <div className="admin-split">
        {/* Yangi ega formasi */}
        <div className="card vd-info" style={{ maxWidth: 360 }}>
          <h3>Yangi ega yaratish</h3>
          <form className="form" onSubmit={submit} noValidate>
            <label>
              Ism
              <input name="name" value={form.name} onChange={onChange} className={errors.name ? 'input-error' : ''} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>
            <label>
              Familiya
              <input name="surname" value={form.surname} onChange={onChange} className={errors.surname ? 'input-error' : ''} />
              {errors.surname && <span className="field-error">{errors.surname}</span>}
            </label>
            <label>
              Email
              <input type="email" name="email" value={form.email} onChange={onChange} className={errors.email ? 'input-error' : ''} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <label>
              Username
              <input name="username" value={form.username} onChange={onChange} className={errors.username ? 'input-error' : ''} />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </label>
            <label>
              Parol
              <input type="password" name="password" value={form.password} onChange={onChange} className={errors.password ? 'input-error' : ''} />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </label>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Yaratilmoqda...' : 'Yaratish'}</button>
          </form>
        </div>

        {/* Egalar ro'yxati */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && <Spinner />}
          {error && <p className="error">{error}</p>}
          {!loading && !error && owners.length === 0 && <p className="muted">Egalar yo'q.</p>}
          {owners.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ism</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Tasdiqlangan</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.name} {o.surname}</td>
                      <td>{o.email}</td>
                      <td>{o.username}</td>
                      <td>{o.is_verified ? 'Ha' : 'Yo\'q'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
