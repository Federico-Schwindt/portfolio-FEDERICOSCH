/** Federico's mark (two blades and a dot), drawn inline so it follows the theme: blades in the text colour, the dot always red. */
export function Mark({ size = 26, label }: { size?: number; label?: string }) {
  return (
    <svg className="mark" viewBox="518 292 572.5 466" height={size} width={Math.round(size * 1.2285)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path fill="currentColor" d="M970 301A108 108 0 0 1 862.12 404L742.39 404A112 112 0 0 0 663.2 436.8L544 556A94 94 0 0 1 544.96 424.04L618.79 350.21A168 168 0 0 1 737.59 301ZM1040 459A115 115 0 0 1 925.35 565L775.72 565A79 79 0 0 0 719.86 588.14L552 756A100 100 0 0 1 554.18 616.82L673.34 497.66A132 132 0 0 1 766.68 459Z" />
      <circle cx="1046.5" cy="337.5" r="44" fill="#F01111" />
    </svg>
  )
}
