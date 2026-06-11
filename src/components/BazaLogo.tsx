export function BazaLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Baza Market">
      <defs>
        <linearGradient id="bzg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* speed lines */}
      <rect x="2" y="28" width="10" height="3" rx="1.5" fill="url(#bzg)" opacity=".6" />
      <rect x="6" y="36" width="14" height="3" rx="1.5" fill="url(#bzg)" opacity=".9" />
      {/* bag */}
      <path
        d="M22 22h26a3 3 0 0 1 3 3l-2 28a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4l-2-28a3 3 0 0 1 3-3z"
        fill="url(#bzg)"
      />
      <path
        d="M28 22v-4a7 7 0 0 1 14 0v4"
        stroke="url(#bzg)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* B letter */}
      <text
        x="35"
        y="48"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontWeight="900"
        fontSize="22"
        fill="#0f172a"
      >
        B
      </text>
    </svg>
  );
}