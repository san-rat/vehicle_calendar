import { redirect } from "next/navigation";
import {
  getCurrentAppUserState,
  getLoginErrorMessage,
  getPostLoginPath,
} from "@/lib/auth/user";
import { RouteTransition } from "@/components/RouteTransition";
import { Button, Field, Notice, Panel, inputClassName } from "@/components/ui";
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
        className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl animate-blob-1"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl animate-blob-2"
      />
      <div className="app-container">
        <RouteTransition className="mx-auto max-w-md" transitionKey="login">
          <Panel className="overflow-hidden border-white/60 bg-white/80 p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] backdrop-blur-2xl sm:p-10">
            <div className="flex flex-col items-center text-center">
              <p className="text-3xl font-extrabold tracking-tight text-[var(--text)]">
                <span className="text-[var(--primary)]">Fleet</span>Time
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--muted)]">
                Sign in to manage your vehicles
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
