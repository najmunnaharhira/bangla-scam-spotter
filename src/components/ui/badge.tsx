import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        safe: "bg-safe/15 text-safe dark:bg-safe/20",
        suspicious: "bg-suspicious/20 text-suspicious-foreground dark:bg-suspicious/20",
        scam: "bg-danger/12 text-danger dark:bg-danger/25",
        primary: "bg-primary/12 text-primary dark:bg-primary/25",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
