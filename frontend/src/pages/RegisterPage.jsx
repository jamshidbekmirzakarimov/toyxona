import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { isRequired, isEmail, minLen } from '../utils/validators';

// ---------------------------------------------------------------------------
//  RegisterPage — oddiy foydalanuvchi ro'yxatdan o'tishi
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [form, setForm] = useState({ name: '', surname: '', email: '', username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!isRequired(form.name)) e.name = 'Ism majburiy';
    if (!isRequired(form.surname)) e.surname = 'Familiya majburiy';
    if (!isRequired(form.email)) e.email = 'Email majburiy';
    else if (!isEmail(form.email)) e.email = 'Email formati noto\'g\'ri';
    if (!minLen(form.username, 3)) e.username = 'Username kamida 3 ta belgi';
    if (!minLen(form.password, 6)) e.password = 'Parol kamida 6 ta belgi';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await register(form);
      toast.success('Ro\'yxatdan o\'tdingiz! Endi tizimga kiring.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ro\'yxatdan o\'tishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card card">
      <h2>Ro'yxatdan o'tish</h2>

      <form className="form" onSubmit={submit} noValidate>
        <Field label="Ism" name="name" value={form.name} onChange={onChange} error={errors.name} />
        <Field label="Familiya" name="surname" value={form.surname} onChange={onChange} error={errors.surname} />
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Username" name="username" value={form.username} onChange={onChange} error={errors.username} />
        <Field label="Parol" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} />

        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Yuborilmoqda...' : 'Ro\'yxatdan o\'tish'}
        </button>
        <p className="muted">
          Akkaunt bormi? <Link to="/login">Kirish</Link>
        </p>
      </form>
    </div>
  );
}

// Kichik qayta ishlatiladigan input komponenti (label + input + xato)
function Field({ label, name, type = 'text', value, onChange, error }) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={error ? 'input-error' : ''}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
