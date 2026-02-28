import { describe, expect, it } from "vitest";
import {
  calcMonthlyPaymentCents,
  calcMonthlyInsuranceCents,
  calcNotaryFeesCents,
  computeSimulation,
  type SimulationInputs,
} from "@/lib/calculations";

const baseInputs: SimulationInputs = {
  name: "Test",
  priceCents: 10_000_00,
  notaryFeeMode: "percent",
  notaryFeePercentBps: 800,
  notaryFeeCents: null,
  worksCents: 0,
  furnitureCents: 0,
  downPaymentCents: 0,
  loanRateBps: 400,
  loanYears: 20,
  insuranceMode: "percent",
  insuranceRateBps: 30,
  insuranceMonthlyCents: null,
  rentMonthlyCents: 100_00,
  vacancyRateBps: 0,
  recoverableChargesMonthlyCents: 0,
  nonRecoverableChargesMonthlyCents: 0,
  propertyTaxCents: 0,
  pnoCents: 0,
  managementFeeBps: 0,
  tmiBps: 3000,
  regime: "micro",
  amortizationEnabled: false,
};

describe("calculations", () => {
  it("taux = 0 => mensualite = capital / mois", () => {
    const mensualite = calcMonthlyPaymentCents(1_200_00, 0, 1);
    expect(mensualite).toBe(100_00);
  });

  it("emprunt = 0 => mensualite 0", () => {
    const mensualite = calcMonthlyPaymentCents(0, 400, 20);
    expect(mensualite).toBe(0);
  });

  it("vacance = 0 => loyers nets = loyers bruts", () => {
    const results = computeSimulation({ ...baseInputs, rentMonthlyCents: 200_00, vacancyRateBps: 0 });
    expect(results.annualRentNetCents).toBe(results.annualRentGrossCents);
  });

  it("vacance = 50% => loyers nets = 50% bruts", () => {
    const results = computeSimulation({ ...baseInputs, rentMonthlyCents: 200_00, vacancyRateBps: 5000 });
    expect(results.annualRentNetCents).toBe(Math.round(results.annualRentGrossCents * 0.5));
  });

  it("notary percent vs fixed", () => {
    const percent = calcNotaryFeesCents(10_000_00, "percent", 800, null);
    const fixed = calcNotaryFeesCents(10_000_00, "fixed", null, 70_00);
    expect(percent).toBe(80_00);
    expect(fixed).toBe(70_00);
  });

  it("insurance percent vs fixed", () => {
    const percent = calcMonthlyInsuranceCents(120_000_00, "percent", 30, null);
    const fixed = calcMonthlyInsuranceCents(120_000_00, "fixed", null, 50_00);
    expect(percent).toBe(Math.round(120_000_00 * 0.003 / 12));
    expect(fixed).toBe(50_00);
  });

  it("micro => tax = 50% loyers nets * TMI", () => {
    const results = computeSimulation({
      ...baseInputs,
      rentMonthlyCents: 100_00,
      vacancyRateBps: 0,
      regime: "micro",
      tmiBps: 3000,
    });
    const expectedTaxBase = Math.round(results.annualRentNetCents * 0.5);
    const expectedTax = Math.round(expectedTaxBase * 0.3);
    expect(results.taxBaseCents).toBe(expectedTaxBase);
    expect(results.taxEstimatedCents).toBe(expectedTax);
  });

  it("reel avec amort ON => resultat fiscal reduit", () => {
    const resultsNoAmort = computeSimulation({
      ...baseInputs,
      worksCents: 1_000_00,
      furnitureCents: 1_000_00,
      regime: "reel",
      amortizationEnabled: false,
    });
    const resultsAmort = computeSimulation({
      ...baseInputs,
      worksCents: 1_000_00,
      furnitureCents: 1_000_00,
      regime: "reel",
      amortizationEnabled: true,
    });
    expect(resultsAmort.amortizationAnnualCents).toBeGreaterThan(0);
    expect(resultsAmort.taxBaseCents).toBeLessThanOrEqual(resultsNoAmort.taxBaseCents);
  });

  it("reel peut annuler l'impot si resultat fiscal negatif", () => {
    const results = computeSimulation({
      ...baseInputs,
      rentMonthlyCents: 50_00,
      nonRecoverableChargesMonthlyCents: 50_00,
      regime: "reel",
      amortizationEnabled: true,
    });
    expect(results.taxEstimatedCents).toBe(0);
  });

  it("mensualite totale = credit + assurance", () => {
    const results = computeSimulation({ ...baseInputs, loanRateBps: 400, insuranceRateBps: 30 });
    expect(results.monthlyPaymentTotalCents).toBe(
      results.monthlyPaymentCents + results.monthlyInsuranceCents
    );
  });
});
