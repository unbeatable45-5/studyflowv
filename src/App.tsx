import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PremiumProvider } from "./contexts/PremiumContext";
import AppLayout from "./components/AppLayout";
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
import LectureCapture from "./pages/LectureCapture";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
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
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/pdf-builder" element={<CustomPdfBuilder />} />
              <Route path="/organizer" element={<StudyOrganizer />} />
              <Route path="/study-mode" element={<StudyMode />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/spaced-review" element={<SpacedReview />} />
              <Route path="/lecture-capture" element={<LectureCapture />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
