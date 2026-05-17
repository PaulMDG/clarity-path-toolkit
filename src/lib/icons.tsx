import {
  Lock, ClipboardList, Globe, MessageCircle, Calendar, Search, FileCheck,
  ArrowRight, Compass, BadgeCheck, BookOpen, FolderOpen, Shield, Users,
  HelpCircle, FileText, Download, ExternalLink, Star, Mail, Phone, MapPin,
} from "lucide-react";

export const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  Lock, ClipboardList, Globe, MessageCircle, Calendar, Search, FileCheck,
  ArrowRight, Compass, BadgeCheck, BookOpen, FolderOpen, Shield, Users,
  HelpCircle, FileText, Download, ExternalLink, Star, Mail, Phone, MapPin,
};

export function Icon({ name, size = 18, className, color }: { name?: string; size?: number; className?: string; color?: string }) {
  if (!name) return null;
  const Cmp = iconMap[name] ?? HelpCircle;
  return <Cmp size={size} className={className} color={color} />;
}
