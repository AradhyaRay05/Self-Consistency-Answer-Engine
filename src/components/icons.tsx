export function LogoIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden>
      <circle cx="14" cy="14" r="12" stroke="#10B981" strokeWidth="1.6" />
      <circle cx="14" cy="14" r="6" stroke="#10B981" strokeWidth="1.4" />
      <circle cx="14" cy="7" r="3.2" fill="#10B981" opacity={0.9} />
      <circle cx="20" cy="18" r="2.8" fill="#10B981" opacity={0.55} />
      <path d="M8.5 11.5 L14 14 L18 20" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
export function NewChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3.5H10L13 6.5V12.5H3V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 3.5V6.5H13" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 9H11M8 6v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8.5" y="0.5" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="0.5" y="8.5" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8.5" y="8.5" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}
export function FocusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 2V3.2M7 10.8V12M2 7H3.2M10.8 7H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}
export function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 12.5H12.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
export function ThumbUpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M3 7H4.5L6.5 3.5V7H12L10.5 12H3V7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="2" y="7" width="1.2" height="5" rx="0.3" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
export function ThumbDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M3 8H4.5L6.5 11.5V8H12L10.5 3H3V8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="2" y="3" width="1.2" height="5" rx="0.3" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
export function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M7.5 3V10M7.5 10L4.5 7M7.5 10L10.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 11.5V12.5H12.5V11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 5V2H5M9 2H12V5M12 9V12H9M5 12H2V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
export function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
export function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 7L12 2L9 7L12 12L2 7Z" fill="currentColor" />
    </svg>
  );
}
export function CrownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 10L4 4L7 7L10 4L12 10H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M2.5 11H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1L7.8 4.2L11 5L7.8 5.8L7 9L6.2 5.8L3 5L6.2 4.2L7 1Z" fill="currentColor" />
      <path d="M11.5 7L12 8.5L13.5 9L12 9.5L11.5 11L11 9.5L9.5 9L11 8.5L11.5 7Z" fill="currentColor" opacity={0.6} />
    </svg>
  );
}
export function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="6" y="2.5" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 6.5C4 8.9 5.9 10.8 8 10.8C10.1 10.8 12 8.9 12 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 10.8V13.5M5.5 13.5H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.8" cy="6.2" r="1.3" fill="currentColor" />
      <path d="M2.5 11.5L6 8.5L8.5 10.5L11 8L13.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
export function ExpertsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.8 13.5C3.4 11.2 5.5 9.8 8 9.8C10.5 9.8 12.6 11.2 13.2 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
export function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 4C2 3.3 2.6 2.8 3.2 2.8H6.4L8 4.5H12.8C13.5 4.5 14 5 14 5.7V12C14 12.7 13.5 13.2 12.8 13.2H3.2C2.6 13.2 2 12.7 2 12V4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
export function PanelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 2.5V13.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 6.5L9 8L10.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function ChatBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 3.5C2 2.7 2.7 2 3.5 2H10.5C11.3 2 12 2.7 12 3.5V8.5C12 9.3 11.3 10 10.5 10H5.5L3 12.2V10H3.5C2.7 10 2 9.3 2 8.5V3.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
export function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
