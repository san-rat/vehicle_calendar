import { redirect } from "next/navigation";
import {
  getCurrentAppUserState,
  getLoginErrorMessage,
  getPostLoginPath,
} from "@/lib/auth/user";
import { RouteTransition } from "@/components/RouteTransition";
import { Button, Field, Notice, Panel, inputClassName } from "@/components/ui";
import { FleetIcon } from "@/components/ui/icons";
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
    <div className="relative flex min-h-screen items-center overflow-hidden bg-[var(--bg)] py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full border border-[var(--border)]/80 bg-white/35"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-12 h-72 w-72 rounded-full border border-[var(--border)]/70 bg-white/25"
      />
      <div className="app-container">
        <RouteTransition className="mx-auto max-w-md" transitionKey="login">
          <Panel className="overflow-hidden border-white/70 bg-white/92 p-6 shadow-md shadow-slate-200/70 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm shadow-blue-100/50">
                <FleetIcon className="h-7 w-7" />
              </span>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-[var(--text)]">
                FleetTime
              </p>
            </div>

            {errorMessage ? (
              <Notice className="mt-6" tone="danger">
                {errorMessage}
              </Notice>
            ) : null}

            <form action={logInWithName} className="mt-6 space-y-5">
              <Field
                htmlFor="name"
                label="Name"
              >
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="username"
                  className={inputClassName()}
                  required
                />
              </Field>

              <Field
                htmlFor="password"
                label="Password"
              >
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className={inputClassName()}
                  required
                />
              </Field>

              <Button
                className="w-full"
                tone="primary"
                type="submit"
              >
                Login
              </Button>
            </form>
          </Panel>
        </RouteTransition>
      </div>
    </div>
  );
}
