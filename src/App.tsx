import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { CookieBanner } from "@/components/CookieBanner";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import AppShell from "./components/AppShell";
const Home = lazy(() => import("./pages/Home"));
import NotFound from "./pages/NotFound";

const Termini = lazy(() => import("./pages/Termini"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicy"));

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Nuova = lazy(() => import("./pages/Nuova"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Candidature = lazy(() => import("./pages/Candidature"));
const Impostazioni = lazy(() => import("./pages/Impostazioni"));
const CVEdit = lazy(() => import("./pages/CVEdit"));
const CandidaturaDetail = lazy(() => import("./pages/CandidaturaDetail"));
const DevTest = lazy(() => import("./pages/DevTest"));
const Faq = lazy(() => import("./pages/Faq"));
const LinkedInCard = lazy(() => import("./pages/LinkedInCard"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/termini" element={<Suspense fallback={<PageSkeleton />}><Termini /></Suspense>} />
              <Route path="/privacy" element={<Suspense fallback={<PageSkeleton />}><PrivacyPage /></Suspense>} />
              <Route path="/cookie-policy" element={<Suspense fallback={<PageSkeleton />}><CookiePolicyPage /></Suspense>} />
              <Route path="/" element={<Landing />} />
              <Route path="/linkedin-card" element={<Suspense fallback={<PageSkeleton />}><LinkedInCard /></Suspense>} />
              <Route
                path="/upgrade"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageSkeleton />}><Upgrade /></Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageSkeleton />}><Onboarding /></Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="home" element={<Suspense fallback={<PageSkeleton />}><Home /></Suspense>} />
                <Route path="nuova" element={<Suspense fallback={<PageSkeleton />}><Nuova /></Suspense>} />
                <Route path="candidature" element={<Suspense fallback={<PageSkeleton />}><Candidature /></Suspense>} />
                <Route path="impostazioni" element={<Suspense fallback={<PageSkeleton />}><Impostazioni /></Suspense>} />
                <Route path="cv-edit" element={<Suspense fallback={<PageSkeleton />}><CVEdit /></Suspense>} />
                <Route path="candidatura/:id" element={<Suspense fallback={<PageSkeleton />}><CandidaturaDetail /></Suspense>} />
                <Route path="faq" element={<Suspense fallback={<PageSkeleton />}><Faq /></Suspense>} />
                {import.meta.env.DEV && (
                  <Route path="dev-test" element={<Suspense fallback={null}><DevTest /></Suspense>} />
                )}
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieBanner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
