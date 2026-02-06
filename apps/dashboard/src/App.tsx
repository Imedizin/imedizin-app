import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MedicalProviders from "./pages/MedicalProviders";
import CaseProviders from "./pages/CaseProviders";
import Mailboxes from "./pages/Mailboxes";
import Domains from "./pages/Domains";
import Mails from "./pages/Mails";
import MailsOldArchitecture from "./pages/MailsOldArchitecture";
import TransportationRequests from "./pages/TransportationRequests";
import TransportationRequestView from "./pages/TransportationRequestView";
import MedicalProviderView from "./pages/MedicalProviderView";
import CaseProviderView from "./pages/CaseProviderView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
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
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/medical-providers" element={<MedicalProviders />} />
                  <Route
                    path="/medical-providers/:id"
                    element={<MedicalProviderView />}
                  />
                  <Route path="/case-providers" element={<CaseProviders />} />
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
                    path="/transportation-requests"
                    element={<TransportationRequests />}
                  />
                  <Route
                    path="/transportation-requests/:id"
                    element={<TransportationRequestView />}
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DashboardLayout>
          </NuqsAdapter>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
