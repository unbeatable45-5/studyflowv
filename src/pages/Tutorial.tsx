import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GraduationCap, Lightbulb, FileText, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Lightbulb,
    title: "1. Quick Study Helper",
    desc: "Type any topic — get a concise explanation plus 3 practice questions with answers.",
    example: 'Try typing "Photosynthesis" or "Supply and Demand"',
    to: "/study",
    color: "text-primary",
  },
  {
    icon: FileText,
    title: "2. Mini Note Organizer",
    desc: "Paste your messy lecture notes — get organized bullet points, key terms, and headings.",
    example: "Paste raw class notes and hit Organize",
    to: "/notes",
    color: "text-success",
  },
  {
    icon: CalendarDays,
    title: "3. Revision Planner",
    desc: "Add your courses, optional exam dates, and preferred study hours — get a daily/weekly plan.",
    example: "Add 3 courses with exam dates and set 4 hours/day",
    to: "/planner",
    color: "text-warning",
  },
];

const Tutorial = () => {
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold">Getting Started</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Learn how to use Student Hub in 3 simple steps.
        </p>
      </div>

      {/* Optional context */}
      <Card className="p-4 space-y-3 bg-accent/50 border-accent">
        <p className="text-sm font-medium text-accent-foreground">Personalize your experience (optional)</p>
        <div className="grid gap-2">
          <Input placeholder="University / Institution" value={university} onChange={(e) => setUniversity(e.target.value)} />
          <Input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          <Input placeholder="Subject / Course" value={course} onChange={(e) => setCourse(e.target.value)} />
        </div>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map(({ icon: Icon, title, desc, example, to, color }) => (
          <Card key={to} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${color}`} />
                <h3 className="font-display font-semibold">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{desc}</p>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Example</p>
                <p className="text-sm">{example}</p>
                {university && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tailored for: {[university, department, course].filter(Boolean).join(" → ")}
                  </p>
                )}
              </div>
              <Link to={to}>
                <Button variant="outline" size="sm" className="gap-1.5 mt-1">
                  Try it now <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Tutorial;
