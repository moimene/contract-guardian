import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import NewAnalysis from "./pages/NewAnalysis";
import ContractReview from "./pages/ContractReview";
import Escalations from "./pages/Escalations";
import ConfigPlaybooks from "./pages/ConfigPlaybooks";
import ConfigKnowledgeGraph from "./pages/ConfigKnowledgeGraph";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new" element={<NewAnalysis />} />
            <Route path="/review/:documentId" element={<ContractReview />} />
            <Route path="/escalations" element={<Escalations />} />
            <Route path="/config/playbooks" element={<ConfigPlaybooks />} />
            <Route path="/config/knowledge-graph" element={<ConfigKnowledgeGraph />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
