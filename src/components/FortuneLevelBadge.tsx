import { cn } from "@/lib/utils";
import { FortuneLevel } from "@/types/fortune";
import { getFortuneLevelClasses } from "@/lib/fortune-utils";

interface FortuneLevelBadgeProps {
  level: FortuneLevel;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FortuneLevelBadge({ level, size = "md", className }: FortuneLevelBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold transition-all",
        getFortuneLevelClasses(level),
        sizeClasses[size],
        className
      )}
    >
      {level}
    </span>
  );
}
