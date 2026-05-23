import { useEffect } from 'react'; // Importamos useEffect
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import StatsDashboard from './sections/StatsDashboard';
import NewsGrid from './sections/NewsGrid';
import Inventory from './sections/Inventory'; 
import DataInsights from './sections/DataInsights';
import Footer from './components/Footer';

// Componente de utilidad para resetear el scroll al inicio
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const DashboardPrincipal = () => (
  <>
    <Hero />
    <StatsDashboard />
    <main className="container mx-auto py-8">
      <h2 className="text-white text-2xl font-bold mb-6 px-6 italic tracking-tight uppercase">
        Activity <span className="text-blue-500 font-light">Logs</span>
      </h2>
      <NewsGrid />
    </main>
  </>
);

function App() {
  return (
    <Router>
      <ScrollToTop /> {/* Esto hace que la página siempre inicie arriba al navegar */}
      <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-blue-500/30">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<DashboardPrincipal />} />
          <Route path="/analytics" element={<DataInsights />} />
          <Route path="/inventory" element={<Inventory />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;