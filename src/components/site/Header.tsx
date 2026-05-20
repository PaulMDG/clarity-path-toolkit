import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";

type ServiceLink = { title: string; slug: string };

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/resources", label: "Resources" },
  { to: "/faqs", label: "FAQs" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<ServiceLink[]>([]);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase
      .from("services")
      .select("title, slug")
      .eq("status", "published")
      .order("display_order")
      .then(({ data }) => setServices(data ?? []));
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow ${
          scrolled ? "shadow-sm" : ""
        }`}
      style={{ borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}
    >
      <div className="container-cp flex h-[72px] items-center justify-between">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium" style={{ color: "#1A2B3C" }}>
          {navLinks.slice(0, 2).map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-[#2D6A4F] transition-colors">
              {l.label}
            </Link>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <Link to="/services" className="flex items-center gap-1 hover:text-[#2D6A4F] transition-colors">
              Services <ChevronDown size={14} />
            </Link>
            {servicesOpen && services.length > 0 && (
              <div
                className="absolute left-1/2 top-full -translate-x-1/2 pt-3"
                style={{ minWidth: 260 }}
              >
                <div className="rounded-xl border bg-white p-2 shadow-lg" style={{ borderColor: "#E5E7EB" }}>
                  {services.map((s) => (
                    <Link
                      key={s.slug}
                      to="/services/$slug"
                      params={{ slug: s.slug }}
                      className="block rounded-md px-3 py-2 text-[14px] hover:bg-[#EAF3EE] hover:text-[#2D6A4F]"
                    >
                      {s.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {navLinks.slice(2).map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-[#2D6A4F] transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link to="/book-consultation" className="btn-primary">
            Book a Consultation →
          </Link>
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} color="#1A2B3C" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="container-cp flex h-[72px] items-center justify-between border-b" style={{ borderColor: "#E5E7EB" }}>
            <Logo />
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2">
              <X size={24} color="#1A2B3C" />
            </button>
          </div>
          <nav className="container-cp flex flex-col gap-1 py-6">
            {navLinks.slice(0, 2).map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-3 text-lg font-medium">
                {l.label}
              </Link>
            ))}
            <Link to="/services" onClick={() => setOpen(false)} className="py-3 text-lg font-medium">
              Services
            </Link>
            {navLinks.slice(2).map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-3 text-lg font-medium">
                {l.label}
              </Link>
            ))}
            <Link to="/book-consultation" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full justify-center">
              Book a Consultation →
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
