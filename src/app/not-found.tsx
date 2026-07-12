import { ButtonLink, EmptyState } from "@/components/ui";
import { EmptyStateIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <main className="app-container flex min-h-screen items-center py-10">
      <div className="content-container">
        <EmptyState
          action={
            <ButtonLink href="/vehicles" tone="primary">
              Back to vehicles
            </ButtonLink>
          }
          description="FleetTime could not find that page."
          icon={EmptyStateIcon}
          title="Page not found"
        />
      </div>
    </main>
  );
}
