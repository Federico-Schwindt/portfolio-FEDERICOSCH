/** A regular polygon outline on a dashed centre line: the process "smoothing" motif (square → circle). */
export function Shape({ sides }: { sides: number }) {
  const r = 46
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    return `${(60 + Math.cos(a) * r).toFixed(2)},${(60 + Math.sin(a) * r).toFixed(2)}`
  })
  const d = `M${pts.join('L')}Z`
  return (
    <svg className="shape" viewBox="0 0 120 120" aria-hidden="true">
      <line x1="-200" y1="60" x2="320" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="4 5" opacity="0.7" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="60" cy="60" r="2.4" fill="currentColor" />
    </svg>
  )
}
