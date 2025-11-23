import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  logoUrl: string | null;
  companyName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

export const CompanyLogo = ({
  logoUrl,
  companyName,
  size = "md",
  className,
  showFallback = true,
}: CompanyLogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`Logo ${companyName}`}
        className={cn("object-contain", sizeClasses[size], className)}
        onError={(e) => {
          if (showFallback) {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }
        }}
      />
    );
  }

  if (!showFallback) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-primary/10 text-primary font-bold",
        sizeClasses[size],
        className
      )}
    >
      {companyName ? (
        <span className={size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"}>
          {getInitials(companyName)}
        </span>
      ) : (
        <Building2 className={cn("text-primary/60", iconSizes[size])} />
      )}
    </div>
  );
};