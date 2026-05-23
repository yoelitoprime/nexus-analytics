import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function NewsGrid() {
  const [activities, setActivities] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRealLogs();
    const sub = supabase.channel('news-grid-live').on('postgres_changes', 
      { event: 'INSERT', table: 'logs' }, () => fetchRealLogs()
    ).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function fetchRealLogs() {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4); 
    
    if (data) {
      const mappedLogs = data.map(log => ({
        ...log,
        status: log.event_type === 'Offline' ? 'Critical' : 'System',
        shortTime: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badgeColor: getBadgeColor(log.event_type)
      }));
      setActivities(mappedLogs);
    }
  }

  const getBadgeColor = (type) => {
    if (type === 'Offline') return "text-rose-400 bg-rose-400/10";
    if (type === 'Online') return "text-emerald-400 bg-emerald-400/10";
    return "text-blue-400 bg-blue-400/10"; 
  };

  async function saveNote() {
    if (!noteText.trim()) return; // Validación lógica

    setIsSaving(true);
    const { error } = await supabase
      .from('logs')
      .update({ notes: noteText.trim() })
      .eq('id', selectedLog.id);

    if (!error) {
      setTimeout(() => {
        setIsSaving(false);
        fetchRealLogs();
        setSelectedLog(prev => ({ ...prev, notes: noteText.trim() }));
      }, 800);
    }
  }

  return (
    <section className="px-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activities.map((log) => (
          <div 
            key={log.id} 
            className={`p-5 rounded-xl border transition-all duration-300 bg-[#1E293B] cursor-default
              hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] 
              ${log.status === 'Critical' 
                ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:border-rose-400' 
                : 'border-slate-700/50 hover:border-blue-500/50 hover:bg-[#243146]'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.badgeColor}`}>{log.status}</span>
              <span className="text-slate-500 text-xs">{log.shortTime}</span>
            </div>
            <h4 className="text-white font-bold text-lg mb-2 uppercase">{log.sede_name}</h4>
            <p className="text-slate-400 text-sm line-clamp-2 mb-4 tracking-tight">{log.description}</p>
            
            <button 
              onClick={() => { setSelectedLog(log); setNoteText(log.notes || ""); }} 
              className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center gap-2"
            >
              DETALLES DEL EVENTO <span className="text-lg">→</span>
            </button>
          </div>
        ))}
      </div>

      {/* MODAL CON VALIDACIÓN */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1E293B] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between mb-6">
              <h3 className="text-white font-black uppercase tracking-tighter text-xl underline decoration-blue-500 decoration-2 underline-offset-8">Bitácora Técnica</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-white transition-colors text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Sede</p>
                  <p className="text-white font-bold">{selectedLog.sede_name}</p>
                </div>
                <button 
                  onClick={() => navigate('/inventory')}
                  className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-lg text-[10px] font-black border border-blue-500/30 transition-all uppercase"
                >
                  Gestionar
                </button>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Notas Técnicas</p>
                <textarea 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Escribe el diagnóstico..."
                  className={`w-full bg-slate-900 border rounded-xl p-4 text-slate-300 text-sm outline-none h-32 resize-none transition-all ${
                    !noteText.trim() ? 'border-slate-800' : 'border-blue-500/50'
                  }`}
                />
                
                <button 
                  onClick={saveNote} 
                  disabled={isSaving || !noteText.trim()}
                  className={`w-full mt-3 flex items-center justify-center gap-2 font-black py-4 rounded-xl transition-all uppercase text-[10px] tracking-widest border ${
                    isSaving 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : !noteText.trim()
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white shadow-lg'
                  }`}
                >
                  {!noteText.trim() ? "Escribe una nota para guardar" : isSaving ? "✓ Nota Sincronizada" : "Actualizar Bitácora"}
                </button>
              </div>
            </div>

            <button onClick={() => setSelectedLog(null)} className="w-full mt-6 text-slate-500 hover:text-slate-300 font-bold py-2 transition-colors uppercase text-[10px] tracking-[0.2em]">
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}
    </section>
  );
}