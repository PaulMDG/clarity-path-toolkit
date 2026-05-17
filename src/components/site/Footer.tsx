import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "./Logo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Footer() {
  const { data: settings } = useSiteSettings();
  return (
    <footer style={{ background: "#1A2B3C", color: "#fff" }}>
      <div className="container-cp grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-5 text-sm text-white/70 leading-relaxed">
            {settings?.footer_description ??
              "Structured immigration guidance for individuals and families in Ireland."}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80 font-sans">Explore</h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/services" className="hover:text-white">Services</Link></li>
            <li><Link to="/resources" className="hover:text-white">Resources</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link to="/faqs" className="hover:text-white">FAQs</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80 font-sans">Get in touch</h4>
          <ul className="space-y-3 text-sm text-white/70">
            {settings?.email && (
              <li className="flex items-center gap-2"><Mail size={14} /> {settings.email}</li>
            )}
            {settings?.phone && (
              <li className="flex items-center gap-2"><Phone size={14} /> {settings.phone}</li>
            )}
            {settings?.address && (
              <li className="flex items-center gap-2"><MapPin size={14} /> {settings.address}</li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80 font-sans">Legal</h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms-and-conditions" className="hover:text-white">Terms & Conditions</Link></li>
            <li><Link to="/admin" className="hover:text-white">Admin</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-cp py-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {settings?.business_name ?? "ClarityPath"}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
