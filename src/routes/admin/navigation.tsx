import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card, Field, inputCls } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/navigation")({ component: Navigation });

type Item = {
  id: string;
  label: string;
  link_type: string;
  target_slug: string | null;
  custom_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
};

function Navigation() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-nav"],
    queryFn: async () => {
      const { data, error } = await supabase.from("navigation_items").select("*").order("display_order");
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
  const [draft, setDraft] = useState({
    label: "", link_type: "page", target_slug: "", custom_url: "", display_order: 0, is_active: true,
  });

  const add = async () => {
    if (!draft.label) return toast.error("Label is required");
    const payload = {
      label: draft.label,
      link_type: draft.link_type,
      target_slug: draft.target_slug || null,
      custom_url: draft.custom_url || null,
      display_order: draft.display_order,
      is_active: draft.is_active,
    };
    const { error } = await supabase.from("navigation_items").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Added");
      setDraft({ label: "", link_type: "page", target_slug: "", custom_url: "", display_order: 0, is_active: true });
      qc.invalidateQueries({ queryKey: ["admin-nav"] });
    }
  };

  const update = async (id: string, patch: Partial<Item>) => {
    const { error } = await supabase.from("navigation_items").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-nav"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete item?")) return;
    const { error } = await supabase.from("navigation_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-nav"] });
  };

  return (
    <div>
      <PageHeader title="Navigation" description="Header / footer menu items." />
      <Card className="mb-6 space-y-3">
        <h3 className="text-sm font-semibold">Add item</h3>
        <div className="grid gap-3 sm:grid-cols-6">
          <Field label="Label"><input className={inputCls} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Field>
          <Field label="Link type">
            <select className={inputCls} value={draft.link_type} onChange={(e) => setDraft({ ...draft, link_type: e.target.value })}>
              <option value="page">Page</option>
              <option value="service">Service</option>
              <option value="custom">Custom URL</option>
            </select>
          </Field>
          <Field label="Slug">
            <input className={inputCls} value={draft.target_slug} onChange={(e) => setDraft({ ...draft, target_slug: e.target.value })} />
          </Field>
          <Field label="Custom URL">
            <input className={inputCls} value={draft.custom_url} onChange={(e) => setDraft({ ...draft, custom_url: e.target.value })} />
          </Field>
          <Field label="Order">
            <input type="number" className={inputCls} value={draft.display_order} onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })} />
          </Field>
          <div className="flex items-end">
            <button type="button" onClick={add} className="btn-primary w-full justify-center !py-2 !text-sm">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Label</th><th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Slug</th><th className="px-3 py-3">URL</th>
              <th className="px-3 py-3">Order</th><th className="px-3 py-3">Active</th>
              <th className="px-3 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((n) => (
              <tr key={n.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <input className={inputCls} defaultValue={n.label}
                    onBlur={(e) => e.target.value !== n.label && update(n.id, { label: e.target.value })} />
                </td>
                <td className="px-3 py-2">
                  <select className={inputCls} defaultValue={n.link_type}
                    onChange={(e) => update(n.id, { link_type: e.target.value })}>
                    <option value="page">Page</option><option value="service">Service</option><option value="custom">Custom</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input className={inputCls} defaultValue={n.target_slug ?? ""}
                    onBlur={(e) => update(n.id, { target_slug: e.target.value || null })} />
                </td>
                <td className="px-3 py-2">
                  <input className={inputCls} defaultValue={n.custom_url ?? ""}
                    onBlur={(e) => update(n.id, { custom_url: e.target.value || null })} />
                </td>
                <td className="px-3 py-2 w-24">
                  <input type="number" className={inputCls} defaultValue={n.display_order ?? 0}
                    onBlur={(e) => update(n.id, { display_order: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" defaultChecked={!!n.is_active}
                    onChange={(e) => update(n.id, { is_active: e.target.checked })} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => del(n.id)} className="rounded p-1.5 text-destructive hover:bg-muted"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No items.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
