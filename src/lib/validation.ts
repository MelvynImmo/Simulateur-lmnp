import { z } from "zod";
import type { SimulationInputs } from "@/lib/calculations";

const numberString = z
  .string()
  .trim()
  .min(1)
  .regex(/^[-+]?\d+([.,]\d+)?$/, "Nombre invalide");
const optionalNumberString = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^[-+]?\d+([.,]\d+)?$/.test(value), {
    message: "Nombre invalide",
  });

const schema = z
  .object({
    name: z.string().trim().min(2, "Nom requis"),
    price: numberString,
    notaryFeeMode: z.enum(["percent", "fixed"]),
    notaryFeePercent: optionalNumberString,
    notaryFeeFixed: optionalNumberString,
    works: numberString,
    furniture: numberString,
    downPayment: numberString,
    loanRate: numberString,
    loanYears: numberString,
    insuranceMode: z.enum(["percent", "fixed"]),
    insuranceRate: optionalNumberString,
    insuranceFixed: optionalNumberString,
    rentMonthly: numberString,
    vacancyRate: numberString,
    recoverableChargesMonthly: numberString,
    nonRecoverableChargesMonthly: numberString,
    propertyTax: numberString,
    pno: numberString,
    managementFee: numberString,
    tmi: numberString,
    regime: z.enum(["micro", "reel"]),
    amortizationEnabled: z.enum(["true", "false"]).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.notaryFeeMode === "percent") {
      if (!values.notaryFeePercent || values.notaryFeePercent.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notaryFeePercent"],
          message: "Frais de notaire requis.",
        });
      } else {
        const parsed = Number.parseFloat(values.notaryFeePercent.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 15) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["notaryFeePercent"],
            message: "Frais de notaire hors bornes.",
          });
        }
      }
    }

    if (values.notaryFeeMode === "fixed") {
      if (!values.notaryFeeFixed || values.notaryFeeFixed.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notaryFeeFixed"],
          message: "Frais de notaire requis.",
        });
      } else {
        const parsed = Number.parseFloat(values.notaryFeeFixed.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["notaryFeeFixed"],
            message: "Frais de notaire hors bornes.",
          });
        }
      }
    }

    if (values.insuranceMode === "percent") {
      if (!values.insuranceRate || values.insuranceRate.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["insuranceRate"],
          message: "Assurance requise.",
        });
      } else {
        const parsed = Number.parseFloat(values.insuranceRate.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["insuranceRate"],
            message: "Assurance hors bornes.",
          });
        }
      }
    }

    if (values.insuranceMode === "fixed") {
      if (!values.insuranceFixed || values.insuranceFixed.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["insuranceFixed"],
          message: "Assurance requise.",
        });
      } else {
        const parsed = Number.parseFloat(values.insuranceFixed.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["insuranceFixed"],
            message: "Assurance hors bornes.",
          });
        }
      }
    }
  });

const parseCurrencyToCents = (value: string) => {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
};

const parsePercentToBps = (value: string) => {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
};

const parseInteger = (value: string) => {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed);
};

const assertNonNegative = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Valeur invalide pour ${label}.`);
  }
};

const assertInRange = (value: number, min: number, max: number, label: string) => {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Valeur hors bornes pour ${label}.`);
  }
};

export function parseSimulationFormData(formData: FormData): SimulationInputs {
  const fd = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");

  const raw = schema.parse({
    name: fd(formData.get("name")),
    price: fd(formData.get("price")),
    notaryFeeMode: fd(formData.get("notaryFeeMode")),
    notaryFeePercent: fd(formData.get("notaryFeePercent")),
    notaryFeeFixed: fd(formData.get("notaryFeeFixed")),
    works: fd(formData.get("works")),
    furniture: fd(formData.get("furniture")),
    downPayment: fd(formData.get("downPayment")),
    loanRate: fd(formData.get("loanRate")),
    loanYears: fd(formData.get("loanYears")),
    insuranceMode: fd(formData.get("insuranceMode")),
    insuranceRate: fd(formData.get("insuranceRate")),
    insuranceFixed: fd(formData.get("insuranceFixed")),
    rentMonthly: fd(formData.get("rentMonthly")),
    vacancyRate: fd(formData.get("vacancyRate")),
    recoverableChargesMonthly: fd(formData.get("recoverableChargesMonthly")),
    nonRecoverableChargesMonthly: fd(formData.get("nonRecoverableChargesMonthly")),
    propertyTax: fd(formData.get("propertyTax")),
    pno: fd(formData.get("pno")),
    managementFee: fd(formData.get("managementFee")),
    tmi: fd(formData.get("tmi")),
    regime: fd(formData.get("regime")),
    amortizationEnabled: fd(formData.get("amortizationEnabled")) || "false",
  });

  const parsed: SimulationInputs = {
    name: raw.name,
    priceCents: parseCurrencyToCents(raw.price),
    notaryFeeMode: raw.notaryFeeMode,
    notaryFeePercentBps: raw.notaryFeeMode === "percent" ? parsePercentToBps(raw.notaryFeePercent!) : null,
    notaryFeeCents: raw.notaryFeeMode === "fixed" ? parseCurrencyToCents(raw.notaryFeeFixed!) : null,
    worksCents: parseCurrencyToCents(raw.works),
    furnitureCents: parseCurrencyToCents(raw.furniture),
    downPaymentCents: parseCurrencyToCents(raw.downPayment),
    loanRateBps: parsePercentToBps(raw.loanRate),
    loanYears: parseInteger(raw.loanYears),
    insuranceMode: raw.insuranceMode,
    insuranceRateBps: raw.insuranceMode === "percent" ? parsePercentToBps(raw.insuranceRate!) : null,
    insuranceMonthlyCents: raw.insuranceMode === "fixed" ? parseCurrencyToCents(raw.insuranceFixed!) : null,
    rentMonthlyCents: parseCurrencyToCents(raw.rentMonthly),
    vacancyRateBps: parsePercentToBps(raw.vacancyRate),
    recoverableChargesMonthlyCents: parseCurrencyToCents(raw.recoverableChargesMonthly),
    nonRecoverableChargesMonthlyCents: parseCurrencyToCents(raw.nonRecoverableChargesMonthly),
    propertyTaxCents: parseCurrencyToCents(raw.propertyTax),
    pnoCents: parseCurrencyToCents(raw.pno),
    managementFeeBps: parsePercentToBps(raw.managementFee),
    tmiBps: parsePercentToBps(raw.tmi),
    regime: raw.regime,
    amortizationEnabled: raw.amortizationEnabled === "true",
  };

  if (parsed.notaryFeeMode === "percent") {
    parsed.notaryFeeCents = null;
  } else {
    parsed.notaryFeePercentBps = null;
  }

  if (parsed.insuranceMode === "percent") {
    parsed.insuranceMonthlyCents = null;
  } else {
    parsed.insuranceRateBps = null;
  }

  assertNonNegative(parsed.priceCents, "prix");
  assertNonNegative(parsed.worksCents, "travaux");
  assertNonNegative(parsed.furnitureCents, "mobilier");
  assertNonNegative(parsed.downPaymentCents, "apport");
  assertInRange(parsed.loanRateBps, 0, 1500, "taux");
  assertInRange(parsed.loanYears, 5, 30, "durée");
  assertNonNegative(parsed.rentMonthlyCents, "loyer");
  assertInRange(parsed.vacancyRateBps, 0, 5000, "vacance");
  assertNonNegative(parsed.nonRecoverableChargesMonthlyCents, "charges non récupérables");
  assertNonNegative(parsed.propertyTaxCents, "taxe foncière");
  assertNonNegative(parsed.pnoCents, "PNO");
  assertInRange(parsed.managementFeeBps, 0, 1500, "gestion locative");
  assertInRange(parsed.tmiBps, 0, 4500, "TMI");
  if (parsed.notaryFeePercentBps !== null) assertInRange(parsed.notaryFeePercentBps, 0, 1500, "frais de notaire");
  if (parsed.notaryFeeCents !== null) assertNonNegative(parsed.notaryFeeCents, "frais de notaire");
  if (parsed.insuranceRateBps !== null) assertInRange(parsed.insuranceRateBps, 0, 200, "assurance");
  if (parsed.insuranceMonthlyCents !== null) assertNonNegative(parsed.insuranceMonthlyCents, "assurance");

  return parsed;
}

export const simulationFormSchema = schema;
