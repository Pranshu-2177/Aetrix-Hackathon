import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RequireAuth from "@/components/auth/RequireAuth";
import AshaWorkersPage from "./pages/AshaWorkersPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import DistrictAdminPage from "./pages/DistrictAdminPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import PatientsPage from "./pages/PatientsPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/patients"
            element={(
              <RequireAuth allow={["patient"]}>
                <PatientsPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/asha-workers"
            element={(
              <RequireAuth allow={["asha"]}>
                <AshaWorkersPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/district-admin"
            element={(
              <RequireAuth allow={["admin"]}>
                <DistrictAdminPage />
              </RequireAuth>
            )}
          />
          <Route path="/chat" element={<Navigate to="/patients" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
