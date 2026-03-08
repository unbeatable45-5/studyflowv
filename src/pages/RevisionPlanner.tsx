import { useState } from "react";
import { Input } from "@/components/ui/input";
import { saveOutput } from "@/lib/saved-outputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import OutputActions from "@/components/OutputActions";
import { streamAI } from "@/lib/streaming";
import { CalendarDays, Loader2, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Course {
  name: string;
  examDate: Date | undefined;
  unknownDate: boolean;
}

const RevisionPlanner = () => {
  const [courses, setCourses] = useState<Course[]>([
    { name: "", examDate: undefined, unknownDate: false },
  ]);
  const [hours, setHours] = useState([3]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const addCourse = () => setCourses([...courses, { name: "", examDate: undefined, unknownDate: false }]);

  const removeCourse = (i: number) => {
    if (courses.length <= 1) return;
    setCourses(courses.filter((_, idx) => idx !== i));
  };

  const updateCourse = (i: number, updates: Partial<Course>) => {
    setCourses(courses.map((c, idx) => (idx === i ? { ...c, ...updates } : c)));
  };

  const handleGenerate = async () => {
    const validCourses = courses.filter((c) => c.name.trim());
    if (validCourses.length === 0) return;

    setLoading(true);
    setOutput("");

    const courseData = validCourses.map((c) => ({
      name: c.name,
      examDate: c.unknownDate ? "Unknown" : c.examDate ? format(c.examDate, "yyyy-MM-dd") : "Unknown",
    }));

    let fullText = "";
    await streamAI({
      functionName: "revision-planner",
      body: { courses: courseData, hoursPerDay: hours[0] },
      onDelta: (text) => {
        fullText += text;
        setOutput(fullText);
      },
      onDone: () => {
        setLoading(false);
        saveOutput("revision-planner", { courses: courseData, hoursPerDay: hours[0] }, fullText);
      },
      onError: (err) => {
        setLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  const hasValidCourses = courses.some((c) => c.name.trim());

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-warning/10 rounded-lg p-2">
            <CalendarDays className="h-5 w-5 text-warning" />
          </div>
          <h1 className="text-xl font-display font-bold">Revision Planner</h1>
        </div>
        <p className="text-sm text-muted-foreground">Add your courses and get a personalized study schedule.</p>
      </div>

      {/* Courses */}
      <div className="space-y-3">
        <Label className="font-medium">Courses</Label>
        {courses.map((course, i) => (
          <Card key={i} className="p-3 space-y-3">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Course name"
                value={course.name}
                onChange={(e) => updateCourse(i, { name: e.target.value })}
                disabled={loading}
                className="flex-1"
              />
              {courses.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeCourse(i)} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`unknown-${i}`}
                  checked={course.unknownDate}
                  onCheckedChange={(checked) =>
                    updateCourse(i, { unknownDate: !!checked, examDate: checked ? undefined : course.examDate })
                  }
                />
                <Label htmlFor={`unknown-${i}`} className="text-sm text-muted-foreground">
                  Date unknown
                </Label>
              </div>

              {!course.unknownDate && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("text-xs", !course.examDate && "text-muted-foreground")}
                    >
                      <CalendarDays className="h-3.5 w-3.5 mr-1" />
                      {course.examDate ? format(course.examDate, "MMM d, yyyy") : "Exam date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={course.examDate}
                      onSelect={(date) => updateCourse(i, { examDate: date })}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </Card>
        ))}

        <Button variant="outline" size="sm" onClick={addCourse} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </div>

      {/* Hours */}
      <div className="space-y-3">
        <Label className="font-medium">Study hours per day: {hours[0]}h</Label>
        <Slider value={hours} onValueChange={setHours} min={1} max={12} step={0.5} />
      </div>

      <Button onClick={handleGenerate} disabled={loading || !hasValidCourses} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Generate Study Plan
      </Button>

      {loading && !output && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}

      {output && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Your Study Plan</CardTitle>
              <OutputActions text={output} title="Revision Plan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {output}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RevisionPlanner;
