import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HomepageContent = {
  hero?: {
    eyebrow?: string;
    headline_pre?: string;
    headline_accent?: string;
    headline_post?: string;
    subheading?: string;
    primary_cta?: string;
    secondary_cta?: string;
    trust_indicators?: { icon: string; label: string }[];
  };
  process_steps?: { icon: string; number: string; title: string; description: string }[];
  about?: { eyebrow?: string; heading?: string; p1?: string; p2?: string; cta?: string };
  cta_band?: { heading?: string; subtext?: string; button?: string };
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as (typeof data & { homepage_content: HomepageContent }) | null;
    },
  });
}
