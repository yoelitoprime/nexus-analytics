import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function DataInsights() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
    
    const subscription = supabase
      .channel('logs-live')
      .on('postgres_changes', { event: 'INSERT', table: 'logs' }, (payload) => {
        setLogs((current) => [payload.new, ...current]);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  async function fetchLogs() {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setLogs(data);
  }

  const filteredLogs = logs.filter(log => 
    log.sede_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-12 px-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-white text-4xl font-black italic tracking-tighter uppercase leading-none">
            Data <span className="text-blue-500">Insights</span>
          </h2>
          <p className="text-slate-500 text-[10px] mt-3 uppercase tracking-[0.3em] font-bold">
            Historial General de Eventos
          </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <input 
            type="text"
            placeholder="FILTRAR POR SEDE O EVENTO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-3">
          {filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="flex items-center justify-between bg-slate-950/40 p-5 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all duration-300"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                    log.event_type === 'Offline' 
                    ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' 
                    : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                  }`}>
                    {log.event_type}
                  </span>
                  <p className="text-sm font-black text-white uppercase tracking-tight">
                    {log.sede_name}
                  </p>
                </div>
                <p className="text-xs text-slate-400 font-medium ml-1">
                  {log.description}
                </p>
                {log.notes && (
                  <div className="mt-2 ml-1 p-3 bg-blue-500/5 border-l border-blue-500/30 rounded-r-lg">
                    <p className="text-[10px] text-blue-400/80 italic font-medium">
                      Nota técnica: "{log.notes}"
                    </p>
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <p className="text-[10px] font-mono text-slate-500 font-bold bg-slate-900/50 px-3 py-1 rounded-lg">
                  {new Date(log.created_at).toLocaleString([], { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-20 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
              No se encontraron registros activos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}