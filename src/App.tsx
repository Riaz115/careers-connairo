import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import Index from "./pages/Index";
import ApplyJobPage from "./pages/ApplyJobPage";
import AppliedJobsPage from "./pages/AppliedJobsPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import ProfilePage from "./pages/ProfilePage";
import JobDetailsPage from "./pages/JobDetailsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { isProfileComplete, isLoggedIn, isLoading } = useApp();
  const location = useLocation();

  const authPaths = ["/login", "/signup", "/verify-email"];
  const isAuthPage = authPaths.some((p) => location.pathname.startsWith(p));

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  const publicPaths = ["/profile", "/login", "/signup", "/verify-email"];
  const isPublic = publicPaths.some((p) => location.pathname.startsWith(p));

  if (isLoggedIn && !isProfileComplete && !isPublic) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <ProfileGuard>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<Index />} />
        <Route path="/job/:jobId" element={<JobDetailsPage />} />
        <Route path="/apply" element={<ApplyJobPage />} />
        <Route path="/apply/:jobId" element={<ApplyJobPage />} />
        <Route path="/applied" element={<AppliedJobsPage />} />
        <Route path="/saved" element={<SavedJobsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ProfileGuard>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
