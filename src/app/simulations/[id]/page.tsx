import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { formatEuroFromCents, formatPercentFromBps } from "@/lib/format";
import { duplicateSimulation } from "./actions";
import TooltipInfo from "@/components/TooltipInfo";

const logSupabaseError = (scope: string, error: unknown) => {
  if (!error) return;
  const err = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  console.error(scope, {
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
    code: err?.code,
  });
};

export default async function SimulationResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ regime?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  if (!id) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        ID manquant dans l&apos;URL.
      </div>
    );
  }

  const supabase = await createSupabaseServerComponentClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const { data: sessionData } = await supabase.auth.getSession();

  console.error("HAS SESSION?", Boolean(sessionData?.session));
  console.error("ACCESS TOKEN?", sessionData?.session?.access_token ? "yes" : "no");

  logSupabaseError("Supabase auth error", authError);

  if (!authData.user) {
    redirect("/auth");
  }

  console.error("Auth user id", authData.user.id, "Simulation id", id);

  const { data: rawSim, error: rawErr } = await supabase
    .from("simulations")
    .select("id,user_id")
    .eq("id", id);

  console.error("RAW SIM LEN", rawSim?.length, "RAW ERR", rawErr);

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .select("id, name, created_at")
    .eq("id", id)
    .maybeSingle();

  logSupabaseError("Supabase simulation error", simulationError);

  if (!simulation) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Simulation introuvable ou accès refusé (RLS). User: {authData.user.id}
      </div>
    );
  }

  const { data: inputs, error: inputsError } = await supabase
    .from("simulation_inputs")
    .select("*")
    .eq("simulation_id", id)
    .maybeSingle();

  logSupabaseError("Supabase inputs error", inputsError);

  if (!inputs) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Simulation incomplète : les entrées n&apos;ont pas été enregistrées.
      </div>
    );
  }

  const finalRegime = sp.regime === "micro" || sp.regime === "reel" ? sp.regime : inputs.regime;

  const { data: results, error: resultsError } = await supabase
    .from("simulation_results")
    .select("*")
    .eq("simulation_id", id)
    .eq("regime", finalRegime)
    .maybeSingle();

  logSupabaseError("Supabase results error", resultsError);

  if (!results) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Simulation incomplète : les résultats ne sont pas disponibles.
      </div>
    );
  }

  const verdictBadge =
    results.monthly_cashflow_after_tax_cents >= 0
      ? "good"
      : results.monthly_cashflow_after_tax_cents >= -10_000
        ? "medium"
        : "bad";

  const verdictClasses =
    verdictBadge === "good"
      ? "bg-emerald-100 text-emerald-700"
      : verdictBadge === "medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  const toggleBase = `/simulations/${id}`;
  const duplicateAction = duplicateSimulation.bind(null, id);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Simulation du {new Date(simulation.created_at).toLocaleDateString("fr-FR")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{simulation.name}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdictClasses}`}>{verdictBadge}</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{results.verdict_explanation}</p>
        <p className="mt-2 text-xs text-slate-500">Simulation indicative, ne remplace pas un conseil fiscal.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={duplicateAction}>
            <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">
              Dupliquer
            </button>
          </form>
          <Link
            href={`/simulations/${id}/edit`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Modifier
          </Link>
        </div>
      </div>

      <section className="flex flex-wrap items-center gap-2">
        <Link
          href={`${toggleBase}?regime=micro`}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            finalRegime === "micro" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          LMNP micro-BIC
        </Link>
        <Link
          href={`${toggleBase}?regime=reel`}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            finalRegime === "reel" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          LMNP réel
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="inline-flex items-center gap-1 text-sm text-slate-500">
            <span>Rentabilité brute</span>
            <TooltipInfo label="Loyers annuels bruts ÷ coût total du projet. Donne une idée rapide, sans tenir compte des charges." />
          </p>
          <p className="text-xl font-semibold">{formatPercentFromBps(results.gross_yield_bps)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="inline-flex items-center gap-1 text-sm text-slate-500">
            <span>Rentabilité nette</span>
            <TooltipInfo label="(Loyers annuels nets après vacance - charges annuelles) ÷ coût total du projet. Plus proche du rendement réel." />
          </p>
          <p className="text-xl font-semibold">{formatPercentFromBps(results.net_yield_bps)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="inline-flex items-center gap-1 text-sm text-slate-500">
            <span>Cash-flow mensuel après impôt</span>
            <TooltipInfo label="Ce qu'il te reste (ou ce que tu ajoutes) chaque mois après charges, crédit et impôt estimé." />
          </p>
          <p className="text-xl font-semibold">{formatEuroFromCents(results.monthly_cashflow_after_tax_cents)}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Résultats clés</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Cash-flow annuel après impôt</span>
                <TooltipInfo label="Version annuelle du cash-flow après impôt. Permet de voir l'effort total sur 12 mois." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.annual_cashflow_after_tax_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Cash-flow mensuel après impôt</span>
                <TooltipInfo label="Montant mensuel restant après les sorties liées à l'exploitation, au financement et à l'impôt estimé." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.monthly_cashflow_after_tax_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Effort d&apos;épargne mensuel</span>
                <TooltipInfo label="Somme à remettre chaque mois si le cash-flow est négatif. Si c'est 0, le projet s'autofinance ou presque." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.monthly_savings_effort_cents)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Fiscalité</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Régime</span>
                <TooltipInfo label="Micro-BIC applique un abattement forfaitaire. Le réel prend en compte charges, intérêts et amortissements." />
              </span>
              <span className="font-semibold">{finalRegime === "micro" ? "LMNP micro-BIC" : "LMNP réel"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Base imposable estimée</span>
                <TooltipInfo label="Montant retenu pour calculer l'impôt estimé selon le régime sélectionné." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.tax_base_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Impôt estimé année 1 (hors prélèvements sociaux)</span>
                <TooltipInfo label="Estimation simplifiée de l'impôt la première année avec ta TMI. Les prélèvements sociaux ne sont pas inclus." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.tax_estimated_cents)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Projet & financement</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Coût total projet</span>
                <TooltipInfo label="Prix d'achat + frais de notaire + travaux + mobilier. C'est la base des rentabilités." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.total_project_cost_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Montant emprunté</span>
                <TooltipInfo label="Part du projet financée par la banque après déduction de l'apport." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.loan_amount_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Mensualité crédit (hors assurance)</span>
                <TooltipInfo label="Mensualité de prêt amortissable calculée avec le taux et la durée, sans assurance." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.monthly_payment_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Assurance mensuelle</span>
                <TooltipInfo label="Coût mensuel de l'assurance emprunteur, en taux annuel ou montant fixe selon ton choix." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.monthly_insurance_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Mensualité totale (crédit + assurance)</span>
                <TooltipInfo label="Somme réellement payée chaque mois pour le financement : crédit + assurance." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.monthly_payment_total_cents)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Revenus & charges</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Loyers annuels bruts</span>
                <TooltipInfo label="Loyer mensuel hors charges multiplié par 12, avant vacance locative." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.annual_rent_gross_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Vacance locative</span>
                <TooltipInfo label="Perte de loyer liée aux périodes sans locataire, basée sur ton taux de vacance." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.annual_vacancy_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Loyers annuels après vacance</span>
                <TooltipInfo label="Revenus locatifs annuels estimés après déduction de la vacance." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.annual_rent_net_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Charges annuelles</span>
                <TooltipInfo label="Total des charges d'exploitation : charges non récupérables, taxe foncière, PNO et gestion." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(results.annual_charges_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <span>Charges récupérables (mensuel)</span>
                <TooltipInfo label="Charges refacturées au locataire. Elles sont neutres pour le cash-flow dans ce modèle." />
              </span>
              <span className="font-semibold">{formatEuroFromCents(inputs.recoverable_charges_monthly_cents)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold">Détails fiscaux</h3>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="inline-flex items-center gap-1 text-slate-500">
              <span>TMI</span>
              <TooltipInfo align="left" label="Tranche Marginale d'Imposition utilisée pour estimer l'impôt." />
            </p>
            <p className="font-semibold">{formatPercentFromBps(inputs.tmi_bps)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="inline-flex items-center gap-1 text-slate-500">
              <span>Intérêts année 1</span>
              <TooltipInfo align="left" label="Part d'intérêts payée pendant la première année du prêt." />
            </p>
            <p className="font-semibold">{formatEuroFromCents(results.interest_year1_cents)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="inline-flex items-center gap-1 text-slate-500">
              <span>Amortissements annuels</span>
              <TooltipInfo align="left" label="Montant d'amortissement annuel retenu dans le calcul en LMNP réel (si activé)." />
            </p>
            <p className="font-semibold">{formatEuroFromCents(results.amortization_annual_cents)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
