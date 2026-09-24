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
        size="icon"
        className={cn(
          "h-8 w-8 shadow-none hover:translate-y-0 hover:shadow-none",
          !isDark ? "bg-primary/10 text-primary" : "text-muted-foreground",
        )}
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        aria-label="Usar fundo normal"
        title="Fundo normal"
      >
        <Sun className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shadow-none hover:translate-y-0 hover:shadow-none",
          isDark ? "bg-primary/10 text-primary" : "text-muted-foreground",
        )}
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        aria-label="Usar fundo escuro"
        title="Fundo escuro"
      >
        <Moon className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}