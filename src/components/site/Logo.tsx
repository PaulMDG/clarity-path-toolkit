import { Link } from "@tanstack/react-router";
import clarityLogo from "@/assets/ClarityPath_logo.png";
import clarityLogoWhite from "@/assets/claritypath-logo-white.png";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center">
      <img
        src={light ? clarityLogoWhite : clarityLogo}
        alt="ClarityPath Ireland Immigration Support"
        className="h-12 md:h-14 w-auto object-contain"
      />
    </Link>
  );
}
