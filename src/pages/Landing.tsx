import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, FileUp, RotateCcw, ArrowRight, Upload, Sparkles, Timer, CheckCircle2, XCircle, Flame, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn } from "@/components/ui/motion";

const TESTIMONIALS = [
  { quote: "Wow, you made this? I went from cramming to actually understanding my notes.", author: "Adaeze O.", role: "Final-year Med Student", rating: 5 },
  { quote: "This actually helps for exams. The CBT mode feels just like the real thing.", author: "Tunde A.", role: "300L Engineering", rating: 5 },
  { quote: "Turned my 60-slide lecture into 20 sharp questions in seconds. Game changer.", author: "Sarah M.", role: "Law Student", rating: 5 },
  { quote: "I went from 60% to 82% in two weeks of using StudyFlow daily.", author: "Daniel K.", role: "Pharmacy", rating: 5 },
  { quote: "The slide-to-exam feature is unreal. I literally study 2x faster now.", author: "Chiamaka E.", role: "Nursing", rating: 4 },
  { quote: "Finally a study app that respects my time. Quick revision saved my finals.", author: "Ifeanyi U.", role: "Computer Science", rating: 5 },
];

const Landing = () => {
  const { user } = useAuth();
  const ctaTo = user ? "/" : "/signup";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-lg">
            StudyFlow
          </Link>
          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
            )}
            <Link to={ctaTo}>
              <Button size="sm" className="gap-1.5">
                Start <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Flame className="h-3.5 w-3.5" /> Built for students
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight leading-tight">
              Turn Your Lecture Slides Into{" "}
              <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                Exam Questions
              </span>{" "}
              Instantly
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Upload your notes, generate summaries, flashcards and real CBT exams in seconds.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="flex flex-col items-center gap-3 pt-2">
              <Link to={ctaTo}>
                <Button size="lg" className="gap-2 h-12 px-7 text-base rounded-2xl">
                  Start Practicing Now 🔥
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Free to try • Built for students • No stress
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Demo flow */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { icon: Upload, label: "Upload PDF", desc: "Drop your slides or notes", color: "text-primary bg-primary/10" },
                { icon: Sparkles, label: "Generate Questions", desc: "AI builds practice items", color: "text-success bg-success/10" },
                { icon: Timer, label: "Practice CBT Exam", desc: "Timer, score, analysis", color: "text-warning bg-warning/10" },
              ].map(({ icon: Icon, label, desc, color }, i) => (
                <Card key={label} className="relative overflow-hidden">
                  <CardContent className="p-5 flex items-start gap-3">
                    <div className={`rounded-2xl p-3 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">Step {i + 1}</p>
                      <h3 className="font-display font-semibold">{label}</h3>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              From lecture slides → real exam practice in seconds
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20 bg-muted/30 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-bold">Everything you need to ace exams</h2>
            <p className="text-muted-foreground text-sm">Three focused tools. Zero clutter.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: ClipboardList,
                emoji: "🧠",
                title: "Practice Exam",
                desc: "Simulate real CBT exams with timer and scoring.",
                color: "text-primary bg-primary/10",
              },
              {
                icon: FileUp,
                emoji: "📄",
                title: "Upload Slides",
                desc: "Turn your lecture slides into exam questions instantly.",
                color: "text-success bg-success/10",
              },
              {
                icon: RotateCcw,
                emoji: "⚡",
                title: "Quick Revision",
                desc: "Revise faster with summaries, flashcards and quizzes.",
                color: "text-warning bg-warning/10",
              },
            ].map(({ icon: Icon, emoji, title, desc, color }) => (
              <Card key={title} className="border-border/50">
                <CardContent className="p-6 space-y-3">
                  <div className={`rounded-2xl p-3 w-fit ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">{emoji} {title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">
            Most students read and forget. <br />
            <span className="text-primary">StudyFlow makes you practice like the real exam.</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-5 flex flex-col items-center gap-2">
                <XCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm font-semibold">Reading notes</p>
                <p className="text-xs text-muted-foreground">Passive. Forgettable.</p>
              </CardContent>
            </Card>
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-5 flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <p className="text-sm font-semibold">Practicing questions</p>
                <p className="text-xs text-muted-foreground">Active. Sticks.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social proof — rotating testimonials */}
      <TestimonialsCarousel />

      {/* Urgency */}
      <section className="px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-warning/10">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-lg font-display font-bold">🔥 Early Access — Limited Students Only</p>
              <p className="text-sm text-muted-foreground">Join now while it's free to try.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold">Start Studying Smarter Today</h2>
          <p className="text-muted-foreground">Your next exam doesn't stand a chance.</p>
          <Link to={ctaTo}>
            <Button size="lg" className="gap-2 h-12 px-8 text-base rounded-2xl">
              Start Practicing Now 🔥
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 py-6 px-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} StudyFlow • Built for students
        </p>
      </footer>
    </div>
  );
};

export default Landing;
