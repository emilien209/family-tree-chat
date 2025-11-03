import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("text-primary", className)}
  >
    <path d="M12 2v7" />
    <path d="M12 15v7" />
    <path d="M12 9h.01" />
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H9" />
    <path d="M15 2h.5a3.5 3.5 0 0 1 3.5 3.5V7" />
    <path d="M5 18.5A3.5 3.5 0 0 0 8.5 22H9" />
    <path d="M15 22h.5a3.5 3.5 0 0 0 3.5-3.5V17" />
  </svg>
);
