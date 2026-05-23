import { useEffect, useState, useRef } from 'react'; // 1. Añadimos useRef
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Inventory() {
  const location = useLocation();
  const [servers, setServers] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);

  // 2. Referencia para atrapar el servidor seleccionado
  const targetRowRef = useRef(null);

  // Estados de tu formulario original
  const [newName, setNewName] = useState('');
  const [newLoad, setNewLoad] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLoad, setEditLoad] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);

  const [errorName, setErrorName] = useState('');
  const [errorLoad, setErrorLoad] = useState('');

  const totalSedes = servers.length;
  const sedesOnline = servers.filter(s => s.status === 'Online').length;
  const sedesOffline = servers.filter(s => s.status === 'Offline').length;

  useEffect(() => {
    fetchInventory();
    const interval = setInterval(() => fetchInventory(), 5000);
    return () => clearInterval(interval);
  }, []);

  // Lógica de resaltado + SCROLL AUTOMÁTICO
  useEffect(() => {
    if (location.state?.selectedNode && servers.length > 0) {
      const target = servers.find(s => s.name === location.state.selectedNode);
      if (target) {
        setHighlightedId(target.id);

        // 3. Ejecutar scroll automático hacia la referencia
        setTimeout(() => {
          if (targetRowRef.current) {
            targetRowRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center' // Lo centra en pantalla
            });
          }
        }, 300);

        const timer = setTimeout(() => setHighlightedId(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [location.state, servers]);

  async function fetchInventory() {
    const { data } = await supabase.from('inventory').select('*').order('id', { ascending: true });
    if (data) setServers(data);
  }

  async function createLog(sede, evento, desc) {
    await supabase.from('logs').insert([{ 
      sede_name: sede, 
      event_type: evento, 
      description: desc 
    }]);
  }

  const cleanLoad = (val) => {
    if (!val) return 0;
    return parseInt(val.toString().replace('%', '')) || 0;
  };

  const getLoadColor = (loadValue) => {
    const val = cleanLoad(loadValue);
    if (val <= 30) return 'bg-rose-500 animate-pulse';
    if (val <= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  async function saveEdit(id) {
    const numValue = cleanLoad(editLoad);
    if (numValue > 100 || numValue < 0) {
      alert("Error: 0-100 permitido");
      return;
    }
    const { error } = await supabase.from('inventory').update({ 
      name: editName.trim(), 
      load: `${numValue}%` 
    }).eq('id', id);

    if (!error) { 
      createLog(editName.trim(), 'Edición', `Datos actualizados: ${numValue}%`);
      setEditingId(null); 
      fetchInventory(); 
    }
  }

  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Online' ? 'Offline' : 'Online';
    const server = servers.find(s => s.id === id);
    const { error } = await supabase.from('inventory').update({ status: newStatus }).eq('id', id);
    if (!error) {
      createLog(server.name, newStatus, `Cambio de estado manual a ${newStatus}`);
      fetchInventory();
    }
  }

  async function addServer(e) {
    e.preventDefault();
    setErrorName(''); setErrorLoad('');
    const numValue = cleanLoad(newLoad);
    if (!/^[a-zA-Z0-9\s]+$/.test(newName)) { setErrorName("Nombre inválido"); return; }
    if (numValue > 100) { setErrorLoad("Máximo 100%"); return; }

    const { error } = await supabase.from('inventory').insert([{ 
      name: newName.trim(), 
      load: `${numValue}%`, 
      status: 'Online' 
    }]);

    if (!error) { 
      createLog(newName.trim(), 'Registro', `Nueva sede con ${numValue}%`);
      setNewName(''); setNewLoad(''); fetchInventory(); 
    }
  }

  async function confirmDelete() {
    if (serverToDelete) {
      const { error } = await supabase.from('inventory').delete().eq('id', serverToDelete.id);
      if (!error) {
        createLog(serverToDelete.name, 'Eliminación', 'Sede eliminada');
        fetchInventory();
      }
      setShowDeleteModal(false);
      setServerToDelete(null);
    }
  }

  return (
    <div className="p-8 text-white font-sans max-w-5xl mx-auto min-h-screen">
      <div id="inventory-section-start" className="h-1"></div>
      
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 text-3xl">🗑️</div>
            <h3 className="text-xl font-bold text-center mb-2 uppercase tracking-tighter italic">¿Eliminar Registro?</h3>
            <p className="text-slate-400 text-sm text-center mb-8">Esta acción borrará permanentemente la sede.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl bg-slate-800 font-bold text-xs">CANCELAR</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-rose-600 font-bold text-xs">ELIMINAR</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black italic text-blue-500 uppercase tracking-tighter">Nexus Central Ops</h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Gestión de Recursos HN</p>
        </div>
        <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 flex gap-6 shadow-xl">
          <div className="text-center"><p className="text-[9px] text-slate-500 uppercase font-bold">Unidades</p><p className="text-lg font-black">{totalSedes}</p></div>
          <div className="text-center"><p className="text-[9px] text-emerald-500 uppercase font-bold">Activo</p><p className="text-lg font-black text-emerald-400">{sedesOnline}</p></div>
          <div className="text-center"><p className="text-[9px] text-rose-500 uppercase font-bold">Mantenimiento</p><p className="text-lg font-black text-rose-500">{sedesOffline}</p></div>
        </div>
      </div>

      <form onSubmit={addServer} className="mb-12 bg-slate-900/50 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Nombre de Unidad</label>
            <input className={`bg-slate-950 border ${errorName ? 'border-rose-500' : 'border-slate-800'} p-3.5 rounded-xl text-sm outline-none focus:border-blue-500 transition-all`} placeholder="Ej: La Colonia 2" value={newName} onChange={(e) => setNewName(e.target.value)} />
            {errorName && <span className="text-[10px] text-rose-500 font-bold ml-1">{errorName}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Nivel de Capacidad</label>
            <div className="relative">
              <input className={`bg-slate-950 border ${errorLoad ? 'border-rose-500' : 'border-slate-800'} p-3.5 rounded-xl text-sm w-full outline-none focus:border-blue-500 transition-all`} placeholder="0-100" value={newLoad} onChange={(e) => setNewLoad(e.target.value)} />
              <span className="absolute right-4 top-3.5 text-slate-600 font-bold text-sm">%</span>
            </div>
            {errorLoad && <span className="text-[10px] text-rose-500 font-bold ml-1">{errorLoad}</span>}
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 h-[52px] rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-600/20 mt-5">Agregar servidor</button>
        </div>
      </form>

      <div className="grid gap-4">
        {servers.map((server) => {
          const isEditing = editingId === server.id;
          const isHighlighted = highlightedId === server.id;
          const currentVal = cleanLoad(isEditing ? editLoad : server.load);
          const currentDisplayColor = getLoadColor(currentVal);

          return (
            <div 
              key={server.id} 
              // 4. ASIGNAMOS LA REF SOLO AL ELEMENTO QUE COINCIDE
              ref={isHighlighted ? targetRowRef : null}
              className={`bg-slate-900/40 border p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 transition-all duration-700 ${
                isHighlighted 
                ? 'border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.3)] bg-blue-500/10 scale-[1.01]' 
                : 'border-white/5 border-l-blue-600'
              } group`}
            >
              <div className="flex-1 w-full text-left">
                <div className="flex justify-between items-end mb-3">
                  {isEditing ? (
                    <input className="bg-slate-800 border-b-2 border-blue-500 p-1 text-sm font-bold uppercase outline-none w-1/2 text-white" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                  ) : (
                    <span className={`text-sm font-bold uppercase tracking-tight ${isHighlighted ? 'text-blue-400 animate-pulse' : 'text-slate-200'}`}>
                      {server.name} {isHighlighted && "← SELECCIONADO"}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <input type="text" className="bg-slate-800 border-b-2 border-blue-500 p-1 text-xs font-mono font-bold w-12 text-center text-blue-400 outline-none" value={editLoad} onChange={(e) => setEditLoad(e.target.value)} />
                    ) : (
                      <span className={`text-[10px] font-mono font-bold ${currentDisplayColor.replace('bg-', 'text-')}`}>{currentVal}</span>
                    )}
                    <span className="text-[10px] text-slate-500 font-bold">%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div className={`h-full transition-all duration-300 ease-out ${currentDisplayColor}`} style={{ width: `${currentVal}%` }}></div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => saveEdit(server.id)} className="bg-emerald-600 hover:bg-emerald-500 p-2.5 rounded-xl text-[10px] font-bold shadow-lg uppercase">Guardar</button>
                    <button onClick={() => setEditingId(null)} className="bg-slate-700 hover:bg-slate-600 p-2.5 rounded-xl text-[10px] font-bold text-slate-300">X</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => toggleStatus(server.id, server.status)} className="p-3 hover:bg-slate-800 rounded-xl border border-slate-800 text-lg transition-all" title="Estado">{server.status === 'Online' ? '⚡' : '🛠️'}</button>
                    <button onClick={() => { setEditingId(server.id); setEditName(server.name); setEditLoad(cleanLoad(server.load)); }} className="p-3 hover:bg-slate-800 rounded-xl border border-slate-800 text-sm opacity-60 hover:opacity-100 transition-all" title="Editar">✏️</button>
                    <div className={`min-w-[90px] text-center px-4 py-2 rounded-xl text-[9px] font-black border tracking-widest ${server.status === 'Online' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'}`}>{server.status.toUpperCase()}</div>
                    <button onClick={() => { setServerToDelete(server); setShowDeleteModal(true); }} className="p-3 hover:bg-rose-500/10 rounded-xl transition-all group/bin"><span className="text-slate-600 group-hover/bin:text-rose-500 text-lg">🗑️</span></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}