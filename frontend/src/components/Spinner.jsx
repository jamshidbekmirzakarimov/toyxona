// ---------------------------------------------------------------------------
//  Spinner — aylanuvchi yuklash indikatori
//  props: label (matn), inline (kichik, matn yonida)
// ---------------------------------------------------------------------------
export default function Spinner({ label = 'Yuklanmoqda...', inline = false }) {
  return (
    <div className={inline ? 'spinner-inline' : 'spinner-wrap'}>
      <span className="spinner" />
      {label && <span className="muted">{label}</span>}
    </div>
  );
}
