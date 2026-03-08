import { Link } from "react-router-dom";
import { Lightbulb, FileText, CalendarDays, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tools = [
  {
    to: "/study",
    icon: Lightbulb,
    title: "Quick Study Helper",
    description: "Get concise explanations and practice questions on any topic",
    color: "bg-primary/10 text-primary",
  },
  {
    to: "/notes",
    icon: FileText,
    title: "Mini Note Organizer",
    description: "Paste your notes and get organized bullet-point summaries",
    color: "bg-success/10 text-success",
  },
  {
    to: "/planner",
    icon: CalendarDays,
    title: "Revision Planner",
    description: "Create a personalized daily/weekly study schedule",
    color: "bg-warning/10 text-warning",
  },
];

const Index = () => {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground">
          Pick a tool to start studying smarter.
        </p>
      </div>

      {/* Tool Cards */}
      <div className="space-y-3">
        {tools.map(({ to, icon: Icon, title, description, color }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/60 mb-3">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-xl p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tutorial Link */}
      <Link to="/tutorial">
        <Card className="bg-accent border-accent hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl p-3 bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-accent-foreground">Getting Started Tutorial</h3>
              <p className="text-sm text-muted-foreground">Learn how to use Student Hub effectively</p>
            </div>
            <ArrowRight className="h-5 w-5 text-accent-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default Index;
