import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://studyflowv.lovable.app";

type Meta = { title: string; description: string };

const META: Record<string, Meta> = {
  "/": {
    title: "StudyFlow Dashboard — Your AI Study Companion",
    description: "Your personalized study dashboard. Track progress, continue lessons, and access AI-powered tools to study smarter every day.",
  },
  "/landing": {
    title: "StudyFlow — Turn Slides & Notes Into Practice Exams",
    description: "StudyFlow transforms lecture slides and notes into flashcards, practice exams, mind maps, and summaries powered by AI.",
  },
  "/login": {
    title: "Log In — StudyFlow",
    description: "Log in to StudyFlow to access your AI study tools, practice exams, flashcards, and revision plans.",
  },
  "/signup": {
    title: "Sign Up Free — StudyFlow",
    description: "Create a free StudyFlow account and start turning your notes into practice exams, flashcards, and summaries in seconds.",
  },
  "/forgot-password": {
    title: "Reset Password — StudyFlow",
    description: "Forgot your password? Reset it and get back to studying with StudyFlow in under a minute.",
  },
  "/reset-password": {
    title: "Set a New Password — StudyFlow",
    description: "Choose a new password for your StudyFlow account and continue your study sessions.",
  },
  "/study": {
    title: "Quick Study Helper — StudyFlow",
    description: "Get instant AI explanations, summaries, and answers to study questions across any subject.",
  },
  "/notes": {
    title: "Note Organizer — StudyFlow",
    description: "Turn messy notes into clean, organized study material. AI-powered structuring and summarization.",
  },
  "/planner": {
    title: "Revision Planner — StudyFlow",
    description: "Build a personalized revision plan with Learn, Practice, and Test cycles tailored to your exam date.",
  },
  "/flashcards": {
    title: "Flashcard Generator — StudyFlow",
    description: "Generate study flashcards instantly from your notes, slides, or PDFs with AI.",
  },
  "/practice-exam": {
    title: "Practice Exam — StudyFlow",
    description: "Generate MCQ, fill-in-the-blank, and theory practice exams from your study material. Track scores and weak topics.",
  },
  "/mind-map": {
    title: "Mind Map Builder — StudyFlow",
    description: "Visualize topics and connections with an interactive AI-assisted mind map builder.",
  },
  "/ai-tutor": {
    title: "AI Tutor — StudyFlow",
    description: "Chat with an AI tutor that explains concepts, solves problems, and adapts to how you learn.",
  },
  "/pdf-summarizer": {
    title: "PDF Summarizer — StudyFlow",
    description: "Upload any PDF and get a clear AI summary with the key points you need to know.",
  },
  "/pdf-builder": {
    title: "Custom PDF Builder — StudyFlow",
    description: "Build branded, polished study PDFs from your AI-generated notes and summaries.",
  },
  "/pdf-export": {
    title: "Export PDF — StudyFlow",
    description: "Export your study outputs as shareable, branded PDF documents.",
  },
  "/pdf-viewer": {
    title: "PDF Viewer — StudyFlow",
    description: "View and interact with your study PDFs alongside AI tools.",
  },
  "/history": {
    title: "Study History — StudyFlow",
    description: "Browse every AI study output you've created — summaries, flashcards, plans, and more.",
  },
  "/organizer": {
    title: "Study Organizer — StudyFlow",
    description: "Organize subjects, materials, and study sessions in one place.",
  },
  "/study-mode": {
    title: "Study Mode — StudyFlow",
    description: "Focused study mode with AI tools available alongside your material.",
  },
  "/reminders": {
    title: "Reminders — StudyFlow",
    description: "Set study reminders and never miss a revision session.",
  },
  "/progress": {
    title: "Progress & Analytics — StudyFlow",
    description: "Visualize your study streak, time invested, and topic mastery with a monthly calendar heatmap.",
  },
  "/pomodoro": {
    title: "Pomodoro Focus Timer — StudyFlow",
    description: "Run focused Pomodoro study sessions with a global timer and built-in break alarms.",
  },
  "/profile": {
    title: "Settings & Profile — StudyFlow",
    description: "Manage your StudyFlow profile, notifications, appearance, and account settings.",
  },
  "/spaced-review": {
    title: "Spaced Review — StudyFlow",
    description: "Review flashcards on a spaced-repetition schedule designed to maximize retention.",
  },
  "/subscription": {
    title: "Subscription & Plans — StudyFlow",
    description: "Upgrade to StudyFlow Pro for unlimited practice exams, AI tutor sessions, and study tools.",
  },
  "/tutorial": {
    title: "Tutorial — StudyFlow",
    description: "Learn how to get the most out of StudyFlow's AI study tools in a few short steps.",
  },
};

const DEFAULT_META: Meta = {
  title: "StudyFlow — Your AI Study Companion",
  description: "AI-powered study tools to turn notes, slides, and PDFs into practice exams, flashcards, and revision plans.",
};

export default function SEO() {
  const { pathname } = useLocation();
  const meta = META[pathname] ?? DEFAULT_META;
  const canonical = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
}
