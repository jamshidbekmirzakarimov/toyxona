import useToastStore from '../store/toastStore';

// ---------------------------------------------------------------------------
//  Toaster — toast xabarlarni ekranning yuqori-o'ng burchagida ko'rsatadi.
//  Layout ichida bir marta render qilinadi.
// ---------------------------------------------------------------------------
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => remove(t.id)}
          role="alert"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
