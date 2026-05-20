import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import DocumentsPage from './pages/DocumentsPage';
import ClaimsPage from './pages/ClaimsPage';
import SourceCorporaPage from './pages/SourceCorporaPage';
import GroundingReportsPage from './pages/GroundingReportsPage';
import SignaturesPage from './pages/SignaturesPage';
import RedactionLogsPage from './pages/RedactionLogsPage';
import AIExtractClaimsPage from './pages/AIExtractClaimsPage';
import AIGroundClaimsPage from './pages/AIGroundClaimsPage';
import AIGroundingReportPage from './pages/AIGroundingReportPage';
import AIContradictionDetectPage from './pages/AIContradictionDetectPage';
import AIParaphraseLinkPage from './pages/AIParaphraseLinkPage';
import AISourceDeduplicatePage from './pages/AISourceDeduplicatePage';
import AIEntailmentScorePage from './pages/AIEntailmentScorePage';
import PdfViewerWorkbench from './pages/PdfViewerWorkbench';
import MerkleViewerWorkbench from './pages/MerkleViewerWorkbench';
import CustomViewsPage from './pages/CustomViewsPage';
import { getToken } from './services/api';
import './App.css';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function Shell() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/claims" element={<ClaimsPage />} />
            <Route path="/source-corpora" element={<SourceCorporaPage />} />
            <Route path="/grounding-reports" element={<GroundingReportsPage />} />
            <Route path="/signatures" element={<SignaturesPage />} />
            <Route path="/redaction-logs" element={<RedactionLogsPage />} />
            <Route path="/ai/extract-claims" element={<AIExtractClaimsPage />} />
            <Route path="/ai/ground-claims" element={<AIGroundClaimsPage />} />
            <Route path="/ai/grounding-report" element={<AIGroundingReportPage />} />
            <Route path="/ai/contradiction-detect" element={<AIContradictionDetectPage />} />
            <Route path="/ai/paraphrase-link" element={<AIParaphraseLinkPage />} />
            <Route path="/ai/source-deduplicate" element={<AISourceDeduplicatePage />} />
            <Route path="/ai/entailment-score" element={<AIEntailmentScorePage />} />
            <Route path="/wb/pdf-viewer" element={<PdfViewerWorkbench />} />
            <Route path="/wb/merkle-viewer" element={<MerkleViewerWorkbench />} />
            <Route path="/custom-views" element={<CustomViewsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
      </Routes>
    </Router>
  );
}
