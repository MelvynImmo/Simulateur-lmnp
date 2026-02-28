import { signIn, signUp } from "@/app/auth/actions";

export default function AuthPage({
  searchParams,
}: {
  searchParams?: { error?: string; redirect?: string };
}) {
  const redirectTarget = searchParams?.redirect ?? "/dashboard";

  return (
    <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{"Connexion"}</h1>
        <p className="text-sm text-slate-600">{"Accédez à vos simulations en quelques secondes."}</p>
        {searchParams?.error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {decodeURIComponent(searchParams.error)}
          </p>
        )}
        <form action={signIn} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <input type="hidden" name="redirect" value={redirectTarget} />
          <div className="space-y-1">
            <label htmlFor="email">{"Email"}</label>
            <input id="email" name="email" type="email" placeholder="vous@email.com" required />
          </div>
          <div className="space-y-1">
            <label htmlFor="password">{"Mot de passe"}</label>
            <input id="password" name="password" type="password" required />
          </div>
          <button className="w-full rounded-md bg-slate-900 py-2 font-semibold text-white">
            {"Se connecter"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{"Créer un compte"}</h2>
        <p className="text-sm text-slate-600">{"Testez gratuitement et sauvegardez vos projets."}</p>
        <form action={signUp} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <input type="hidden" name="redirect" value={redirectTarget} />
          <div className="space-y-1">
            <label htmlFor="signup-email">{"Email"}</label>
            <input id="signup-email" name="email" type="email" placeholder="vous@email.com" required />
          </div>
          <div className="space-y-1">
            <label htmlFor="signup-password">{"Mot de passe"}</label>
            <input id="signup-password" name="password" type="password" required minLength={6} />
          </div>
          <button className="w-full rounded-md border border-slate-300 py-2 font-semibold text-slate-700">
            {"Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
