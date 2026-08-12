import { cn } from "@/lib/format";

type BadgeTone = "gray" | "green" | "amber" | "red" | "blue" | "purple";

const toneClasses: Record<BadgeTone, string> = {
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
};

export function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "ACTIVE":
    case "CONFIRMED":
    case "HEALTHY":
    case "IN":
      return "green";
    case "LEAD":
    case "DRAFT":
    case "LOW_STOCK":
      return "amber";
    case "INACTIVE":
    case "CANCELLED":
    case "OUT_OF_STOCK":
    case "OUT":
      return "red";
    default:
      return "gray";
  }
}
