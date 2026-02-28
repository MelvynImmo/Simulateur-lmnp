"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { computeSimulation, type SimulationInputs } from "@/lib/calculations";

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

export async function duplicateSimulation(simulationId: string) {
  const supabase = await createSupabaseServerActionClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/auth");
  }

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .select("id, name")
    .eq("id", simulationId)
    .maybeSingle();

  if (simulationError || !simulation) {
    throw new Error(simulationError?.message ?? "Simulation introuvable.");
  }

  const { data: inputs, error: inputsError } = await supabase
    .from("simulation_inputs")
    .select("*")
    .eq("simulation_id", simulationId)
    .maybeSingle();

  if (inputsError || !inputs) {
    throw new Error(inputsError?.message ?? "Entr\u00e9es introuvables.");
  }

  const newName = `Copie - ${simulation.name}`;
  const baseInputs: SimulationInputs = {
    name: newName,
    priceCents: inputs.price_cents,
    notaryFeeMode: inputs.notary_fee_mode,
    notaryFeePercentBps: inputs.notary_fee_percent_bps,
    notaryFeeCents: inputs.notary_fee_cents,
    worksCents: inputs.works_cents,
    furnitureCents: inputs.furniture_cents,
    downPaymentCents: inputs.down_payment_cents,
    loanRateBps: inputs.loan_rate_bps,
    loanYears: inputs.loan_years,
    insuranceMode: inputs.insurance_mode,
    insuranceRateBps: inputs.insurance_rate_bps,
    insuranceMonthlyCents: inputs.insurance_monthly_cents,
    rentMonthlyCents: inputs.rent_monthly_cents,
    vacancyRateBps: inputs.vacancy_rate_bps,
    recoverableChargesMonthlyCents: inputs.recoverable_charges_monthly_cents,
    nonRecoverableChargesMonthlyCents: inputs.non_recoverable_charges_monthly_cents,
    propertyTaxCents: inputs.property_tax_cents,
    pnoCents: inputs.pno_cents,
    managementFeeBps: inputs.management_fee_bps,
    tmiBps: inputs.tmi_bps,
    regime: inputs.regime,
    amortizationEnabled: inputs.amortization_enabled,
  };

  const microInputs: SimulationInputs = { ...baseInputs, regime: "micro", amortizationEnabled: false };
  const reelInputs: SimulationInputs = { ...baseInputs, regime: "reel" };
  const microResults = computeSimulation(microInputs);
  const reelResults = computeSimulation(reelInputs);

  const { data: newSimulation, error: newSimulationError } = await supabase
    .from("simulations")
    .insert({
      user_id: authData.user.id,
      name: newName,
    })
    .select("id")
    .single();

  if (newSimulationError || !newSimulation) {
    throw new Error(newSimulationError?.message ?? "Impossible de dupliquer la simulation.");
  }

  const rollbackSimulation = async () => {
    await supabase.from("simulations").delete().eq("id", newSimulation.id);
  };

  const { error: inputError } = await supabase.from("simulation_inputs").insert({
    simulation_id: newSimulation.id,
    name: newName,
    price_cents: baseInputs.priceCents,
    notary_fee_mode: baseInputs.notaryFeeMode,
    notary_fee_percent_bps: baseInputs.notaryFeePercentBps,
    notary_fee_cents: baseInputs.notaryFeeCents,
    works_cents: baseInputs.worksCents,
    furniture_cents: baseInputs.furnitureCents,
    down_payment_cents: baseInputs.downPaymentCents,
    loan_rate_bps: baseInputs.loanRateBps,
    loan_years: baseInputs.loanYears,
    insurance_mode: baseInputs.insuranceMode,
    insurance_rate_bps: baseInputs.insuranceRateBps,
    insurance_monthly_cents: baseInputs.insuranceMonthlyCents,
    rent_monthly_cents: baseInputs.rentMonthlyCents,
    vacancy_rate_bps: baseInputs.vacancyRateBps,
    recoverable_charges_monthly_cents: baseInputs.recoverableChargesMonthlyCents,
    non_recoverable_charges_monthly_cents: baseInputs.nonRecoverableChargesMonthlyCents,
    property_tax_cents: baseInputs.propertyTaxCents,
    pno_cents: baseInputs.pnoCents,
    management_fee_bps: baseInputs.managementFeeBps,
    tmi_bps: baseInputs.tmiBps,
    regime: baseInputs.regime,
    amortization_enabled: baseInputs.amortizationEnabled,
  });

  if (inputError) {
    await rollbackSimulation();
    throw new Error(inputError.message);
  }

  const { error: resultError } = await supabase.from("simulation_results").insert([
    buildResultsRow(newSimulation.id, microResults, "micro"),
    buildResultsRow(newSimulation.id, reelResults, "reel"),
  ]);

  if (resultError) {
    await rollbackSimulation();
    throw new Error(resultError.message);
  }

  redirect(`/simulations/${newSimulation.id}?regime=${baseInputs.regime}`);
}
