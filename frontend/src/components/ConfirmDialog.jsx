// ---------------------------------------------------------------------------
//  ConfirmDialog — qayta ishlatiladigan tasdiqlash modali.
//
//  props:
//   open: boolean
//   title, message
//   confirmText, cancelText
//   loading: tugmalarni bloklaydi
//   onConfirm, onCancel
// ---------------------------------------------------------------------------
export default function ConfirmDialog({
  open,
  title = 'Tasdiqlang',
  message,
  confirmText = 'Tasdiqlash',
  cancelText = 'Bekor qilish',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {message && <p className="muted">{message}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm} disabled={loading}>
            {loading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
