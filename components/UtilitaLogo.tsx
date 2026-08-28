interface UtilitaLogoProps {
  size?: number;
  className?: string;
}

/** Inline SVG — matches public/icon.svg brand mark */
export default function UtilitaLogo({
  size = 48,
  className = "",
}: UtilitaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M360,250 L360,624 A152,152 0 0 0 664,624 L664,250"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="148"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="512" cy="410" r="62" fill="#FF7A45" />
    </svg>
  );
}
