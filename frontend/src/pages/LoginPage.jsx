import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { isRequired } from '../utils/validators';
import { roleHome } from '../utils/roles';

// ---------------------------------------------------------------------------
//  LoginPage — username + password.
//   - oddiy hollarda: rolga qarab redirect (admin->/admin, owner->/owner, user->/)
//   - owner birinchi marta kirsa (OTP talab): /verify-otp ga o'tadi
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!isRequired(form.username)) e.username = 'Username majburiy';
    if (!isRequired(form.password)) e.password = 'Parol majburiy';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await login(form.username, form.password);
      if (res.requireOtp) {
        toast.info('Emailingizga tasdiqlash kodi yuborildi');
        navigate('/verify-otp', { state: { email: res.email } });
      } else {
        toast.success('Xush kelibsiz!');
        navigate(roleHome(res.user.role));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card card">
      <h2>Kirish</h2>

      <form className="form" onSubmit={submit} noValidate>
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            className={errors.username ? 'input-error' : ''}
          />
          {errors.username && <span className="field-error">{errors.username}</span>}
        </label>

        <label>
          Parol
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            className={errors.password ? 'input-error' : ''}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Kirilmoqda...' : 'Kirish'}
        </button>
        <p className="muted">
          Akkaunt yo'qmi? <Link to="/register">Ro'yxatdan o'ting</Link>
        </p>
      </form>
    </div>
  );
}
