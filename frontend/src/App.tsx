import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SelectionPage from './pages/SelectionPage';
import StatsPage from './pages/StatsPage';
import Header from './components/Header';

// 🔍 Ajout : test environment variables
import pb from './config/pocketbase';
console.log("VITE_POCKETBASE_URL =", import.meta.env.VITE_POCKETBASE_URL);
console.log("PocketBase baseUrl =", pb.baseUrl);

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/selection" element={<SelectionPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

