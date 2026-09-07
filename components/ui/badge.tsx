import * as React from "react";
import { cn } from "@/lib/cn";

const variants: Record<string, string> = {
  default: "bg-slate-100 text-slate-800",
  info: "bg-blue-100 text-blue-900",
  success: "bg-green-100 text-green-900",
  warning: "bg-orange-100 text-orange-900",
  danger: "bg-red-100 text-red-900",
};

export function Badge({
  className,
  tone = "default",
  children,
}: {
  className?: string;
  tone?: keyof typeof variants;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-red-700">
      {message}
    </p>
  );
}
