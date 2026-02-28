import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import SimulationsListClient from "@/components/SimulationsListClient";
import { deleteSimulation } from "@/app/simulations/actions";

type SimulationRow = {
  id: string;
  name: string;
  created_at: string;
  simulation_inputs: { regime: "micro" | "reel" }[] | null;
  simulation_results: {
    regime: "micro" | "reel";
    monthly_cashflow_after_tax_cents: number;
    gross_yield_bps: number;
    net_yield_bps: number;
    verdict_explanation: string;
  }[] | null;
};

type SimulationListItem = {
  id: string;
  name: string;
  createdAt: string;
  regime: "micro" | "reel";
  monthlyCashflowAfterTaxCents: number | null;
  grossYieldBps: number | null;
  netYieldBps: number | null;
  verdictExplanation: string | null;
  verdictBadge: "good" | "medium" | "bad" | null;
  resultsAvailable: boolean;
};

const computeVerdictBadge = (
  cashflowCents: number | null | undefined
): "good" | "medium" | "bad" | null => {
  if (typeof cashflowCents !== "number" || Number.isNaN(cashflowCents)) {
    return null;
  }
  if (cashflowCents >= 0) {
    return "good";
  }
  if (cashflowCents >= -10_000) {
    return "medium";
  }
  return "bad";
};

export default async function SimulationsPage() {
  const supabase = await createSupabaseServerComponentClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/auth");
  }

  const { data, error } = await supabase
    .from("simulations")
    .select(
      "id, name, created_at, simulation_inputs(regime), simulation_results(regime, monthly_cashflow_after_tax_cents, gross_yield_bps, net_yield_bps, verdict_explanation)"
    )
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items: SimulationListItem[] =
    (data as SimulationRow[] | null)?.map((simulation) => {
      const input = simulation.simulation_inputs?.[0];
      const regime = input?.regime ?? "micro";
      const result = simulation.simulation_results?.find((row) => row.regime === regime) ?? null;
      const monthlyCashflowAfterTaxCents = result?.monthly_cashflow_after_tax_cents ?? null;

      return {
        id: simulation.id,
        name: simulation.name,
        createdAt: simulation.created_at,
        regime,
        monthlyCashflowAfterTaxCents,
        grossYieldBps: result?.gross_yield_bps ?? null,
        netYieldBps: result?.net_yield_bps ?? null,
        verdictExplanation: result?.verdict_explanation ?? null,
        verdictBadge: computeVerdictBadge(monthlyCashflowAfterTaxCents),
        resultsAvailable: Boolean(result),
      };
    }) ?? [];

  return (
    <SimulationsListClient items={items} deleteAction={deleteSimulation} />
  );
}
