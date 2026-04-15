import { redirect } from "next/navigation";
import {
  getCurrentAppUserState,
  getLoginErrorMessage,
  getPostLoginPath,
} from "@/lib/auth/user";
import { LoginForm } from "@/components/LoginForm";
import { RouteTransition } from "@/components/RouteTransition";
import { Badge, Notice, Panel } from "@/components/ui";
import { CalendarIcon, LogIcon, ManageIcon } from "@/components/ui/icons";
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
    <div className="relative flex min-h-screen items-center overflow-hidden py-10 sm:py-14">
      <div
        className="pointer-events-none absolute -left-20 top-14 h-72 w-72 rounded-full bg-[var(--brand-500)]/12 blur-3xl animate-blob-1"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-[var(--info)]/10 blur-3xl animate-blob-2"
      />
      <div className="app-container">
        <RouteTransition
          className="mx-auto max-w-[1180px]"
          transitionKey="login"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,460px)] lg:items-stretch">
            <Panel
              className="relative overflow-hidden border-white/65 p-8 sm:p-10 lg:p-12"
              variant="elevated"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(17,122,108,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(42,111,170,0.08),transparent_28%)]" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="space-y-5">
                  <Badge tone="primary">FleetTime</Badge>
                  <div className="space-y-3">
                    <p className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-[3.5rem]">
                      <span className="text-[var(--brand-500)]">Fleet</span>Time
                    </p>
                    <h1 className="max-w-2xl text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-[3.2rem]">
                      Scheduling and approvals for shared vehicles.
                    </h1>
                    <p className="max-w-xl text-[15px] leading-6 text-[var(--text-secondary)]">
                      Book vehicles, review requests, and manage policy.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-600)]">
                      <CalendarIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                      Clear schedule
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      Availability and booking windows stay readable.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--info-soft)] text-[var(--info)]">
                      <ManageIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                      Faster approvals
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      Review requests and apply policy quickly.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--success-soft)] text-[var(--success)]">
                      <LogIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                      Clear activity
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      Logs and status signals stay close at hand.
                    </p>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              className="overflow-hidden border-white/72 p-8 shadow-[0_26px_70px_rgba(15,23,42,0.12)] sm:p-10"
              variant="elevated"
            >
              <div className="mb-8 flex flex-col gap-3">
                <Badge className="w-fit" tone="neutral">
                  Secure sign in
                </Badge>
                <div>
                  <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                    Sign in
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Access schedules, requests, and admin tools.
                  </p>
                </div>
              </div>

              {errorMessage ? (
                <Notice className="mb-6" tone="danger">
                  {errorMessage}
                </Notice>
              ) : null}

              <LoginForm formAction={logInWithName} />
            </Panel>
          </div>
        </RouteTransition>
      </div>
    </div>
  );
}
