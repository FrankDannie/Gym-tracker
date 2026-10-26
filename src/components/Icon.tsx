const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const PATHS = {
  today: ["M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"],
  plan: ["M4 6.5h16v13H4zM4 10.5h16M8 4v4M16 4v4"],
  progress: ["M4 19V5M4 19h16M8 15l3.5-4 3 2.5L20 7"],
  fuel: ["M4 12h16a8 8 0 0 1-16 0z", "M9 8.5c0-1.7 1.5-1.7 1.5-3.5M14 8.5c0-1.7 1.5-1.7 1.5-3.5"],
  guide: ["M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z", "M5 17a3 3 0 0 1 3-3h10"],
  settings: ["M4 7h9M17 7h3M4 17h3M11 17h9", circle(15, 7, 2), circle(9, 17, 2)],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  plus: ["M12 5v14M5 12h14"],
  minus: ["M5 12h14"],
  trash: ["M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12M10 11v5M14 11v5"],
  close: ["M6 6l12 12M18 6L6 18"],
  up: ["M12 19V6M6.5 11.5L12 6l5.5 5.5"],
  timer: [circle(12, 13.5, 7.5), "M12 9.5v4l2.5 2M9.5 3h5"],
  download: ["M12 4v11M7 11l5 5 5-5M5 20h14"],
  upload: ["M12 16V5M7 9l5-5 5 5M5 20h14"],
  swap: ["M7 4L3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7"],
  info: [circle(12, 12, 9), "M12 11v5M12 8h.01"],
  alert: ["M12 4l9 16H3zM12 10v4M12 17h.01"],
  chevronLeft: ["M15 6l-6 6 6 6"],
  chevronRight: ["M9 6l6 6-6 6"],
  external: ["M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
