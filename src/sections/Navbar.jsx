import { useState } from 'react'; // Importamos useState
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar() {
  const location = useLocation();
  const [showNotice, setShowNotice] = useState(false); // Estado para la notificación

  const isActive = (path) => location.pathname === path;

  // Función para manejar el clic en los links
  const handleLinkClick = (e, path) => {
    if (location.pathname === path) {
      e.preventDefault(); // Evita recargar si ya estás ahí
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube suavemente
      setShowNotice(true); // Muestra la notificación
      setTimeout(() => setShowNotice(false), 2500); // La quita tras 2.5 segundos
    }
  };

  const generateExcelReport = async () => {
    try {
      const { data: servers, error } = await supabase.from('inventory').select('*');
      if (error) throw error;
      if (!servers || servers.length === 0) return alert("No hay datos disponibles para exportar.");

      const headers = ["Nombre del Servidor", "Estado", "Carga (%)", "Uptime"];
      const rows = servers.map(s => [
        s.name,
        s.status,
        `${typeof s.load === 'string' ? s.load.replace('%','') : s.load}%`,
        s.uptime
      ]);

      const csvContent = [
        ["REPORTE GLOBAL DE INFRAESTRUCTURA - NEXUS ANALYTICS"],
        [`Fecha de exportacion: ${new Date().toLocaleString()}`],
        [],
        headers,
        ...rows
      ].map(e => e.join(";")).join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Reporte_Nexus_Global_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error al generar el reporte:", error.message);
      alert("Hubo un error al conectar con la base de datos.");
    }
  };

  return (
    <nav className="bg-[#1E293B] border-b border-slate-700 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
      {/* Branding */}
      <Link 
        to="/" 
        onClick={(e) => handleLinkClick(e, '/')}
        className="flex items-center gap-3 hover:opacity-90 transition-opacity"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-blue-500/20 shadow-lg">
          <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
        </div>
        <span className="font-extrabold text-xl tracking-tight text-white italic">
          NEXUS<span className="text-blue-500 not-italic">ANALYTICS</span>
        </span>
      </Link>
      
      {/* Navegación */}
      <ul className="hidden md:flex gap-8 font-medium text-sm">
        <li>
          <Link 
            to="/" 
            onClick={(e) => handleLinkClick(e, '/')}
            className={`transition-colors ${isActive('/') ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-blue-400'}`}
          >
            DASHBOARD
          </Link>
        </li>
        <li>
          <Link 
            to="/analytics" 
            onClick={(e) => handleLinkClick(e, '/analytics')}
            className={`transition-colors ${isActive('/analytics') ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-blue-400'}`}
          >
            DATA INSIGHTSSSSSS
          </Link>
        </li>
        <li>
          <Link 
            to="/inventory" 
            onClick={(e) => handleLinkClick(e, '/inventory')}
            className={`transition-colors ${isActive('/inventory') ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-blue-400'}`}
          >
            OPERATIONS
          </Link>
        </li>
      </ul>

      {/* Botón de Acción */}
      <div className="flex items-center gap-4">
        <button 
          onClick={generateExcelReport}
          className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest"
        >
          GENERATE REPORT
        </button>
      </div>

      {/* NOTIFICACIÓN TIPO TOAST */}
      {showNotice && (
        <div className="fixed top-24 right-8 z-[100] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl shadow-blue-900/40 border border-blue-400/30 flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em]">
              Sección actual: <span className="opacity-80 font-medium">Ya estás visualizando este módulo</span>
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}