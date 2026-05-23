import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const [activeModal, setActiveModal] = useState(null); // 'status', 'security' o null

  const handleScrollToTop = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0B1120] border-t border-slate-800 pt-16 pb-8 px-6 md:px-12 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          
          {/* Columna 1: Branding */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded shadow-lg shadow-blue-600/20"></div>
              <span className="text-white font-bold tracking-tighter text-lg italic uppercase">
                NEXUS <span className="text-blue-500 not-italic font-light">ANALYTICS</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Plataforma líder en monitoreo de infraestructura crítica y análisis de datos en tiempo real para entornos empresariales.
            </p>
          </div>

          {/* Columna 2: Plataforma */}
          <div>
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-[0.2em] opacity-80">Plataforma</h4>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li>
                <Link to="/" onClick={() => handleScrollToTop('/')} className="hover:text-blue-400 transition-colors uppercase tracking-wider">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" onClick={() => handleScrollToTop('/analytics')} className="hover:text-blue-400 transition-colors uppercase tracking-wider">
                  Data Insights
                </Link>
              </li>
              <li>
                <Link to="/inventory" onClick={() => handleScrollToTop('/inventory')} className="hover:text-blue-400 transition-colors uppercase tracking-wider">
                  Operations
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Soporte (AHORA CON MODALES) */}
          <div>
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-[0.2em] opacity-80">Soporte Técnico</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li className="hover:text-blue-400 cursor-pointer transition-colors">
                <a href="https://github.com" target="_blank" rel="noreferrer">Documentación API</a>
              </li>
              <li 
                onClick={() => setActiveModal('status')}
                className="hover:text-emerald-400 cursor-pointer transition-colors"
              >
                Estado del Sistema
              </li>
              <li 
                onClick={() => setActiveModal('security')}
                className="hover:text-blue-400 cursor-pointer transition-colors"
              >
                Seguridad de Red
              </li>
            </ul>
          </div>

          {/* Columna 4: System Status */}
          <div>
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-[0.2em] opacity-80">Live Status</h4>
            <div className="flex items-center gap-3 text-emerald-400 text-[10px] font-black bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              SISTEMAS OPERATIVOS
            </div>
          </div>
        </div>

        {/* Barra Legal */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-[10px] sm:text-xs font-medium tracking-widest uppercase">
          <p className="text-center md:text-left italic">
            © 2026 Nexus Analytics Inc. Todos los derechos reservados.
          </p>
          <div className="flex gap-8">
            <span className="hover:text-white cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-white cursor-pointer transition-colors">Términos</span>
            <span className="hover:text-white cursor-pointer transition-colors">Cookies</span>
          </div>
        </div>
      </div>

      {/* MODAL DE SOPORTE DINÁMICO */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Overlay oscuro con blur */}
          <div 
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          ></div>
          
          {/* Contenido del Modal */}
          <div className="relative bg-[#1E293B] border border-slate-700 w-full max-w-md p-8 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>

            {activeModal === 'status' ? (
              <div>
                <h3 className="text-emerald-400 font-bold text-xs tracking-widest uppercase mb-4">Estado del Sistema</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <span className="text-slate-300 text-sm">Base de Datos Supabase</span>
                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-tighter">Operativo</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <span className="text-slate-300 text-sm">Servidores de Análisis</span>
                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-tighter">Operativo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Latencia Global</span>
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-tighter">24ms (Excelente)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-blue-400 font-bold text-xs tracking-widest uppercase mb-4">Seguridad de Red</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Toda la infraestructura de Nexus Analytics utiliza cifrado de grado militar <span className="text-white font-bold">AES-256</span> y protección DDoS multicapa.
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-500/20">
                  <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest block mb-1">Tu Conexión</span>
                  <span className="text-white text-xs font-mono">Status: Encriptada y Segura</span>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setActiveModal(null)}
              className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold py-3 rounded-lg transition-colors uppercase tracking-widest"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}