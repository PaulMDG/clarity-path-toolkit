import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Briefcase, FileText, BookOpen, FolderOpen,
  HelpCircle, Star, Calendar, Settings, Menu, LogOut, Inbox, Layers,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/services", label: "Services", icon: Briefcase },
  { to: "/admin/blog", label: "Blog Posts", icon: BookOpen },
  { to: "/admin/pages", label: "Pages", icon: FileText },
  { to: "/admin/resources", label: "Resources", icon: FolderOpen },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/testimonials", label: "Testimonials", icon: Star },
  { to: "/admin/consultation-types", label: "Consultation Types", icon: Calendar },
  { to: "/admin/bookings", label: "Bookings", icon: Inbox },
  { to: "/admin/contact", label: "Contact", icon: Inbox },
  { to: "/admin/navigation", label: "Navigation", icon: Layers },
  { to: "/admin/settings", label: "Site Settings", icon: Settings },
];

export function AdminShell() {
  const loc = useLocation();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted">
      {/* sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <span className="font-serif text-lg text-white">ClarityPath Admin</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-3 text-sm">
          {nav.map((n) => {
            const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                }`}
              >
                <n.icon size={16} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-sidebar-border p-3 text-xs">
          <div className="mb-2 truncate text-sidebar-foreground/70">{user?.email}</div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-sidebar-accent"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-white px-4 md:px-6">
          <button className="md:hidden" onClick={() => setOpen((o) => !o)}>
            <Menu size={20} />
          </button>
          <Link to="/" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            ← View site
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
