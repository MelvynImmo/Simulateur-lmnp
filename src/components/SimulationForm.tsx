"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { computeSimulation, type SimulationInputs, type SimulationResults } from "@/lib/calculations";
import { formatEuroFromCents, formatPercentFromBps } from "@/lib/format";

export type SimulationFormValues = {
  name?: string;
  price?: string;
  notaryFeeMode?: "percent" | "fixed";
  notaryFeePercent?: string;
  notaryFeeFixed?: string;
  works?: string;
  furniture?: string;
  downPayment?: string;
  loanRate?: string;
  loanYears?: string;
  insuranceMode?: "percent" | "fixed";
  insuranceRate?: string;
  insuranceFixed?: string;
  rentMonthly?: string;
  vacancyRate?: string;
  recoverableChargesMonthly?: string;
  nonRecoverableChargesMonthly?: string;
  propertyTax?: string;
  pno?: string;
  managementFee?: string;
  tmi?: string;
  regime?: "micro" | "reel";
  amortizationEnabled?: boolean;
};

type SimulationFormProps = {
  mode: "create" | "edit";
  initialValues?: SimulationFormValues;
  action: (formData: FormData) => Promise<void>;
  cancelHref?: string;
};

const defaults: Required<Omit<SimulationFormValues, "amortizationEnabled">> & {
  amortizationEnabled: boolean;
} = {
  name: "Studio Lyon",
  price: "150000",
  notaryFeeMode: "percent",
  notaryFeePercent: "8",
  notaryFeeFixed: "12000",
  works: "10000",
  furniture: "3000",
  downPayment: "20000",
  loanRate: "4",
  loanYears: "25",
  insuranceMode: "percent",
  insuranceRate: "0.30",
  insuranceFixed: "30",
  rentMonthly: "850",
  vacancyRate: "5",
  recoverableChargesMonthly: "0",
  nonRecoverableChargesMonthly: "80",
  propertyTax: "900",
  pno: "120",
  managementFee: "0",
  tmi: "30",
  regime: "micro",
  amortizationEnabled: false,
};

const getValue = (value: string | undefined, fallback: string) => (value !== undefined ? value : fallback);

function HelpTip({ text, label }: { text: string; label: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`Aide: ${label}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        i
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-[260px] -translate-x-1/2 rounded-lg bg-slate-900 p-2 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

export default function SimulationForm({ mode, initialValues, action, cancelHref }: SimulationFormProps) {
  const initialRegime = initialValues?.regime ?? defaults.regime;
  const [notaryFeeMode, setNotaryFeeMode] = useState<"percent" | "fixed">(
    initialValues?.notaryFeeMode ?? defaults.notaryFeeMode
  );
  const [insuranceMode, setInsuranceMode] = useState<"percent" | "fixed">(
    initialValues?.insuranceMode ?? defaults.insuranceMode
  );
  const [regime, setRegime] = useState<"micro" | "reel">(initialRegime);
  const [amortizationEnabled, setAmortizationEnabled] = useState<boolean>(
    initialRegime === "micro" ? false : Boolean(initialValues?.amortizationEnabled ?? defaults.amortizationEnabled)
  );
  const [preview, setPreview] = useState<SimulationResults | null>(null);
  const [previewRegime, setPreviewRegime] = useState<"micro" | "reel">(initialRegime);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewInputs, setPreviewInputs] = useState<SimulationInputs | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [animatedCashflowCents, setAnimatedCashflowCents] = useState<number | null>(null);
  const [cashflowFlash, setCashflowFlash] = useState<"up" | "down" | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const notaryFeePercentRef = useRef<HTMLInputElement | null>(null);
  const notaryFeeFixedRef = useRef<HTMLInputElement | null>(null);
  const insuranceRateRef = useRef<HTMLInputElement | null>(null);
  const insuranceFixedRef = useRef<HTMLInputElement | null>(null);
  const previousCashflowRef = useRef<number | null>(null);
  const didMountRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);

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

  const buildInputsFromForm = (form: HTMLFormElement): SimulationInputs => {
    const data = new FormData(form);
    const fd = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");
    const rawNotaryFeeMode = fd(data.get("notaryFeeMode"));
    const rawInsuranceMode = fd(data.get("insuranceMode"));
    const notaryMode = rawNotaryFeeMode === "fixed" ? "fixed" : "percent";
    const insuranceModeValue = rawInsuranceMode === "fixed" ? "fixed" : "percent";

    return {
      name: fd(data.get("name")),
      priceCents: parseCurrencyToCents(fd(data.get("price"))),
      notaryFeeMode: notaryMode,
      notaryFeePercentBps: notaryMode === "percent" ? parsePercentToBps(fd(data.get("notaryFeePercent"))) : null,
      notaryFeeCents: notaryMode === "fixed" ? parseCurrencyToCents(fd(data.get("notaryFeeFixed"))) : null,
      worksCents: parseCurrencyToCents(fd(data.get("works"))),
      furnitureCents: parseCurrencyToCents(fd(data.get("furniture"))),
      downPaymentCents: parseCurrencyToCents(fd(data.get("downPayment"))),
      loanRateBps: parsePercentToBps(fd(data.get("loanRate"))),
      loanYears: parseInteger(fd(data.get("loanYears"))),
      insuranceMode: insuranceModeValue,
      insuranceRateBps:
        insuranceModeValue === "percent" ? parsePercentToBps(fd(data.get("insuranceRate"))) : null,
      insuranceMonthlyCents:
        insuranceModeValue === "fixed" ? parseCurrencyToCents(fd(data.get("insuranceFixed"))) : null,
      rentMonthlyCents: parseCurrencyToCents(fd(data.get("rentMonthly"))),
      vacancyRateBps: parsePercentToBps(fd(data.get("vacancyRate"))),
      recoverableChargesMonthlyCents: parseCurrencyToCents(fd(data.get("recoverableChargesMonthly"))),
      nonRecoverableChargesMonthlyCents: parseCurrencyToCents(fd(data.get("nonRecoverableChargesMonthly"))),
      propertyTaxCents: parseCurrencyToCents(fd(data.get("propertyTax"))),
      pnoCents: parseCurrencyToCents(fd(data.get("pno"))),
      managementFeeBps: parsePercentToBps(fd(data.get("managementFee"))),
      tmiBps: parsePercentToBps(fd(data.get("tmi"))),
      regime,
      amortizationEnabled,
    };
  };

  const updatePreviewWithOverride = useCallback((override: Partial<SimulationInputs>) => {
    if (!formRef.current) return;
    const inputs = { ...buildInputsFromForm(formRef.current), ...override };
    setPreviewInputs(inputs);
    setPreviewRegime(inputs.regime);
    try {
      setPreview(computeSimulation(inputs));
      setPreviewError(null);
    } catch {
      setPreview(null);
      setPreviewError("Impossible de calculer le résumé.");
    }
  }, [regime, amortizationEnabled]);

  const rafIdRef = useRef<number | null>(null);

  const schedulePreviewUpdate = useCallback(
    (override: Partial<SimulationInputs> = {}) => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        updatePreviewWithOverride(override);
      });
    },
    [updatePreviewWithOverride]
  );

  const updatePreview = () => {
    schedulePreviewUpdate({});
  };

  useEffect(() => {
    updatePreview();
  }, []);

  const isPreviewComplete = Boolean(
    preview &&
      previewInputs &&
      previewInputs.priceCents > 0 &&
      previewInputs.loanRateBps > 0 &&
      previewInputs.loanYears > 0 &&
      previewInputs.rentMonthlyCents > 0 &&
      (previewInputs.notaryFeeMode === "percent"
        ? (previewInputs.notaryFeePercentBps ?? 0) > 0
        : (previewInputs.notaryFeeCents ?? 0) > 0)
  );

  const missingFields = (() => {
    if (!previewInputs) return ["prix", "taux", "durée", "loyer", "frais de notaire"];
    const missing: string[] = [];
    if (previewInputs.priceCents <= 0) missing.push("prix");
    if (previewInputs.loanRateBps <= 0) missing.push("taux");
    if (previewInputs.loanYears <= 0) missing.push("durée");
    if (previewInputs.rentMonthlyCents <= 0) missing.push("loyer");
    if (
      (previewInputs.notaryFeeMode === "percent" && (previewInputs.notaryFeePercentBps ?? 0) <= 0) ||
      (previewInputs.notaryFeeMode === "fixed" && (previewInputs.notaryFeeCents ?? 0) <= 0)
    ) {
      missing.push("frais de notaire");
    }
    return missing;
  })();

  const formatEuroOrDash = (value?: number) =>
    isPreviewComplete && typeof value === "number" ? formatEuroFromCents(value) : "—";

  const formatPercentOrDash = (value?: number) =>
    isPreviewComplete && typeof value === "number" ? formatPercentFromBps(value) : "—";

  const verdict = (() => {
    if (!isPreviewComplete || !preview) {
      return { label: "incomplet", className: "bg-slate-200 text-slate-700" };
    }
    if (preview.monthlyCashflowAfterTaxCents >= 0) {
      return { label: "cash-flow positif", className: "bg-emerald-100 text-emerald-700" };
    }
    if (preview.monthlyCashflowAfterTaxCents >= -10_000) {
      return { label: "cash-flow léger déficit", className: "bg-amber-100 text-amber-700" };
    }
    return { label: "cash-flow négatif", className: "bg-rose-100 text-rose-700" };
  })();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    const currentValue =
      typeof preview?.monthlyCashflowAfterTaxCents === "number" ? preview.monthlyCashflowAfterTaxCents : null;

    if (!isPreviewComplete || currentValue === null) {
      setAnimatedCashflowCents(null);
      setCashflowFlash(null);
      previousCashflowRef.current = null;
      didMountRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
      return;
    }

    if (!didMountRef.current) {
      setAnimatedCashflowCents(currentValue);
      previousCashflowRef.current = currentValue;
      didMountRef.current = true;
      return;
    }

    const start = previousCashflowRef.current ?? currentValue;
    const end = currentValue;
    if (start === end) {
      setAnimatedCashflowCents(end);
      return;
    }

    const direction = end > start ? "up" : "down";
    setCashflowFlash(direction);
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => {
      setCashflowFlash(null);
      flashTimeoutRef.current = null;
    }, 250);

    if (prefersReducedMotion) {
      setAnimatedCashflowCents(end);
      previousCashflowRef.current = end;
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const duration = 350;
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const value = Math.round(start + (end - start) * eased);
      setAnimatedCashflowCents(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setAnimatedCashflowCents(end);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    previousCashflowRef.current = end;

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
    };
  }, [preview?.monthlyCashflowAfterTaxCents, isPreviewComplete, prefersReducedMotion]);

  const cashflowClassName = [
    "text-2xl font-semibold transition-transform transition-colors duration-200",
    !isPreviewComplete ? "text-slate-400" : "text-slate-900",
    cashflowFlash === "up" ? "text-emerald-700" : "",
    cashflowFlash === "down" ? "text-rose-700" : "",
    cashflowFlash && !prefersReducedMotion ? "scale-105" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const SummaryContent = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Cash-flow mensuel après impôt</p>
            <div className="flex items-center gap-2">
              <p className={cashflowClassName}>
                {isPreviewComplete
                  ? formatEuroFromCents(animatedCashflowCents ?? preview?.monthlyCashflowAfterTaxCents ?? 0)
                  : "—"}
              </p>
              {cashflowFlash ? (
                <span className="text-xs font-semibold text-slate-500">
                  {cashflowFlash === "up" ? "↑" : "↓"}
                </span>
              ) : null}
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdict.className}`}>
            {verdict.label}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{previewRegime === "micro" ? "LMNP micro-BIC" : "LMNP réel"}</span>
          <span>•</span>
          <span>Crédit + assurance inclus</span>
        </div>
      </div>

      {!isPreviewComplete ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Champs manquants</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ce qui pèse le plus</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Mensualité totale</span>
          <span className="font-semibold text-slate-900">{formatEuroOrDash(preview?.monthlyPaymentTotalCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Loyer net annuel</span>
          <span className="font-semibold text-slate-900">{formatEuroOrDash(preview?.annualRentNetCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Charges annuelles</span>
          <span className="font-semibold text-slate-900">{formatEuroOrDash(preview?.annualChargesCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Impôt annuel estimé</span>
          <span className="font-semibold text-slate-900">{formatEuroOrDash(preview?.taxEstimatedCents)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rentabilités</p>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <span>Rentabilité brute</span>
            <HelpTip
              label="Rentabilité brute"
              text="Loyers annuels bruts ÷ coût total du projet. Ne tient pas compte des charges."
            />
          </span>
          <span className="font-semibold text-slate-900">{formatPercentOrDash(preview?.grossYieldBps)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <span>Rentabilité nette</span>
            <HelpTip
              label="Rentabilité nette"
              text="Loyers annuels nets (après vacance) - charges annuelles, le tout ÷ coût total du projet."
            />
          </span>
          <span className="font-semibold text-slate-900">{formatPercentOrDash(preview?.netYieldBps)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Coût total projet</span>
          <span className="font-semibold text-slate-900">{formatEuroOrDash(preview?.totalProjectCostCents)}</span>
        </div>
      </div>

    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="grid gap-6 items-start lg:grid-cols-12">
        <div className="lg:col-span-8 min-w-0">
          <form
            ref={formRef}
            action={action}
            className="space-y-8"
            onInput={() => schedulePreviewUpdate({})}
            onChange={() => schedulePreviewUpdate({})}
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h1 className="text-xl font-semibold">Projet</h1>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="name" className="inline-flex items-center gap-1">
                    <span>Nom de la simulation</span>
                    <HelpTip
                      label="Nom de la simulation"
                      text="Juste un nom pour retrouver ton projet plus tard (ex: Studio Lyon)."
                    />
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    defaultValue={getValue(initialValues?.name, defaults.name)}
                  />
                  <p className="text-xs text-slate-500">Nom interne pour retrouver la simulation.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="price" className="inline-flex items-center gap-1">
                    <span>Prix d'achat (€)</span>
                    <HelpTip label="Prix d'achat" text="Prix du bien hors frais de notaire et travaux." />
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.price, defaults.price)}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Prix d'acquisition hors frais.</p>
                </div>
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-1">
                    <span>Frais de notaire</span>
                    <HelpTip
                      label="Frais de notaire"
                      text="Choisis un pourcentage ou un montant fixe selon les informations que tu as."
                    />
                  </label>
                  <select
                    name="notaryFeeMode"
                    value={notaryFeeMode}
                    onChange={(event) => {
                      const nextMode = event.target.value as "percent" | "fixed";
                      setNotaryFeeMode(nextMode);
                      if (nextMode === "percent") {
                        if (notaryFeeFixedRef.current) {
                          notaryFeeFixedRef.current.value = "";
                        }
                      } else {
                        if (notaryFeePercentRef.current) {
                          notaryFeePercentRef.current.value = "";
                        }
                      }
                    }}
                  >
                    <option value="percent">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                  </select>
                  <p className="text-xs text-slate-500">Choisir pourcentage ou montant fixe.</p>
                </div>
                {notaryFeeMode === "percent" ? (
                  <div className="space-y-1">
                    <label htmlFor="notaryFeePercent" className="inline-flex items-center gap-1">
                      <span>Frais de notaire (%)</span>
                      <HelpTip
                        label="Frais de notaire (%)"
                        text="Souvent 7 à 8% dans l’ancien. Mets le pourcentage."
                      />
                    </label>
                    <input
                      ref={notaryFeePercentRef}
                      id="notaryFeePercent"
                      name="notaryFeePercent"
                      type="number"
                      defaultValue={getValue(initialValues?.notaryFeePercent, defaults.notaryFeePercent)}
                      min="0"
                      max="15"
                      step="0.1"
                    />
                    <p className="text-xs text-slate-500">Ex: 7 à 8% dans l'ancien.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label htmlFor="notaryFeeFixed" className="inline-flex items-center gap-1">
                      <span>Frais de notaire fixe (€)</span>
                      <HelpTip
                        label="Frais de notaire fixe (€)"
                        text="Si tu connais le montant exact en euros, mets-le ici."
                      />
                    </label>
                    <input
                      ref={notaryFeeFixedRef}
                      id="notaryFeeFixed"
                      name="notaryFeeFixed"
                      type="number"
                      defaultValue={getValue(initialValues?.notaryFeeFixed, defaults.notaryFeeFixed)}
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-slate-500">Utilisé si montant fixe.</p>
                  </div>
                )}
                <div className="space-y-1">
                  <label htmlFor="works" className="inline-flex items-center gap-1">
                    <span>Travaux (€)</span>
                    <HelpTip
                      label="Travaux"
                      text="Budget total des travaux prévus (même si c’est une estimation)."
                    />
                  </label>
                  <input
                    id="works"
                    name="works"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.works, defaults.works)}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Travaux et remise aux normes.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="furniture" className="inline-flex items-center gap-1">
                    <span>Mobilier (€)</span>
                    <HelpTip
                      label="Mobilier"
                      text="Si location meublée: coût du mobilier et équipement de départ."
                    />
                  </label>
                  <input
                    id="furniture"
                    name="furniture"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.furniture, defaults.furniture)}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Mobilier initial si location meublée.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="downPayment" className="inline-flex items-center gap-1">
                    <span>Apport (€)</span>
                    <HelpTip
                      label="Apport"
                      text="Somme que tu mets de ta poche. Le reste sera financé par le crédit."
                    />
                  </label>
                  <input
                    id="downPayment"
                    name="downPayment"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.downPayment, defaults.downPayment)}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Apport personnel (hors frais).</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Financement et loyers</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="loanRate" className="inline-flex items-center gap-1">
                    <span>Taux annuel (%)</span>
                    <HelpTip label="Taux annuel" text="Taux du crédit (hors assurance). Ex: 4%." />
                  </label>
                  <input
                    id="loanRate"
                    name="loanRate"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.loanRate, defaults.loanRate)}
                    min="0"
                    max="15"
                    step="0.01"
                  />
                  <p className="text-xs text-slate-500">Taux du crédit (hors assurance).</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="loanYears" className="inline-flex items-center gap-1">
                    <span>Durée (années)</span>
                    <HelpTip
                      label="Durée"
                      text="Durée du prêt en années. Plus c’est long, plus la mensualité baisse (mais tu paies plus d’intérêts)."
                    />
                  </label>
                  <input
                    id="loanYears"
                    name="loanYears"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.loanYears, defaults.loanYears)}
                    min="5"
                    max="30"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Entre 5 et 30 ans.</p>
                </div>
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-1">
                    <span>Assurance emprunteur</span>
                    <HelpTip
                      label="Assurance emprunteur"
                      text="Choisis un taux annuel ou un montant fixe mensuel."
                    />
                  </label>
                  <select
                    name="insuranceMode"
                    value={insuranceMode}
                    onChange={(event) => {
                      const nextMode = event.target.value as "percent" | "fixed";
                      setInsuranceMode(nextMode);
                      if (nextMode === "percent") {
                        if (insuranceFixedRef.current) {
                          insuranceFixedRef.current.value = "";
                        }
                      } else {
                        if (insuranceRateRef.current) {
                          insuranceRateRef.current.value = "";
                        }
                      }
                    }}
                  >
                    <option value="percent">Pourcentage annuel</option>
                    <option value="fixed">Montant mensuel fixe</option>
                  </select>
                  <p className="text-xs text-slate-500">TAEA ou montant mensuel.</p>
                </div>
                {insuranceMode === "percent" ? (
                  <div className="space-y-1">
                    <label htmlFor="insuranceRate" className="inline-flex items-center gap-1">
                      <span>Assurance (%)</span>
                      <HelpTip
                        label="Assurance (%)"
                        text="Taux annuel d’assurance emprunteur (souvent 0,20 à 0,40%)."
                      />
                    </label>
                    <input
                      ref={insuranceRateRef}
                      id="insuranceRate"
                      name="insuranceRate"
                      type="number"
                      defaultValue={getValue(initialValues?.insuranceRate, defaults.insuranceRate)}
                      min="0"
                      max="2"
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">Ex: 0,20 à 0,40% annuel.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label htmlFor="insuranceFixed" className="inline-flex items-center gap-1">
                      <span>Assurance mensuelle (€)</span>
                      <HelpTip
                        label="Assurance mensuelle (€)"
                        text="Si tu as un montant fixe par mois au lieu d’un taux."
                      />
                    </label>
                    <input
                      ref={insuranceFixedRef}
                      id="insuranceFixed"
                      name="insuranceFixed"
                      type="number"
                      defaultValue={getValue(initialValues?.insuranceFixed, defaults.insuranceFixed)}
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-slate-500">Si montant fixe.</p>
                  </div>
                )}
                <div className="space-y-1">
                  <label htmlFor="rentMonthly" className="inline-flex items-center gap-1">
                    <span>Loyer HC mensuel (€)</span>
                    <HelpTip
                      label="Loyer HC mensuel"
                      text="Loyer hors charges récupérables. C’est ton vrai revenu locatif."
                    />
                  </label>
                  <input
                    id="rentMonthly"
                    name="rentMonthly"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.rentMonthly, defaults.rentMonthly)}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Hors charges récupérables.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="vacancyRate" className="inline-flex items-center gap-1">
                    <span>Vacance locative (%)</span>
                    <HelpTip
                      label="Vacance locative"
                      text="Pourcentage de l’année sans locataire (ex: 5% ≈ 18 jours/an)."
                    />
                  </label>
                  <input
                    id="vacancyRate"
                    name="vacancyRate"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.vacancyRate, defaults.vacancyRate)}
                    min="0"
                    max="50"
                    step="0.1"
                  />
                  <p className="text-xs text-slate-500">Bornes: 0 à 50%.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="recoverableChargesMonthly" className="inline-flex items-center gap-1">
                    <span>Charges récupérables mensuelles (€)</span>
                    <HelpTip
                      label="Charges récupérables"
                      text="Charges payées par le locataire. Souvent neutre pour toi, mais utile pour le calcul."
                    />
                  </label>
                  <input
                    id="recoverableChargesMonthly"
                    name="recoverableChargesMonthly"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.recoverableChargesMonthly, defaults.recoverableChargesMonthly)}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Ne change pas le cash-flow si neutre.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Charges & fiscalité</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="nonRecoverableChargesMonthly" className="inline-flex items-center gap-1">
                    <span>Charges non récupérables mensuelles (€)</span>
                    <HelpTip
                      label="Charges non récupérables"
                      text="Charges que tu paies et que tu ne peux pas refacturer au locataire."
                    />
                  </label>
                  <input
                    id="nonRecoverableChargesMonthly"
                    name="nonRecoverableChargesMonthly"
                    type="number"
                    required
                    defaultValue={getValue(
                      initialValues?.nonRecoverableChargesMonthly,
                      defaults.nonRecoverableChargesMonthly
                    )}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Charges non refacturables au locataire.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="propertyTax" className="inline-flex items-center gap-1">
                    <span>Taxe foncière annuelle (€)</span>
                    <HelpTip label="Taxe foncière" text="Montant annuel de taxe foncière du bien." />
                  </label>
                  <input
                    id="propertyTax"
                    name="propertyTax"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.propertyTax, defaults.propertyTax)}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Montant annuel moyen.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="pno" className="inline-flex items-center gap-1">
                    <span>PNO annuelle (€)</span>
                    <HelpTip label="PNO" text="Assurance propriétaire non occupant (annuelle)." />
                  </label>
                  <input
                    id="pno"
                    name="pno"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.pno, defaults.pno)}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-slate-500">Assurance propriétaire non occupant.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="managementFee" className="inline-flex items-center gap-1">
                    <span>Gestion locative (%)</span>
                    <HelpTip
                      label="Gestion locative"
                      text="Pourcentage si tu passes par une agence (0% si gestion toi-même)."
                    />
                  </label>
                  <input
                    id="managementFee"
                    name="managementFee"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.managementFee, defaults.managementFee)}
                    min="0"
                    max="15"
                    step="0.1"
                  />
                  <p className="text-xs text-slate-500">0 si gestion en direct.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="tmi" className="inline-flex items-center gap-1">
                    <span>TMI (%)</span>
                    <HelpTip
                      label="TMI"
                      text="Ton taux d’impôt le plus élevé. Ex: 30% si tu es dans la tranche 30%."
                    />
                  </label>
                  <input
                    id="tmi"
                    name="tmi"
                    type="number"
                    required
                    defaultValue={getValue(initialValues?.tmi, defaults.tmi)}
                    min="0"
                    max="45"
                    step="0.1"
                  />
                  <p className="text-xs text-slate-500">Tranche marginale d'imposition.</p>
                </div>
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-1">
                    <span>Régime fiscal</span>
                    <HelpTip
                      label="Régime fiscal"
                      text="Micro = abattement forfaitaire. Réel = charges + amortissements possibles."
                    />
                  </label>
                  <select
                    name="regime"
                    value={regime}
                    onChange={(event) => {
                      const nextRegime = event.target.value === "reel" ? "reel" : "micro";
                      setRegime(nextRegime);
                      const nextAmortizationEnabled = nextRegime === "micro" ? false : amortizationEnabled;
                      if (nextRegime === "micro") {
                        setAmortizationEnabled(false);
                      }
                      schedulePreviewUpdate({
                        regime: nextRegime,
                        amortizationEnabled: nextAmortizationEnabled,
                      });
                    }}
                  >
                    <option value="micro">LMNP micro-BIC</option>
                    <option value="reel">LMNP réel simplifié</option>
                  </select>
                  <p className="text-xs text-slate-500">Micro = abattement forfaitaire 50%.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="amortizationEnabled"
                    name="amortizationEnabled"
                    type="checkbox"
                    value="true"
                    checked={amortizationEnabled}
                    disabled={regime === "micro"}
                    onChange={(event) => {
                      setAmortizationEnabled(event.target.checked);
                      schedulePreviewUpdate({ amortizationEnabled: event.target.checked });
                    }}
                  />
                  <label htmlFor="amortizationEnabled" className="inline-flex items-center gap-1">
                    <span>Utiliser les amortissements (simulation LMNP réel)</span>
                    <HelpTip
                      label="Amortissements"
                      text="En réel, ça peut réduire l’impôt en ‘étalant’ le coût du bien/travaux/mobilier. Simplifié ici."
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  En LMNP réel, les amortissements peuvent réduire la base imposable en tenant compte de l’usure du bien,
                  des travaux et du mobilier. Durées moyennes simplifiées. Ne remplace pas un conseil comptable.
                </p>
                {regime === "micro" ? (
                  <p className="text-xs text-amber-600">Disponible uniquement en LMNP réel.</p>
                ) : null}
              </div>
              <p className="mt-4 text-xs text-slate-500">Simulation indicative, ne remplace pas un conseil fiscal.</p>
            </div>

            <div className="flex justify-end gap-2">
              {mode === "edit" && cancelHref ? (
                <Link
                  href={cancelHref}
                  className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                >
                  Annuler
                </Link>
              ) : null}
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white">
                {mode === "edit" ? "Enregistrer les modifications" : "Calculer la simulation"}
              </button>
            </div>
          </form>
        </div>

        <aside
          id="sticky-summary"
          className="hidden overflow-visible lg:col-span-4 lg:block lg:min-w-0 lg:sticky lg:top-24 lg:self-start"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-visible">
            <div className="lg:max-h-[calc(100vh-8rem)]">
              <div className="lg:overflow-auto">
                <h3 className="text-lg font-semibold">Résumé en temps réel</h3>
                <p className="text-xs text-slate-500">Renseigne prix, financement et loyer pour activer le résumé.</p>
                {previewError ? (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <p>Impossible de calculer le résumé.</p>
                    <button
                      type="button"
                      className="mt-2 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold"
                      onClick={() => schedulePreviewUpdate({})}
                    >
                      Recalculer
                    </button>
                  </div>
                ) : null}
                <div className="mt-4">
                  <SummaryContent />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:hidden">
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Cash-flow mensuel</p>
                <p className="text-lg font-semibold">
                  {isPreviewComplete
                    ? formatEuroFromCents(animatedCashflowCents ?? preview?.monthlyCashflowAfterTaxCents ?? 0)
                    : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdict.className}`}>
                  {verdict.label}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold"
                  onClick={() => setMobileSummaryOpen(true)}
                >
                  Détails
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {mobileSummaryOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:hidden">
          <div className="w-full rounded-t-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Résumé en temps réel</h3>
              <button
                type="button"
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold"
                onClick={() => setMobileSummaryOpen(false)}
              >
                Fermer
              </button>
            </div>
            {previewError ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <p>Impossible de calculer le résumé.</p>
                <button
                  type="button"
                  className="mt-2 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold"
                  onClick={() => schedulePreviewUpdate({})}
                >
                  Recalculer
                </button>
              </div>
            ) : null}
            <div className="mt-4">
              <SummaryContent />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}




