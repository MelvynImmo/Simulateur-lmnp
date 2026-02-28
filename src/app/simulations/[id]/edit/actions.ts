"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { computeSimulation, type SimulationInputs } from "@/lib/calculations";
import { parseSimulationFormData } from "@/lib/validation";

const buildResultsRow = (
  simulationId: string,
  results: ReturnType<typeof computeSimulation>,
  regime: SimulationInputs["regime"]
) => ({
  simulation_id: simulationId,
  regime,
  total_project_cost_cents: results.totalProjectCostCents,
  notary_fees_cents: results.notaryFeesCents,
  loan_amount_cents: results.loanAmountCents,
  monthly_payment_cents: results.monthlyPaymentCents,
  monthly_insurance_cents: results.monthlyInsuranceCents,
  monthly_payment_total_cents: results.monthlyPaymentTotalCents,
  annual_rent_gross_cents: results.annualRentGrossCents,
  annual_vacancy_cents: results.annualVacancyCents,
  annual_rent_net_cents: results.annualRentNetCents,
  annual_charges_cents: results.annualChargesCents,
  annual_cashflow_before_tax_cents: results.annualCashflowBeforeTaxCents,
  monthly_cashflow_before_tax_cents: results.monthlyCashflowBeforeTaxCents,
  monthly_savings_effort_cents: results.monthlySavingsEffortCents,
  tax_base_cents: results.taxBaseCents,
  tax_estimated_cents: results.taxEstimatedCents,
  interest_year1_cents: results.interestYear1Cents,
  amortization_annual_cents: results.amortizationAnnualCents,
  annual_cashflow_after_tax_cents: results.annualCashflowAfterTaxCents,
  monthly_cashflow_after_tax_cents: results.monthlyCashflowAfterTaxCents,
  gross_yield_bps: results.grossYieldBps,
  net_yield_bps: results.netYieldBps,
  verdict_explanation: results.verdictExplanation,
});

export async function updateSimulation(simulationId: string, formData: FormData) {
  const supabase = await createSupabaseServerActionClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth");
  }

  const inputs = parseSimulationFormData(formData);
  const microInputs: SimulationInputs = { ...inputs, regime: "micro", amortizationEnabled: false };
  const reelInputs: SimulationInputs = { ...inputs, regime: "reel" };
  const microResults = computeSimulation(microInputs);
  const reelResults = computeSimulation(reelInputs);

  const { error: simulationError } = await supabase
    .from("simulations")
    .update({ name: inputs.name })
    .eq("id", simulationId);

  if (simulationError) {
    throw new Error(simulationError.message);
  }

  const inputPayload = {
    simulation_id: simulationId,
    name: inputs.name,
    price_cents: inputs.priceCents,
    notary_fee_mode: inputs.notaryFeeMode,
    notary_fee_percent_bps: inputs.notaryFeePercentBps,
    notary_fee_cents: inputs.notaryFeeCents,
    works_cents: inputs.worksCents,
    furniture_cents: inputs.furnitureCents,
    down_payment_cents: inputs.downPaymentCents,
    loan_rate_bps: inputs.loanRateBps,
    loan_years: inputs.loanYears,
    insurance_mode: inputs.insuranceMode,
    insurance_rate_bps: inputs.insuranceRateBps,
    insurance_monthly_cents: inputs.insuranceMonthlyCents,
    rent_monthly_cents: inputs.rentMonthlyCents,
    vacancy_rate_bps: inputs.vacancyRateBps,
    recoverable_charges_monthly_cents: inputs.recoverableChargesMonthlyCents,
    non_recoverable_charges_monthly_cents: inputs.nonRecoverableChargesMonthlyCents,
    property_tax_cents: inputs.propertyTaxCents,
    pno_cents: inputs.pnoCents,
    management_fee_bps: inputs.managementFeeBps,
    tmi_bps: inputs.tmiBps,
    regime: inputs.regime,
    amortization_enabled: inputs.amortizationEnabled,
  };

  const { data: updatedInputs, error: inputsUpdateError } = await supabase
    .from("simulation_inputs")
    .update(inputPayload)
    .eq("simulation_id", simulationId)
    .select("simulation_id");

  if (inputsUpdateError) {
    throw new Error(inputsUpdateError.message);
  }

  if (!updatedInputs || updatedInputs.length === 0) {
    const { error: inputsUpsertError } = await supabase
      .from("simulation_inputs")
      .upsert(inputPayload, { onConflict: "simulation_id" });

    if (inputsUpsertError) {
      throw new Error(inputsUpsertError.message);
    }
  }

  const { error: resultsError } = await supabase.from("simulation_results").upsert(
    [
      buildResultsRow(simulationId, microResults, "micro"),
      buildResultsRow(simulationId, reelResults, "reel"),
    ],
    { onConflict: "simulation_id,regime" }
  );

  if (resultsError) {
    throw new Error(resultsError.message);
  }

  redirect(`/simulations/${simulationId}?regime=${inputs.regime}`);
}
