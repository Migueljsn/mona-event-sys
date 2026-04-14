import { signOutAction } from "@/app/admin/login/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
      >
        Sair
      </button>
    </form>
  );
}
