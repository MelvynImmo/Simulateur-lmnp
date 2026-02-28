import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { formatEuroFromCents } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerComponentClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return null;
  }

  const { data: simulations } = await supabase
    .from("simulations")
    .select(
      "id, name, created_at, simulation_results (annual_cashflow_after_tax_cents, monthly_cashflow_after_tax_cents)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{"Mes simulations"}</h1>
          <p className="text-sm text-slate-600">{"Retrouvez vos projets et leurs résultats clés."}</p>
        </div>
        <Link
          href="/simulations/new"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {"Nouvelle simulation"}
        </Link>
      </div>

      <div className="grid gap-4">
        {(simulations ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            {"Aucune simulation pour le moment."}
          </div>
        ) : (
          simulations?.map((simulation) => {
            const result = simulation.simulation_results?.[0];
            return (
              <div key={simulation.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      {new Date(simulation.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{simulation.name}</p>
                  </div>
                  <Link
                    href={`/simulations/${simulation.id}`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600"
                  >
                    {"Voir les résultats"}
                  </Link>
                </div>
                {result && (
                  <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">{"Cash-flow annuel après impôt"}</p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatEuroFromCents(result.annual_cashflow_after_tax_cents)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">{"Cash-flow mensuel après impôt"}</p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatEuroFromCents(result.monthly_cashflow_after_tax_cents)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
