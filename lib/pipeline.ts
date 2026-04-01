import { getServerSupabase } from "./supabase";

export interface Lead {
  id: string;
  company: string;
  contact_name: string;
  contact_email: string | null;
  value: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
  expected_close: string | null;
  notes: string | null;
  created_at: string;
}

export interface PipelineData {
  leads: Lead[];
  stats: {
    total: number;
    totalValue: number;
    activeDeals: number;
  };
}

const ACTIVE_STAGES = ["lead", "qualified", "proposal", "negotiation"];

export async function getPipeline(): Promise<PipelineData> {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .in("stage", ACTIVE_STAGES)
    .order("expected_close", { ascending: true, nullsFirst: false })
    .order("value", { ascending: false });

  if (error) throw new Error(error.message);

  const leads = (data || []) as Lead[];
  const totalValue = leads.reduce((sum, l) => sum + Number(l.value), 0);

  return {
    leads,
    stats: {
      total: leads.length,
      totalValue,
      activeDeals: leads.length,
    },
  };
}

export async function updateLeadStage(leadId: string, stage: string): Promise<PipelineData> {
  const supabase = getServerSupabase();

  const { error } = await supabase
    .from("leads")
    .update({ stage })
    .eq("id", leadId);

  if (error) throw new Error(error.message);
  return getPipeline();
}
