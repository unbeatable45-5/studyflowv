import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

interface AppearanceSettingsProps {
  dark: boolean;
  setDark: (v: boolean) => void;
}

const AppearanceSettings = ({ dark, setDark }: AppearanceSettingsProps) => {
  const handleToggle = (checked: boolean) => {
    setDark(checked);
    document.documentElement.classList.toggle("dark", checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Appearance</CardTitle>
        <CardDescription>Customize how StudyFlow looks.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-muted">
              {dark ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-warning" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Dark mode</p>
              <p className="text-xs text-muted-foreground">{dark ? "Dark theme active" : "Light theme active"}</p>
            </div>
          </div>
          <Switch checked={dark} onCheckedChange={handleToggle} />
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
