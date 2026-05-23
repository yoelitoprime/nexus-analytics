export default function NewsCard({ image, category, date, title }) {
  return (
    <div className="bg-[#313233] border-b-4 border-transparent hover:border-[#55AA33] hover:-translate-y-1 transition-all duration-300 overflow-hidden group shadow-lg flex flex-col">
      
      {/* 1. ESTA ES LA PARTE QUE FALTABA: EL CONTENEDOR DE IMAGEN */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className="absolute top-2 left-2 bg-[#55AA33] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
          {category}
        </span>
      </div>

      {/* 2. CONTENIDO DE TEXTO (SOLO UNA VEZ) */}
      <div className="p-5 flex flex-col flex-grow">
        <span className="text-gray-400 text-[10px] font-bold uppercase mb-2 block tracking-widest">
          {date}
        </span>
        
        <h4 className="text-white font-minecraft font-bold text-base md:text-lg mt-1 leading-snug group-hover:text-[#55AA33] transition-colors min-h-[3rem] line-clamp-2">
          {title}
        </h4>

        <div className="mt-auto pt-4">
          <button className="text-[#55AA33] text-xs font-black hover:tracking-widest transition-all">
            LEER MÁS +
          </button>
        </div>
      </div>
    </div>
  );
}