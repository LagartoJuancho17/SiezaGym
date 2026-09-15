// Iconos del rediseño: trazo fino y uniforme, sin relleno, para que se apoyen
// sobre el vidrio sin pesar.
function Stroke({ children, size = 20, width = 1.7, className = "", ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const BoltIcon = (props) => (
  <Stroke {...props}>
    <path d="M13 2 4.5 13.5H11l-.8 8.5 9-11.8H12.3L13 2Z" />
  </Stroke>
);

export const BellIcon = (props) => (
  <Stroke {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Stroke>
);

export const PlusIcon = (props) => (
  <Stroke {...props}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

export const SearchIcon = (props) => (
  <Stroke {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Stroke>
);

export const FlameIcon = (props) => (
  <Stroke {...props}>
    <path d="M12 3c.6 3-1.6 4.2-2.7 5.6a5.6 5.6 0 0 0-1.3 3.6 6 6 0 1 0 12 0c0-2.3-1.2-3.6-2.4-5-.6.9-1.3 1.3-2 1.3C14 7 15 4.6 12 3Z" />
  </Stroke>
);

export const WeightIcon = (props) => (
  <Stroke {...props}>
    <path d="M3 10.5v3M6.5 7.5v9M17.5 7.5v9M21 10.5v3M6.5 12h11" />
  </Stroke>
);

export const CheckRingIcon = (props) => (
  <Stroke {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.3 4.6-4.8" />
  </Stroke>
);

export const HomeIcon = (props) => (
  <Stroke {...props}>
    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" />
  </Stroke>
);

export const ListIcon = (props) => (
  <Stroke {...props}>
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  </Stroke>
);

export const PlayIcon = (props) => (
  <Stroke {...props}>
    <path d="M8 4.8c-1.3-.8-2.5-.1-2.5 1.4v11.6c0 1.5 1.2 2.2 2.5 1.4l10-5.8c1.3-.8 1.3-2 0-2.8L8 4.8Z" />
  </Stroke>
);

export const ClockIcon = (props) => (
  <Stroke {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Stroke>
);

export const TrendIcon = (props) => (
  <Stroke {...props}>
    <path d="m4 15.5 5-5 3.5 3.5L20 7" />
    <path d="M15.5 7H20v4.5" />
  </Stroke>
);

export const UserIcon = (props) => (
  <Stroke {...props}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 20c.9-3.4 3.6-5.2 7-5.2s6.1 1.8 7 5.2" />
  </Stroke>
);

export const ChevronDownIcon = (props) => (
  <Stroke {...props}>
    <path d="m6 9.5 6 6 6-6" />
  </Stroke>
);

export const ChevronRightIcon = (props) => (
  <Stroke {...props}>
    <path d="m9.5 6 6 6-6 6" />
  </Stroke>
);

export const ArrowLeftIcon = (props) => (
  <Stroke {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Stroke>
);

export const CloseIcon = (props) => (
  <Stroke {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Stroke>
);

export const CheckIcon = (props) => (
  <Stroke {...props}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Stroke>
);

export const ChevronLeftIcon = (props) => (
  <Stroke {...props}>
    <path d="m14.5 6-6 6 6 6" />
  </Stroke>
);

export const MoreIcon = (props) => (
  <Stroke {...props}>
    <circle cx="12" cy="5" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="12" cy="19" r="1.4" />
  </Stroke>
);

export const PauseIcon = (props) => (
  <Stroke {...props}>
    <path d="M9.5 5v14M14.5 5v14" />
  </Stroke>
);
