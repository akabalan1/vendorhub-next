export function computeAvgRating(fb: { ratingQuality?: number | null, ratingSpeed?: number | null, ratingComm?: number | null }[]) {
  const vals: number[] = [];
  for (const f of fb) {
    if (typeof f.ratingQuality === 'number') vals.push(f.ratingQuality);
    if (typeof f.ratingSpeed === 'number') vals.push(f.ratingSpeed);
    if (typeof f.ratingComm === 'number') vals.push(f.ratingComm);
  }
  if (!vals.length) return null;
  const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
  return Math.round(avg * 10) / 10;
}
