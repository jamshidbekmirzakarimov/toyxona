import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { isEmail, isOtpCode } from '../utils/validators';
import { roleHome } from '../utils/roles';

// ---------------------------------------------------------------------------
//  VerifyOtpPage — owner login'idan keyin email OTP tasdiqlash.
//  Email login sahifasidan navigate state orqali keladi (bo'lmasa qo'lda kiritsa bo'ladi).
//  Tasdiqlangach rolga qarab redirect qilinadi.
// ---------------------------------------------------------------------------
export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!isEmail(form.email)) e.email = 'Email formati noto\'g\'ri';
    if (!isOtpCode(form.code)) e.code = 'Kod 6 xonali raqam bo\'lishi kerak';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const user = await verifyOtp(form.email.trim(), form.code.trim());
      toast.success('Email tasdiqlandi!');
      navigate(roleHome(user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP tasdiqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card card">
      <h2>Email tasdiqlash</h2>
      <p className="muted">Emailingizga yuborilgan 6 xonali kodni kiriting.</p>

      <form className="form" onSubmit={submit} noValidate>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>

        <label>
          Kod
          <input
            name="code"
            value={form.code}
            onChange={onChange}
            maxLength={6}
            inputMode="numeric"
            className={errors.code ? 'input-error' : ''}
          />
          {errors.code && <span className="field-error">{errors.code}</span>}
        </label>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
        </button>
        <p className="muted">
          <Link to="/login">Kirish sahifasiga qaytish</Link>
        </p>
      </form>
    </div>
  );
}
