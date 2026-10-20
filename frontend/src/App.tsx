import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Overview } from './pages/Overview';
import { RiskPrediction } from './pages/RiskPrediction';
import { UploadData } from './pages/UploadData';
import { ModelPerformance } from './pages/ModelPerformance';
import { DataExplorer } from './pages/DataExplorer';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="predict" element={<RiskPrediction />} />
          <Route path="upload" element={<UploadData />} />
          <Route path="performance" element={<ModelPerformance />} />
          <Route path="explorer" element={<DataExplorer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
