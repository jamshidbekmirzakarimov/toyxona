// ---------------------------------------------------------------------------
//  Skeleton — yuklanish paytidagi "joy egallovchi" (placeholder) holatlar.
// ---------------------------------------------------------------------------

// To'yxona kartochkasi skeleton'i
export function SkeletonCard() {
  return (
    <div className="card venue-card">
      <div className="skeleton skeleton-thumb" />
      <div className="venue-body">
        <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        <div className="skeleton skeleton-line" style={{ width: '40%' }} />
        <div className="skeleton skeleton-line" style={{ width: '55%' }} />
      </div>
    </div>
  );
}

// Karta gridi skeleton'i
export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Jadval qatorlari skeleton'i
export function SkeletonRows({ rows = 5, cols = 5 }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <div className="skeleton skeleton-line" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
