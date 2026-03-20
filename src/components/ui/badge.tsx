import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants
        operational:
          "border-green-500/30 bg-green-500/10 text-green-400",
        degraded:
          "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        outage:
          "border-red-500/30 bg-red-500/10 text-red-400",
        unknown:
          "border-slate-500/30 bg-slate-500/10 text-slate-400",
        // Severity variants
        critical:
          "border-red-500/40 bg-red-500/15 text-red-400 font-bold",
        high:
          "border-orange-500/40 bg-orange-500/15 text-orange-400",
        medium:
          "border-yellow-500/40 bg-yellow-500/15 text-yellow-400",
        low:
          "border-green-500/40 bg-green-500/15 text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
