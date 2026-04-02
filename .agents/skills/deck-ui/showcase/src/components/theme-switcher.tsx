import { Palette } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@deck-ui/core";

const THEMES = [
  { id: "default", label: "Default", className: "" },
  { id: "red", label: "Lobster Red", className: "theme-red" },
  { id: "orange", label: "YC Orange", className: "theme-orange" },
] as const;

export function ThemeSwitcher() {
  const applyTheme = (className: string) => {
    const html = document.documentElement;
    html.classList.remove("theme-red", "theme-orange");
    if (className) {
      html.classList.add(className);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Change theme">
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => applyTheme(theme.className)}
          >
            {theme.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
