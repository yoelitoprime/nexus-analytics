import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  
  const navigate = useNavigate();

  // Efecto para el gradiente que sigue al mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscador en tiempo real
  useEffect(() => {
    if (search.length > 1) {
      searchServers();
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [search]);

  async function searchServers() {
    const { data } = await supabase
      .from('inventory')
      .select('name, status, load')
      .ilike('name', `%${search}%`)
      .limit(5);
    if (data) setResults(data);
  }

  // FUNCIÓN CLAVE: Navega a Inventory y hace scroll
  const handleSelectNode = (nodeName) => {
    // 1. Navegamos a /inventory (la ruta que tienes en App.jsx)
    navigate('/inventory', { state: { selectedNode: nodeName } });

    // 2. Ejecutamos el scroll con un pequeño delay 
    // Esto asegura que la página cargue y luego baje a la tabla
    setTimeout(() => {
      const element = document.getElementById('inventory-section-start');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Backup por si el ID no se detecta a tiempo
        window.scrollTo({
          top: 600, 
          behavior: 'smooth'
        });
      }
    }, 400); // 400ms es el tiempo ideal para coordinar con el Router
    
    setSearch(""); // Limpiamos el buscador
    setShowResults(false);
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center bg-[#0F172A] py-20 z-30">
      {/* Glow Effect */}
      <div 
        className="pointer-events-none absolute inset-0 z-10 hidden md:block"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.12), transparent 80%)`
        }}
      ></div>

      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-[#0F172A] to-[#0F172A]"></div>
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#334155_1px,transparent_1px),linear-gradient(90deg,#334155_1px,transparent_1px)] [background-size:45px_45px]"></div>
      </div>

      <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
        <div className="inline-block px-3 py-1 mb-6 border border-blue-500/20 bg-blue-500/10 rounded-full backdrop-blur-md">
          <span className="text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase">
            Enterprise Data Engine v2.0
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-10">
          Visualiza el futuro de tus <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
            datos en tiempo real
          </span>
        </h1>

        <div ref={searchRef} className="relative max-w-lg mx-auto">
          {/* Input Glow */}
          <div className={`absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 transition duration-500 ${showResults ? 'opacity-40' : 'opacity-20'}`}></div>
          
          <div className="relative z-50">
            <input 
              type="text"
              placeholder="Buscar sede o servidor..."
              className="w-full bg-slate-900/90 border border-white/10 px-6 py-5 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all backdrop-blur-2xl shadow-2xl text-lg placeholder:text-slate-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.length > 1 && setShowResults(true)}
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white opacity-90 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>

          {/* Lista de Resultados */}
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] z-[100] backdrop-blur-3xl">
              <div className="p-2">
                {results.map((res, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSelectNode(res.name)}
                    className="flex justify-between items-center p-4 hover:bg-blue-600/20 rounded-xl transition-all cursor-pointer group/item text-left border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${res.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 uppercase tracking-tight group-hover/item:text-blue-400 transition-colors">
                          {res.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                          {res.status} • Ver detalles
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-black ${res.status === 'Online' ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {res.load}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}