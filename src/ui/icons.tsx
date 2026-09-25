/** Íconos SVG de trazo, 20px por defecto. Decorativos: aria-hidden siempre. */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
});

const make = (paths: React.ReactNode) =>
  function Icon({ size, ...props }: IconProps) {
    return (
      <svg {...base(size)} {...props}>
        {paths}
      </svg>
    );
  };

export const IconPlane = make(<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />);
export const IconMap = make(<><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" /><path d="M9 4v13M15 6.5v13" /></>);
export const IconList = make(<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r=".8" /><circle cx="3.5" cy="12" r=".8" /><circle cx="3.5" cy="18" r=".8" /></>);
export const IconCalendar = make(<><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>);
export const IconSwap = make(<path d="M7 7h13l-3.5-3.5M17 17H4l3.5 3.5" />);
export const IconClose = make(<path d="M6 6l12 12M18 6 6 18" />);
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconAlert = make(<><path d="M12 4 2.8 19.5h18.4L12 4z" /><path d="M12 10v4.5M12 17.2v.3" /></>);
export const IconInfo = make(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.7v.3" /></>);
export const IconBag = make(<><rect x="5" y="7.5" width="14" height="12.5" rx="2" /><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M9 20v1.2M15 20v1.2" /></>);
export const IconCarryOn = make(<><rect x="7" y="8" width="10" height="11" rx="1.6" /><path d="M10 8V5.8h4V8M9.5 19v1.5M14.5 19v1.5" /></>);
export const IconRefund = make(<><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /><path d="M12 8v4l2.5 1.5" /></>);
export const IconLeaf = make(<><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19c3-4 6-6.5 9-8" /></>);
export const IconCode = make(<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />);
export const IconSettings = make(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>);
export const IconChevronLeft = make(<path d="m15 5-7 7 7 7" />);
export const IconChevronRight = make(<path d="m9 5 7 7-7 7" />);
export const IconChevronDown = make(<path d="m5 9 7 7 7-7" />);
export const IconSearch = make(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></>);
export const IconExternal = make(<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />);
export const IconShield = make(<><path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6l-7-3z" /><path d="m9 12 2.2 2.2L15.5 10" /></>);
export const IconPin = make(<><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>);
