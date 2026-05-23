import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function StatsDashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealtimeStats();
    
    // Suscripción en tiempo real: Escucha cambios en la tabla 'inventory'
    const sub = supabase.channel('stats-live').on('postgres_changes', 
      { event: '*', table: 'inventory' }, () => fetchRealtimeStats()
    ).subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  async function fetchRealtimeStats() {
    try {
      const { data, error } = await supabase.from('inventory').select('*');
      if (error) throw error;
      if (data) {
        setServers(data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error cargando stats:", error.message);
    }
  }

  // --- LÓGICA DE CÁLCULOS DINÁMICOS ---
  const totalNodes = servers.length;
  const onlineNodes = servers.filter(s => s.status === 'Online').length;
  const uptimeValue = totalNodes > 0 ? ((onlineNodes / totalNodes) * 100).toFixed(1) : 0;
  
  const avgLoad = totalNodes > 0 
    ? (servers.reduce((acc, s) => {
        const val = typeof s.load === 'string' ? parseInt(s.load.replace('%','')) : s.load;
        return acc + (val || 0);
      }, 0) / totalNodes).toFixed(0)
    : 0;

  const metrics = [
    { label: "Sedes Operativas (Uptime)", percentage: uptimeValue, color: "#10B981" },
    { label: "Carga Promedio de Red", percentage: avgLoad, color: "#3B82F6" },
    { label: "Capacidad Disponible", percentage: (100 - avgLoad).toFixed(0), color: "#8B5CF6" },
    { label: "Salud del Sistema", percentage: uptimeValue, color: "#F59E0B" },
  ];

  if (loading) return <div className="p-10 text-white animate-pulse text-center font-bold">CONECTANDO CON NEXUS DATABASE...</div>;

  return (
    <section className="container mx-auto py-12 px-6">
      {/* Encabezado sin botón de reporte interno */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h3 className="text-blue-500 text-sm font-bold tracking-[0.2em] uppercase mb-2">
            Network Operations
          </h3>
          <h2 className="text-3xl font-extrabold text-white">
            Métricas de Rendimiento Real
          </h2>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="text-slate-400 text-[10px] font-medium bg-slate-900/50 px-4 py-1.5 rounded-full border border-white/5">
            Estado: <span className={uptimeValue > 50 ? "text-emerald-400" : "text-rose-500"}>
              {uptimeValue > 50 ? "● SISTEMA ESTABLE" : "● ALERTA DE RED"}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#1E293B]/50 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl">
        
        {/* Gráficos de Progreso */}
        <div className="space-y-7">
          {metrics.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-semibold uppercase text-[10px] tracking-wider">{item.label}</span>
                <span className="text-white font-mono font-bold">{item.percentage}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Grid de KPIs Individuales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">Nodos Totales</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-white text-3xl font-black italic">{totalNodes}</span>
              <span className="text-blue-500 text-xs font-bold uppercase tracking-tight">Nodos</span>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Nodos Online</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-emerald-400 text-3xl font-black italic">{onlineNodes}</span>
              <span className="text-emerald-500 text-[9px] font-bold uppercase tracking-tight">Activos</span>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all group">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-rose-400 transition-colors">Nodos Offline</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-rose-500 text-3xl font-black italic">{totalNodes - onlineNodes}</span>
              <span className="text-rose-600 text-[9px] font-bold uppercase tracking-tight">Caídos</span>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all group">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-amber-400 transition-colors">Latencia</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-white text-3xl font-black italic">14ms</span>
              <span className="text-blue-400 text-[9px] font-bold uppercase tracking-tight">Ping</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}