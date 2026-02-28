"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEuroFromCents, formatPercentFromBps } from "@/lib/format";

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

type SimulationsListClientProps = {
  items: SimulationListItem[];
  deleteAction: (formData: FormData) => Promise<void>;
};

const getVerdict = (badge: SimulationListItem["verdictBadge"]) => {
  if (!badge) {
    return { label: "—", className: "bg-slate-200 text-slate-700" };
  }
  if (badge === "good") {
    return { label: "good", className: "bg-emerald-100 text-emerald-700" };
  }
  if (badge === "medium") {
    return { label: "medium", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "bad", className: "bg-rose-100 text-rose-700" };
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
};

const formatEuroOrDash = (value: number | null) =>
  typeof value === "number" ? formatEuroFromCents(value) : "—";

const formatPercentOrDash = (value: number | null) =>
  typeof value === "number" ? formatPercentFromBps(value) : "—";

export default function SimulationsListClient({ items, deleteAction }: SimulationsListClientProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "cashflow" | "net">("recent");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let filtered = items;
    if (normalizedQuery) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
    }

    if (sortBy === "cashflow") {
      return [...filtered].sort(
        (a, b) => (b.monthlyCashflowAfterTaxCents ?? -Infinity) - (a.monthlyCashflowAfterTaxCents ?? -Infinity)
      );
    }

    if (sortBy === "net") {
      return [...filtered].sort((a, b) => (b.netYieldBps ?? -Infinity) - (a.netYieldBps ?? -Infinity));
    }

    return [...filtered].sort((a, b) => {
      const timeA = Number.isNaN(new Date(a.createdAt).getTime()) ? 0 : new Date(a.createdAt).getTime();
      const timeB = Number.isNaN(new Date(b.createdAt).getTime()) ? 0 : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [items, query, sortBy]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mes simulations</h1>
          <p className="text-sm text-slate-500">Retrouve et compare tes projets enregistrés.</p>
        </div>
        <Link
          href="/simulations/new"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Nouvelle simulation
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Rechercher par nom"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm md:w-72"
        />
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as "recent" | "cashflow" | "net")}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm"
        >
          <option value="recent">Les plus récentes</option>
          <option value="cashflow">Cash-flow mensuel</option>
          <option value="net">Rentabilité nette</option>
        </select>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Aucune simulation correspondante.
          </div>
        ) : null}

        {filteredItems.map((item) => {
          const verdict = getVerdict(item.verdictBadge);
          const cashflowClassName =
            typeof item.monthlyCashflowAfterTaxCents !== "number"
              ? "text-slate-400"
              : item.monthlyCashflowAfterTaxCents >= 0
                ? "text-emerald-700"
                : "text-rose-700";
          return (
            <div key={item.id} className="relative">
              <Link
                href={`/simulations/${item.id}`}
                aria-label={`Voir la simulation ${item.name}`}
                className="block rounded-2xl border border-slate-200 bg-white p-6 pr-44 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.regime === "micro" ? "LMNP micro-BIC" : "LMNP réel"}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdict.className}`}>
                        {verdict.label === "good"
                          ? "cash-flow positif"
                          : verdict.label === "medium"
                            ? "léger déficit"
                            : verdict.label === "bad"
                              ? "cash-flow négatif"
                              : verdict.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDate(item.createdAt)} · {item.regime === "micro" ? "LMNP micro-BIC" : "LMNP réel"}
                    </p>
                    {item.verdictExplanation ? (
                      <p className="mt-2 text-sm text-slate-600">{item.verdictExplanation}</p>
                    ) : null}
                  </div>
                </div>

                {item.resultsAvailable ? (
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-500">Cash-flow mensuel</p>
                      <p className={`font-semibold ${cashflowClassName}`}>
                        {formatEuroOrDash(item.monthlyCashflowAfterTaxCents)}
                      </p>
                      <p className="text-[11px] text-slate-400">mensuel</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Rentabilité brute</p>
                      <p className="font-semibold">{formatPercentOrDash(item.grossYieldBps)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Rentabilité nette</p>
                      <p className="font-semibold">{formatPercentOrDash(item.netYieldBps)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold">Résultats indisponibles</p>
                    <p className="mt-1 text-xs text-slate-500">Ouvre la simulation pour recalculer.</p>
                  </div>
                )}
              </Link>

              <div
                className="pointer-events-auto absolute right-6 top-6 z-20 flex flex-wrap justify-end gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                <Link
                  href={`/simulations/${item.id}`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold"
                  onClick={(event) => event.stopPropagation()}
                >
                  Voir résultats
                </Link>
                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    event.stopPropagation();
                    if (!window.confirm("Supprimer cette simulation ?")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
