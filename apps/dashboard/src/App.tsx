import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { DesktopOnlyOverlay } from "@/components/DesktopOnlyOverlay";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";
import MedicalProviders from "./pages/MedicalProviders";
import CaseProviders from "./pages/CaseProviders";
import Mailboxes from "./pages/Mailboxes";
import Domains from "./pages/Domains";
import Mails from "./pages/Mails";
import MailsOldArchitecture from "./pages/MailsOldArchitecture";
import MedicalCasesPage from "./pages/MedicalCasesPage";
import TransportationPage from "./pages/TransportationPage";
import NewAssistanceRequestPage from "./pages/NewAssistanceRequestPage";
import MedicalCaseDetailPage from "./pages/MedicalCaseDetailPage";
import TransportAssistanceDetailPage from "./pages/TransportAssistanceDetailPage";
import MedicalProviderView from "./pages/MedicalProviderView";
import CaseProviderView from "./pages/CaseProviderView";
import CaseProviderFormPage from "./pages/CaseProviderFormPage";
import MedicalProviderFormPage from "./pages/MedicalProviderFormPage";

const queryClient = new QueryClient();

function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("fake-signed-in") === "true";
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isSignedIn()) {
    return <Navigate to="/sign-in" replace />;
  }
  return <>{children}</>;
}

function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  if (isSignedIn()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <DesktopOnlyOverlay />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <NuqsAdapter>
            <Routes>
              <Route path="/sign-in" element={<GuestOnlyRoute><SignIn /></GuestOnlyRoute>} />
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route
                        path="/medical-providers"
                        element={<MedicalProviders />}
                      />
                      <Route
                        path="/medical-providers/new"
                        element={<MedicalProviderFormPage />}
                      />
                      <Route
                        path="/medical-providers/:id/edit"
                        element={<MedicalProviderFormPage />}
                      />
                      <Route
                        path="/medical-providers/:id"
                        element={<MedicalProviderView />}
                      />
                      <Route
                        path="/case-providers"
                        element={<CaseProviders />}
                      />
                      <Route
                        path="/case-providers/new"
                        element={<CaseProviderFormPage />}
                      />
                      <Route
                        path="/case-providers/:id/edit"
                        element={<CaseProviderFormPage />}
                      />
                      <Route
                        path="/case-providers/:id"
                        element={<CaseProviderView />}
                      />
                      <Route path="/mailboxes" element={<Mailboxes />} />
                      <Route path="/domains" element={<Domains />} />
                      <Route path="/mails/:threadId?" element={<Mails />} />
                      <Route
                        path="/mails-old-architecture/:emailId?"
                        element={<MailsOldArchitecture />}
                      />
                      <Route
                        path="/assistance-requests"
                        element={
                          <Navigate
                            to="/assistance-requests/transportation"
                            replace
                          />
                        }
                      />
                      <Route
                        path="/assistance-requests/medical-cases"
                        element={<MedicalCasesPage />}
                      />
                      <Route
                        path="/assistance-requests/medical-cases/:id"
                        element={<MedicalCaseDetailPage />}
                      />
                      <Route
                        path="/assistance-requests/new"
                        element={<NewAssistanceRequestPage />}
                      />
                      <Route
                        path="/assistance-requests/transportation"
                        element={<TransportationPage />}
                      />
                      <Route
                        path="/assistance-requests/transportation/:id"
                        element={<TransportAssistanceDetailPage />}
                      />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </NuqsAdapter>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
