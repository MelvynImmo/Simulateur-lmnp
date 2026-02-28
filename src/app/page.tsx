import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Simule ton investissement locatif LMNP en quelques minutes.
            </h1>
            <p className="text-base text-slate-600">
              Crée un compte, saisis ton projet et obtiens un résultat clair sur le cash-flow, la rentabilité et
              l&apos;impôt estimé.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/simulations/new"
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Lancer une simulation
              </Link>
              <Link
                href="/simulations"
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Voir mes simulations
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-900">Ce que tu obtiens</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Cash-flow mensuel avant et après impôt.</li>
              <li>Comparatif LMNP micro-BIC et LMNP réel simplifié.</li>
              <li>Sauvegarde de tes simulations pour les revoir.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Rapide à utiliser",
            text: "Un formulaire guidé pour saisir ton projet en quelques minutes.",
          },
          {
            title: "Lecture claire",
            text: "Des indicateurs lisibles pour comprendre immédiatement le deal.",
          },
          {
            title: "Décision mieux cadrée",
            text: "Un verdict simple good, medium ou bad pour prioriser tes projets.",
          },
        ].map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Comment ça marche</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Renseigne ton projet",
              text: "Prix, notaire, travaux, mobilier et apport.",
            },
            {
              step: "2",
              title: "Complète le financement",
              text: "Taux, durée, assurance, loyer et vacance locative.",
            },
            {
              step: "3",
              title: "Lis les résultats",
              text: "Cash-flow, rentabilité, fiscalité estimée et verdict.",
            },
          ].map((item) => (
            <article key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Étape {item.step}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="pb-2 text-sm text-slate-600">
        <p>Les résultats sont indicatifs et ne remplacent pas un conseil fiscal ou financier.</p>
      </footer>
    </div>
  );
}
