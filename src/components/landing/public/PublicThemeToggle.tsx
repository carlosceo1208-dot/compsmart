import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublicThemeToggleProps {
  className?: string;
}

export function PublicThemeToggle({ className }: PublicThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-md border border-border bg-background p-0.5",
        className,
      )}
      role="group"
      aria-label="Escolher fundo do site"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-2.5 shadow-none hover:translate-y-0 hover:shadow-none",
          !isDark ? "bg-primary/10 text-primary" : "text-muted-foreground",
        )}
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
      >
        <Sun className="h-3.5 w-3.5" />
        Normal
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-2.5 shadow-none hover:translate-y-0 hover:shadow-none",
          isDark ? "bg-primary/10 text-primary" : "text-muted-foreground",
        )}
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
      >
        <Moon className="h-3.5 w-3.5" />
        Dark
      </Button>
    </div>
  );
}