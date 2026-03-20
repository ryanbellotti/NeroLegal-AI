import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { LegalResearch } from './pages/LegalResearch';
import { DeepAnalysis } from './pages/DeepAnalysis';
import { VoiceConsultation } from './pages/VoiceConsultation';
import { CaseAnalyzer } from './pages/CaseAnalyzer';
import { LocalResources } from './pages/LocalResources';
import { QuickQA } from './pages/QuickQA';
import { DocumentDrafter } from './pages/DocumentDrafter';
import { Chatbot } from './pages/Chatbot';
import { MasterDocumentAnalyzer } from './pages/MasterDocumentAnalyzer';
import { AdvancedCaseAnalysis } from './pages/AdvancedCaseAnalysis';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="research" element={<LegalResearch />} />
        <Route path="master-analyzer" element={<MasterDocumentAnalyzer />} />
        <Route path="case-strategy" element={<AdvancedCaseAnalysis />} />
        <Route path="deep" element={<DeepAnalysis />} />
        <Route path="voice" element={<VoiceConsultation />} />
        <Route path="analyze" element={<CaseAnalyzer />} />
        <Route path="local" element={<LocalResources />} />
        <Route path="quick" element={<QuickQA />} />
        <Route path="draft" element={<DocumentDrafter />} />
        <Route path="chat" element={<Chatbot />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
