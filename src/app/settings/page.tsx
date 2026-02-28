import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{"Paramètres"}</h1>
        <p className="text-sm text-slate-600">{"Gérez votre compte et vos accès."}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">{"Email"}</p>
        <p className="text-lg font-semibold">{data.user.email}</p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm">
            {"Se déconnecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
