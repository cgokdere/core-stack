import React from 'react';

// One small, consistent icon set (24 px grid, 1.75 stroke, round caps).
// Icons are decorative: the text next to them carries the meaning, so they are hidden from screen readers.
function Svg({ children, size = 20, className, strokeWidth = 1.75, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const TasksIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <path d="m8 12.2 3 2.8 5-6" />
  </Svg>
);

export const NotebookIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="18" rx="3.2" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Svg>
);

export const FolderIcon = (p) => (
  <Svg {...p}>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
  </Svg>
);

export const ChartIcon = (p) => (
  <Svg {...p}>
    <rect x="4" y="11" width="3.6" height="9" rx="1.2" />
    <rect x="10.2" y="4" width="3.6" height="16" rx="1.2" />
    <rect x="16.4" y="14" width="3.6" height="6" rx="1.2" />
  </Svg>
);

export const SparkleIcon = (p) => (
  <Svg {...p}>
    <path d="M11 3.5 12.9 9 18.5 11l-5.6 1.9L11 18.5l-1.9-5.6L3.5 11 9.1 9z" />
    <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  </Svg>
);

export const UsersIcon = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8.2" r="3.2" />
    <path d="M3.5 20c.5-3.3 2.8-5 5.5-5s5 1.7 5.5 5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M16.2 14.4c2.5-.2 4.3 1.2 4.8 4" />
  </Svg>
);

export const PlusIcon = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.6 4.6L19 7.5" />
  </Svg>
);

export const ChevronLeftIcon = (p) => (
  <Svg {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
);

export const ChevronRightIcon = (p) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);

export const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const UploadIcon = (p) => (
  <Svg {...p}>
    <path d="M12 16V4.5M7 9l5-5 5 5M4.5 16v2.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V16" />
  </Svg>
);

export const DownloadIcon = (p) => (
  <Svg {...p}>
    <path d="M12 4v11.5M7 10.5l5 5 5-5M4.5 16v2.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V16" />
  </Svg>
);

export const EyeIcon = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const PencilIcon = (p) => (
  <Svg {...p}>
    <path d="M4 20l.9-4L16.2 4.7a2.1 2.1 0 0 1 3 0l.1.1a2.1 2.1 0 0 1 0 3L8 19.1z" />
    <path d="m14.5 6.5 3 3" />
  </Svg>
);

export const ClockIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Svg>
);

export const LogoutIcon = (p) => (
  <Svg {...p}>
    <path d="M9.5 4H7a2.5 2.5 0 0 0-2.5 2.5v11A2.5 2.5 0 0 0 7 20h2.5M15 8l4 4-4 4M19 12H9.5" />
  </Svg>
);

export const ShieldIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3l7.5 3v5.4c0 4.4-3.1 8-7.5 9.6-4.4-1.6-7.5-5.2-7.5-9.6V6z" />
    <path d="m9 12 2.3 2.3 3.9-4.5" />
  </Svg>
);

export const FileIcon = (p) => (
  <Svg {...p}>
    <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M14 3v5h5" />
  </Svg>
);

export const ImageIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="3.2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17 5-4.5 3.5 3L16 12l4 4" />
  </Svg>
);

export const InboxIcon = (p) => (
  <Svg {...p}>
    <path d="M4 13.5 6.4 6.2A2 2 0 0 1 8.3 5h7.4a2 2 0 0 1 1.9 1.2L20 13.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M4 13.5h4.2a1 1 0 0 1 1 .7 3 3 0 0 0 5.6 0 1 1 0 0 1 1-.7H20" />
  </Svg>
);

// The brand mark: three connected people, as in "one shared space". Ink tile, lime nodes.
export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="17" fill="#0d1117" />
      <path d="M32 18 20 44M32 18l12 26M20 44h24" stroke="rgba(255,255,255,.32)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="32" cy="18" r="6.5" fill="#b8f24b" />
      <circle cx="20" cy="44" r="6.5" fill="#fff" />
      <circle cx="44" cy="44" r="6.5" fill="#fff" />
    </svg>
  );
}

export const ThumbUpIcon = (p) => (
  <Svg {...p}>
    <path d="M8 11v9H5.5A1.5 1.5 0 0 1 4 18.5v-6A1.5 1.5 0 0 1 5.5 11zM8 11l3.2-6.2A1.6 1.6 0 0 1 14 5.6V9h4.4a1.8 1.8 0 0 1 1.8 2.1l-1 6.2a2.4 2.4 0 0 1-2.4 2H8" />
  </Svg>
);

export const FlagIcon = (p) => (
  <Svg {...p}>
    <path d="M5.5 21V4.5M5.5 5h11.2l-2 3.8 2 3.8H5.5" />
  </Svg>
);

export function fileIconFor(mimeType) {
  return mimeType && mimeType.startsWith('image/') ? ImageIcon : FileIcon;
}
