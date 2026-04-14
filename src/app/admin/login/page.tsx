import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-sand)] px-6 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-[var(--color-line)] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3">
          <span className="w-fit rounded-full border border-[var(--color-line)] bg-[var(--color-sand)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Admin
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
            Login do admin
          </h1>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Use um usuario criado no Supabase Auth para acessar o painel
            interno.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
