export default function Stars({ value }: { value: number }) {
  // value like 2.0, 2.5, 3.0 ... 5.0
  const full = Math.floor(value);
  const half = value % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span aria-label={`${value} stars`} className="inline-flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => <span key={`f${i}`}>★</span>)}
      {half ? <span key="h">☆</span> : null /* simple half marker; swap with svg if you like */}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-gray-300">★</span>)}
    </span>
  );
}
