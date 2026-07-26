import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PremiumProvider } from "./contexts/PremiumContext";
import { TimerProvider } from "./contexts/TimerContext";
import AppLayout from "./components/AppLayout";
import PageSkeleton from "./components/PageSkeleton";
import SEO from "./components/SEO";
import Index from "./pages/Index";
import Profile from "@/pages/Profile";
import StudyHelper from "./pages/StudyHelper";
import NoteOrganizer from "./pages/NoteOrganizer";
import RevisionPlanner from "./pages/RevisionPlanner";
import FlashcardGenerator from "./pages/FlashcardGenerator";
import PdfExport from "./pages/PdfExport";
import PdfSummarizer from "./pages/PdfSummarizer";
import HistoryPage from "./pages/HistoryPage";
import CustomPdfBuilder from "./pages/CustomPdfBuilder";
import StudyOrganizer from "./pages/StudyOrganizer";
import StudyMode from "./pages/StudyMode";
import Reminders from "./pages/Reminders";
import Progress from "./pages/Progress";
import Pomodoro from "./pages/Pomodoro";
import Tutorial from "./pages/Tutorial";
import SpacedReview from "./pages/SpacedReview";
import Subscription from "./pages/Subscription";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import MindMap from "./pages/MindMap";
import AiTutor from "./pages/AiTutor";
import PracticeExam from "./pages/PracticeExam";
import Landing from "./pages/Landing";
import PdfViewer from "./pages/PdfViewer";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton variant="default" />;
  if (user) {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    const target = next && next.startsWith("/") && !next.startsWith("//") ? decodeURIComponent(next) : "/";
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PremiumProvider>
            <TimerProvider>
              <SEO />
              <Routes>
                <Route path="/landing" element={<Landing />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Index />} />
                  <Route path="/study" element={<StudyHelper />} />
                  <Route path="/notes" element={<NoteOrganizer />} />
                  <Route path="/planner" element={<RevisionPlanner />} />
                  <Route path="/tutorial" element={<Tutorial />} />
                  <Route path="/flashcards" element={<FlashcardGenerator />} />
                  <Route path="/pdf-export" element={<PdfExport />} />
                  <Route path="/pdf-summarizer" element={<PdfSummarizer />} />
                  <Route path="/pdf-viewer" element={<PdfViewer />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/pdf-builder" element={<CustomPdfBuilder />} />
                  <Route path="/organizer" element={<StudyOrganizer />} />
                  <Route path="/study-mode" element={<StudyMode />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/pomodoro" element={<Pomodoro />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/spaced-review" element={<SpacedReview />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/mind-map" element={<MindMap />} />
                  <Route path="/ai-tutor" element={<AiTutor />} />
                  <Route path="/practice-exam" element={<PracticeExam />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TimerProvider>
          </PremiumProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
