import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

export default async function AppHeader() {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase.auth.getUser();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          {"Simulateur locatif"}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/simulations" className="hover:text-slate-900">
            {"Mes simulations"}
          </Link>
          <Link href="/simulations/new" className="hover:text-slate-900">
            {"Nouvelle simulation"}
          </Link>
          <Link href="/settings" className="hover:text-slate-900">
            {"Paramètres"}
          </Link>
          {data.user ? (
            <form action="/auth/signout" method="post">
              <button className="rounded-full border border-slate-200 px-3 py-1 text-sm hover:border-slate-300">
                {"Se déconnecter"}
              </button>
            </form>
          ) : (
            <Link
              href="/auth"
              className="rounded-full border border-slate-200 px-3 py-1 text-sm hover:border-slate-300"
            >
              {"Se connecter"}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
