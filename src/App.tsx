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
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Nuova = lazy(() => import("./pages/Nuova"));
const Candidature = lazy(() => import("./pages/Candidature"));
const Impostazioni = lazy(() => import("./pages/Impostazioni"));
const CVEdit = lazy(() => import("./pages/CVEdit"));
const CandidaturaDetail = lazy(() => import("./pages/CandidaturaDetail"));
const DevTest = lazy(() => import("./pages/DevTest"));

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
              <Route path="/" element={<Navigate to="/app/home" replace />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
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
                <Route path="home" element={<Home />} />
                <Route path="nuova" element={<Nuova />} />
                <Route path="candidature" element={<Candidature />} />
                <Route path="impostazioni" element={<Impostazioni />} />
                <Route path="cv-edit" element={<CVEdit />} />
                <Route path="candidatura/:id" element={<CandidaturaDetail />} />
                {import.meta.env.DEV && (
                  <Route path="dev-test" element={<Suspense fallback={null}><DevTest /></Suspense>} />
                )}
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
