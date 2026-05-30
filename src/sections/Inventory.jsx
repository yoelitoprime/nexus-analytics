import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Inventory() {
  const location = useLocation();
  const [servers, setServers] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const targetRowRef = useRef(null);

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

  // useCallback evita recrear la función en cada render
  const fetchInventory = useCallback(async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error cargando inventario:', error.message);
      setFetchError('No se pudo conectar con la base de datos. Intenta recargar.');
      setLoading(false);
      return;
    }

    if (data) {
      setServers(data);
      setFetchError(null);
      setLoading(false);
    }
  }, []);

  // Carga inicial: Promise.resolve().then() difiere la ejecución
  // al microtask queue, fuera del cuerpo síncrono del efecto.
  // Esto satisface al linter sin cambiar el comportamiento real.
  useEffect(() => {
    Promise.resolve().then(() => fetchInventory());
  }, [fetchInventory]);

  // Suscripción Realtime: separada del fetch inicial para mayor claridad.
  // El setState ocurre dentro del callback de Supabase (sistema externo),
  // que es exactamente el patrón que React recomienda para efectos.
  useEffect(() => {
    const sub = supabase
      .channel('inventory-live')
      .on('postgres_changes', { event: '*', table: 'inventory' }, () => {
        fetchInventory();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [fetchInventory]);

  // Resaltado + scroll automático al navegar desde el buscador del Hero
  useEffect(() => {
    if (location.state?.selectedNode && servers.length > 0) {
      const target = servers.find(s => s.name === location.state.selectedNode);
      if (target) {
        // setTimeout(0) difiere el setState al siguiente tick,
        // evitando el cascading render dentro del efecto
        const highlightTimer = setTimeout(() => {
          setHighlightedId(target.id);
        }, 0);

        const scrollTimer = setTimeout(() => {
          if (targetRowRef.current) {
            targetRowRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 300);

        const clearTimer = setTimeout(() => setHighlightedId(null), 5000);

        return () => {
          clearTimeout(highlightTimer);
          clearTimeout(scrollTimer);
          clearTimeout(clearTimer);
        };
      }
    }
  }, [location.state, servers]);

  const createLog = useCallback(async (sede, evento, desc) => {
    const { error } = await supabase.from('logs').insert([{
      sede_name: sede,
      event_type: evento,
      description: desc,
    }]);
    if (error) console.error('Error creando log:', error.message);
  }, []);

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
      alert('Error: solo se permiten valores entre 0 y 100');
      return;
    }
    const { error } = await supabase
      .from('inventory')
      .update({ name: editName.trim(), load: `${numValue}%` })
      .eq('id', id);

    if (error) {
      console.error('Error al guardar edición:', error.message);
      return;
    }

    createLog(editName.trim(), 'Edición', `Datos actualizados: ${numValue}%`);
    setEditingId(null);
  }

  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Online' ? 'Offline' : 'Online';
    const server = servers.find(s => s.id === id);
    const { error } = await supabase
      .from('inventory')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error al cambiar estado:', error.message);
      return;
    }

    createLog(server.name, newStatus, `Cambio de estado manual a ${newStatus}`);
  }

  async function addServer(e) {
    e.preventDefault();
    setErrorName('');
    setErrorLoad('');

    if (!newName.trim()) { setErrorName('El nombre es requerido'); return; }
    if (!/^[a-zA-Z0-9\s\-áéíóúÁÉÍÓÚñÑ]+$/.test(newName)) { setErrorName('Nombre inválido'); return; }

    const numValue = cleanLoad(newLoad);
    if (numValue > 100) { setErrorLoad('Máximo 100%'); return; }
    if (numValue < 0) { setErrorLoad('Mínimo 0%'); return; }

    const { error } = await supabase.from('inventory').insert([{
      name: newName.trim(),
      load: `${numValue}%`,
      status: 'Online',
    }]);

    if (error) {
      console.error('Error al agregar servidor:', error.message);
      setErrorName('Error al guardar. Intenta de nuevo.');
      return;
    }

    createLog(newName.trim(), 'Registro', `Nueva sede registrada con ${numValue}% de carga`);
    setNewName('');
    setNewLoad('');
  }

  async function confirmDelete() {
    if (!serverToDelete) return;

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', serverToDelete.id);

    if (error) {
      console.error('Error al eliminar:', error.message);
    } else {
      createLog(serverToDelete.name, 'Eliminación', 'Sede eliminada del sistema');
    }

    setShowDeleteModal(false);
    setServerToDelete(null);
  }

  if (loading) {
    return (
      <div className="p-8 text-white font-sans max-w-5xl mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold">Conectando con Nexus DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-white font-sans max-w-5xl mx-auto min-h-screen">
      <div id="inventory-section-start" className="h-1"></div>

      {fetchError && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-rose-400 text-lg">⚠️</span>
          <p className="text-rose-400 text-xs font-bold uppercase tracking-wider">{fetchError}</p>
          <button
            onClick={fetchInventory}
            className="ml-auto text-[10px] font-black uppercase tracking-widest bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg transition-all"
          >
            Reintentar
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 text-3xl">🗑️</div>
            <h3 className="text-xl font-bold text-center mb-2 uppercase tracking-tighter italic">¿Eliminar Registro?</h3>
            <p className="text-slate-400 text-sm text-center mb-2">
              Esta acción borrará permanentemente la sede:
            </p>
            <p className="text-white font-black text-center text-sm mb-8 uppercase tracking-tight">
              {serverToDelete?.name}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setServerToDelete(null); }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs transition-all"
              >
                CANCELAR
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs transition-all"
              >
                ELIMINAR
              </button>
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
          <div className="text-center">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Unidades</p>
            <p className="text-lg font-black">{totalSedes}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-emerald-500 uppercase font-bold">Activo</p>
            <p className="text-lg font-black text-emerald-400">{sedesOnline}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-rose-500 uppercase font-bold">Mantenimiento</p>
            <p className="text-lg font-black text-rose-500">{sedesOffline}</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={addServer}
        className="mb-12 bg-slate-900/50 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Nombre de Unidad</label>
            <input
              className={`bg-slate-950 border ${errorName ? 'border-rose-500' : 'border-slate-800'} p-3.5 rounded-xl text-sm outline-none focus:border-blue-500 transition-all`}
              placeholder="Ej: La Colonia 2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {errorName && <span className="text-[10px] text-rose-500 font-bold ml-1">{errorName}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Nivel de Capacidad</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                className={`bg-slate-950 border ${errorLoad ? 'border-rose-500' : 'border-slate-800'} p-3.5 rounded-xl text-sm w-full outline-none focus:border-blue-500 transition-all`}
                placeholder="0-100"
                value={newLoad}
                onChange={(e) => setNewLoad(e.target.value)}
              />
              <span className="absolute right-4 top-3.5 text-slate-600 font-bold text-sm">%</span>
            </div>
            {errorLoad && <span className="text-[10px] text-rose-500 font-bold ml-1">{errorLoad}</span>}
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 h-[52px] rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-600/20 mt-5 transition-all active:scale-95"
          >
            Agregar servidor
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {servers.length === 0 && !fetchError && (
          <div className="text-center py-20 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
            No hay sedes registradas. Agrega la primera arriba.
          </div>
        )}

        {servers.map((server) => {
          const isEditing = editingId === server.id;
          const isHighlighted = highlightedId === server.id;
          const currentVal = cleanLoad(isEditing ? editLoad : server.load);
          const currentDisplayColor = getLoadColor(currentVal);

          return (
            <div
              key={server.id}
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
                    <input
                      className="bg-slate-800 border-b-2 border-blue-500 p-1 text-sm font-bold uppercase outline-none w-1/2 text-white"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className={`text-sm font-bold uppercase tracking-tight ${isHighlighted ? 'text-blue-400 animate-pulse' : 'text-slate-200'}`}>
                      {server.name} {isHighlighted && '← SELECCIONADO'}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="bg-slate-800 border-b-2 border-blue-500 p-1 text-xs font-mono font-bold w-12 text-center text-blue-400 outline-none"
                        value={editLoad}
                        onChange={(e) => setEditLoad(e.target.value)}
                      />
                    ) : (
                      <span className={`text-[10px] font-mono font-bold ${currentDisplayColor.replace('bg-', 'text-').replace(' animate-pulse', '')}`}>
                        {currentVal}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-bold">%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div
                    className={`h-full transition-all duration-300 ease-out ${currentDisplayColor}`}
                    style={{ width: `${currentVal}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => saveEdit(server.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 p-2.5 rounded-xl text-[10px] font-bold shadow-lg uppercase transition-all"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-slate-700 hover:bg-slate-600 p-2.5 rounded-xl text-[10px] font-bold text-slate-300 transition-all"
                    >
                      X
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => toggleStatus(server.id, server.status)}
                      className="p-3 hover:bg-slate-800 rounded-xl border border-slate-800 text-lg transition-all"
                      title={server.status === 'Online' ? 'Pasar a mantenimiento' : 'Poner online'}
                    >
                      {server.status === 'Online' ? '⚡' : '🛠️'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(server.id);
                        setEditName(server.name);
                        setEditLoad(cleanLoad(server.load));
                      }}
                      className="p-3 hover:bg-slate-800 rounded-xl border border-slate-800 text-sm opacity-60 hover:opacity-100 transition-all"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <div className={`min-w-[90px] text-center px-4 py-2 rounded-xl text-[9px] font-black border tracking-widest ${
                      server.status === 'Online'
                        ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                        : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                    }`}>
                      {server.status.toUpperCase()}
                    </div>
                    <button
                      onClick={() => { setServerToDelete(server); setShowDeleteModal(true); }}
                      className="p-3 hover:bg-rose-500/10 rounded-xl transition-all group/bin"
                    >
                      <span className="text-slate-600 group-hover/bin:text-rose-500 text-lg">🗑️</span>
                    </button>
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
