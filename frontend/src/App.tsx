import { Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { CandidatePage } from "@/pages/CandidatePage";
import { MatrixPage } from "@/pages/MatrixPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/candidate/:symbol" element={<CandidatePage />} />
        <Route path="/matrix" element={<MatrixPage />} />
      </Route>
    </Routes>
  );
}
