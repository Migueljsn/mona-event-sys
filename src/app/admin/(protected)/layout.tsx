import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[var(--color-sand)] text-[var(--color-ink)]">
      <header className="border-b border-[var(--color-line)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold tracking-tight">
              Mona Event Sys
            </Link>
            <nav className="flex items-center gap-4 text-sm text-[var(--color-muted)]">
              <Link href="/admin">Dashboard</Link>
              <Link href="/admin/cards/new">Novo card</Link>
              <Link href="/admin/settings">Settings</Link>
              <Link href="/">Vitrine</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[var(--color-muted)] md:inline">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
