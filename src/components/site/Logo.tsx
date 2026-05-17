import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-md"
        style={{ background: "#2D6A4F" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 14 L7 8 L11 12 L17 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17" cy="4" r="1.6" fill="#fff" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className="font-serif text-[20px] font-semibold"
          style={{ color: light ? "#fff" : "#1A2B3C" }}
        >
          ClarityPath
        </span>
        <span
          className="mt-0.5 text-[9px] font-semibold tracking-[0.15em]"
          style={{ color: "#2D6A4F" }}
        >
          IRELAND IMMIGRATION SUPPORT
        </span>
      </div>
    </Link>
  );
}
