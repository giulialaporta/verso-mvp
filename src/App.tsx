import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Nuova from "./pages/Nuova";
import Candidature from "./pages/Candidature";
import Impostazioni from "./pages/Impostazioni";
import CVEdit from "./pages/CVEdit";
import CandidaturaDetail from "./pages/CandidaturaDetail";
import NotFound from "./pages/NotFound";

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
