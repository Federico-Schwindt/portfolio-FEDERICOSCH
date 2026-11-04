/**
 * The name set in a very wide display face, filling the viewport width.
 * Rendered as SVG text so it scales to any width without layout shifts.
 */
export function Wordmark({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg className="wordmark" viewBox="0 0 1000 150" preserveAspectRatio="none" aria-label="Federico Schwindt" role="img">
      <text x="0" y="128" textLength="1000" lengthAdjust="spacingAndGlyphs" fill={color} fontFamily="'Archivo Variable', Archivo, sans-serif" fontWeight="800" fontSize="150" fontStretch="125%">
        SCHWINDT
      </text>
    </svg>
  )
}
