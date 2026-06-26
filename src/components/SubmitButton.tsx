"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type SubmitButtonProps = Omit<
  ComponentProps<typeof Button>,
  "loading" | "type"
> & {
  pendingLabel?: ReactNode;
};

export function SubmitButton({
  children,
  disabled,
  pendingLabel,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={disabled || pending}
      loading={pending}
      type="submit"
      {...props}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
