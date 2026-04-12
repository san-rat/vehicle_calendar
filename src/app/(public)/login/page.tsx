import { redirect } from "next/navigation";
import {
  getCurrentAppUserState,
  getLoginErrorMessage,
  getPostLoginPath,
} from "@/lib/auth/user";
import { logInWithName } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { user, problem } = await getCurrentAppUserState();

  if (problem) {
    redirect(`/auth/logout?reason=${problem}`);
  }

  if (user) {
    redirect(getPostLoginPath(user.role));
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const errorMessage = getLoginErrorMessage(resolvedSearchParams.error);

  return (
    <div className="flex min-h-screen items-center bg-[var(--bg)] py-12">
      <div className="app-container">
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            FleetTime
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--text)]">
            Sign In
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Use your unique name and password to access the vehicle calendar.
          </p>

          {errorMessage ? (
            <p className="mt-6 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
              {errorMessage}
            </p>
          ) : null}

          <form action={logInWithName} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-[var(--text)]"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="username"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
                placeholder="Super Admin"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--text)]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
