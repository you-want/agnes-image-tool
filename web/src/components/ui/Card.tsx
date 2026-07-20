import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, padded = true, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border p-6",
        "transition-all duration-200",
        className,
      )}
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
      {...props}
    >
      {children}
    </div>
  );
});

export default Card;
