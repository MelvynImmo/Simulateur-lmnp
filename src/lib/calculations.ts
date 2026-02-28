export type NotaryFeeMode = "percent" | "fixed";
export type InsuranceMode = "percent" | "fixed";
export type TaxRegime = "micro" | "reel";

export type SimulationInputs = {
  name: string;
  priceCents: number;
  notaryFeeMode: NotaryFeeMode;
  notaryFeePercentBps: number | null;
  notaryFeeCents: number | null;
  worksCents: number;
  furnitureCents: number;
  downPaymentCents: number;
  loanRateBps: number;
  loanYears: number;
  insuranceMode: InsuranceMode;
  insuranceRateBps: number | null;
  insuranceMonthlyCents: number | null;
  rentMonthlyCents: number;
  vacancyRateBps: number;
  recoverableChargesMonthlyCents: number;
  nonRecoverableChargesMonthlyCents: number;
  propertyTaxCents: number;
  pnoCents: number;
  managementFeeBps: number;
  tmiBps: number;
  regime: TaxRegime;
  amortizationEnabled: boolean;
};

export type SimulationResults = {
  totalProjectCostCents: number;
  notaryFeesCents: number;
  loanAmountCents: number;
  monthlyPaymentCents: number;
  monthlyInsuranceCents: number;
  monthlyPaymentTotalCents: number;
  annualRentGrossCents: number;
  annualVacancyCents: number;
  annualRentNetCents: number;
  annualChargesCents: number;
  annualCashflowBeforeTaxCents: number;
  monthlyCashflowBeforeTaxCents: number;
  monthlySavingsEffortCents: number;
  taxBaseCents: number;
  taxEstimatedCents: number;
  interestYear1Cents: number;
  amortizationAnnualCents: number;
  annualCashflowAfterTaxCents: number;
  monthlyCashflowAfterTaxCents: number;
  grossYieldBps: number;
  netYieldBps: number;
  verdictExplanation: string;
};

const bpsToDecimal = (bps: number) => bps / 10_000;

export function calcNotaryFeesCents(
  priceCents: number,
  mode: NotaryFeeMode,
  percentBps: number | null,
  fixedCents: number | null
) {
  if (mode === "percent" && percentBps !== null) {
    return Math.round(priceCents * bpsToDecimal(percentBps));
  }
  return fixedCents ?? 0;
}

export function calcTotalProjectCostCents(inputs: SimulationInputs, notaryFeesCents: number) {
  return inputs.priceCents + notaryFeesCents + inputs.worksCents + inputs.furnitureCents;
}

export function calcLoanAmountCents(totalProjectCostCents: number, downPaymentCents: number) {
  return Math.max(0, totalProjectCostCents - downPaymentCents);
}

export function calcMonthlyPaymentCents(loanAmountCents: number, loanRateBps: number, loanYears: number) {
  const months = loanYears * 12;
  if (months <= 0 || loanAmountCents <= 0) return 0;
  const monthlyRate = bpsToDecimal(loanRateBps) / 12;
  if (monthlyRate === 0) {
    return Math.round(loanAmountCents / months);
  }
  const numerator = loanAmountCents * monthlyRate;
  const denominator = 1 - Math.pow(1 + monthlyRate, -months);
  return Math.round(numerator / denominator);
}

export function calcMonthlyInsuranceCents(
  loanAmountCents: number,
  mode: InsuranceMode,
  rateBps: number | null,
  fixedMonthlyCents: number | null
) {
  if (mode === "percent" && rateBps !== null) {
    return Math.round(loanAmountCents * bpsToDecimal(rateBps) / 12);
  }
  return fixedMonthlyCents ?? 0;
}

export function buildAmortizationSchedule(
  loanAmountCents: number,
  loanRateBps: number,
  loanYears: number
) {
  const months = loanYears * 12;
  const monthlyRate = bpsToDecimal(loanRateBps) / 12;
  const monthlyPayment = calcMonthlyPaymentCents(loanAmountCents, loanRateBps, loanYears);
  const schedule: { month: number; interestCents: number; principalCents: number; balanceCents: number }[] = [];
  let balance = loanAmountCents;

  for (let month = 1; month <= months; month += 1) {
    const interest = Math.round(balance * monthlyRate);
    const principal = Math.min(balance, Math.max(0, monthlyPayment - interest));
    balance = Math.max(0, balance - principal);
    schedule.push({ month, interestCents: interest, principalCents: principal, balanceCents: balance });
    if (balance === 0) break;
  }

  return schedule;
}

export function calcInterestYear1Cents(loanAmountCents: number, loanRateBps: number, loanYears: number) {
  if (loanAmountCents <= 0 || loanYears <= 0) return 0;
  const schedule = buildAmortizationSchedule(loanAmountCents, loanRateBps, loanYears);
  return schedule.slice(0, 12).reduce((sum, row) => sum + row.interestCents, 0);
}

export function calcAnnualRentNetCents(rentMonthlyCents: number, vacancyRateBps: number) {
  const annualGross = rentMonthlyCents * 12;
  const vacancy = Math.round(annualGross * bpsToDecimal(vacancyRateBps));
  return { annualGross, vacancy, annualNet: annualGross - vacancy };
}

export function calcAnnualChargesCents(
  nonRecoverableChargesMonthlyCents: number,
  propertyTaxCents: number,
  pnoCents: number,
  managementFeeBps: number,
  annualRentNetCents: number
) {
  const managementFees = Math.round(annualRentNetCents * bpsToDecimal(managementFeeBps));
  return nonRecoverableChargesMonthlyCents * 12 + propertyTaxCents + pnoCents + managementFees;
}

export function calcAmortizationAnnualCents(inputs: SimulationInputs) {
  if (!inputs.amortizationEnabled) return 0;
  const furniture = Math.round(inputs.furnitureCents / 5);
  const works = Math.round(inputs.worksCents / 10);
  const buildingBase = Math.round(inputs.priceCents * 0.85);
  const building = Math.round(buildingBase / 30);
  return furniture + works + building;
}

export function computeSimulation(inputs: SimulationInputs): SimulationResults {
  const notaryFeesCents = calcNotaryFeesCents(
    inputs.priceCents,
    inputs.notaryFeeMode,
    inputs.notaryFeePercentBps,
    inputs.notaryFeeCents
  );
  const totalProjectCostCents = calcTotalProjectCostCents(inputs, notaryFeesCents);
  const loanAmountCents = calcLoanAmountCents(totalProjectCostCents, inputs.downPaymentCents);
  const monthlyPaymentCents = calcMonthlyPaymentCents(loanAmountCents, inputs.loanRateBps, inputs.loanYears);
  const monthlyInsuranceCents = calcMonthlyInsuranceCents(
    loanAmountCents,
    inputs.insuranceMode,
    inputs.insuranceRateBps,
    inputs.insuranceMonthlyCents
  );
  const monthlyPaymentTotalCents = monthlyPaymentCents + monthlyInsuranceCents;

  const { annualGross, vacancy, annualNet } = calcAnnualRentNetCents(
    inputs.rentMonthlyCents,
    inputs.vacancyRateBps
  );
  const annualChargesCents = calcAnnualChargesCents(
    inputs.nonRecoverableChargesMonthlyCents,
    inputs.propertyTaxCents,
    inputs.pnoCents,
    inputs.managementFeeBps,
    annualNet
  );

  const annualCashflowBeforeTaxCents = annualNet - annualChargesCents - monthlyPaymentTotalCents * 12;
  const monthlyCashflowBeforeTaxCents = Math.round(annualCashflowBeforeTaxCents / 12);
  const monthlySavingsEffortCents = Math.max(0, -monthlyCashflowBeforeTaxCents);

  let taxBaseCents = 0;
  let taxEstimatedCents = 0;
  const interestYear1Cents = calcInterestYear1Cents(loanAmountCents, inputs.loanRateBps, inputs.loanYears);
  const amortizationAnnualCents = calcAmortizationAnnualCents(inputs);

  if (inputs.regime === "micro") {
    taxBaseCents = Math.round(annualNet * 0.5);
    taxEstimatedCents = Math.round(taxBaseCents * bpsToDecimal(inputs.tmiBps));
  } else {
    const resultFiscal = annualNet - annualChargesCents - interestYear1Cents - amortizationAnnualCents;
    taxBaseCents = Math.max(0, resultFiscal);
    taxEstimatedCents = Math.round(taxBaseCents * bpsToDecimal(inputs.tmiBps));
  }

  const annualCashflowAfterTaxCents = annualCashflowBeforeTaxCents - taxEstimatedCents;
  const monthlyCashflowAfterTaxCents = Math.round(annualCashflowAfterTaxCents / 12);
  const grossYieldBps =
    totalProjectCostCents > 0 ? Math.round((annualGross / totalProjectCostCents) * 10_000) : 0;
  const netYieldBps =
    totalProjectCostCents > 0
      ? Math.round(((annualNet - annualChargesCents) / totalProjectCostCents) * 10_000)
      : 0;
  let verdictExplanation = "Cash-flow negatif.";
  if (monthlyCashflowAfterTaxCents >= 0) {
    verdictExplanation = "Cash-flow positif.";
  } else if (monthlyCashflowAfterTaxCents >= -10_000) {
    verdictExplanation = "Cash-flow proche de l'equilibre.";
  }

  return {
    totalProjectCostCents,
    notaryFeesCents,
    loanAmountCents,
    monthlyPaymentCents,
    monthlyInsuranceCents,
    monthlyPaymentTotalCents,
    annualRentGrossCents: annualGross,
    annualVacancyCents: vacancy,
    annualRentNetCents: annualNet,
    annualChargesCents,
    annualCashflowBeforeTaxCents,
    monthlyCashflowBeforeTaxCents,
    monthlySavingsEffortCents,
    taxBaseCents,
    taxEstimatedCents,
    interestYear1Cents,
    amortizationAnnualCents,
    annualCashflowAfterTaxCents,
    monthlyCashflowAfterTaxCents,
    grossYieldBps,
    netYieldBps,
    verdictExplanation,
  };
}
