import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import SimulationForm, { type SimulationFormValues } from "@/components/SimulationForm";
import { updateSimulation } from "./actions";

const formatInput = (value: number | null | undefined, scale: number) => {
  if (value === null || value === undefined) return "";
  const num = value / scale;
  if (!Number.isFinite(num)) return "";
  return Number.isInteger(num) ? String(num) : String(num);
};

export default async function EditSimulationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        ID manquant dans l'URL.
      </div>
    );
  }

  const supabase = await createSupabaseServerComponentClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/auth");
  }

  const { data: simulation } = await supabase
    .from("simulations")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!simulation) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Simulation introuvable ou accès refusé.
      </div>
    );
  }

  const { data: inputs } = await supabase
    .from("simulation_inputs")
    .select("*")
    .eq("simulation_id", id)
    .maybeSingle();

  if (!inputs) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Simulation incomplète : les entrées n'ont pas été enregistrées.
      </div>
    );
  }

  const action = updateSimulation.bind(null, id);

  const initialValues: SimulationFormValues = {
    name: inputs.name ?? simulation.name,
    price: formatInput(inputs.price_cents, 100),
    notaryFeeMode: inputs.notary_fee_mode ?? "percent",
    notaryFeePercent: formatInput(inputs.notary_fee_percent_bps, 100),
    notaryFeeFixed: formatInput(inputs.notary_fee_cents, 100),
    works: formatInput(inputs.works_cents, 100),
    furniture: formatInput(inputs.furniture_cents, 100),
    downPayment: formatInput(inputs.down_payment_cents, 100),
    loanRate: formatInput(inputs.loan_rate_bps, 100),
    loanYears: inputs.loan_years ? String(inputs.loan_years) : "",
    insuranceMode: inputs.insurance_mode ?? "percent",
    insuranceRate: formatInput(inputs.insurance_rate_bps, 100),
    insuranceFixed: formatInput(inputs.insurance_monthly_cents, 100),
    rentMonthly: formatInput(inputs.rent_monthly_cents, 100),
    vacancyRate: formatInput(inputs.vacancy_rate_bps, 100),
    recoverableChargesMonthly: formatInput(inputs.recoverable_charges_monthly_cents, 100),
    nonRecoverableChargesMonthly: formatInput(inputs.non_recoverable_charges_monthly_cents, 100),
    propertyTax: formatInput(inputs.property_tax_cents, 100),
    pno: formatInput(inputs.pno_cents, 100),
    managementFee: formatInput(inputs.management_fee_bps, 100),
    tmi: formatInput(inputs.tmi_bps, 100),
    regime: inputs.regime ?? "micro",
    amortizationEnabled: Boolean(inputs.amortization_enabled),
  };

  return <SimulationForm mode="edit" action={action} initialValues={initialValues} cancelHref={`/simulations/${id}`} />;
}
