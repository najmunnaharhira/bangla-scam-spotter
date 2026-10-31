import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEME_KEY = "scamshield-theme";

export function ThemeToggle() {
  const [dark, setDark] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const initial = window.localStorage.getItem(THEME_KEY) === "dark";
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !(prev === true);
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark === true}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
