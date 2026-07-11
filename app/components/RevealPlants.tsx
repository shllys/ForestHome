"use client";

// 1. Añadimos onClose a la interfaz de TypeScript
interface RevealPlantProps {
  plant: {
    name?: string;
    scientific_name?: string;
    description?: string;
    category?: string;
    difficulty?: string;
    image_url?: string;
    icon?: string;
    sowing_months?: string[];
    harvest_days?: number;
    climate?: string;
    ph_min?: number;
    ph_max?: number;
    hydroponics?: boolean;
    watering?: string;
    light?: string;
    planted_date?: string; // Fecha de siembra en formato ISO 8601
  } | null;
  onClose: () => void; // ✨ Nueva función requerida
}

export default function RevealPlant({ plant, onClose }: RevealPlantProps) {
  if (!plant) return null;

  return (
    <div className="rounded-xl shadow-lg h-full text-(--white-front)">
      {/* 2. Botón profesional de cierre en la esquina superior derecha */}
      <button 
        onClick={onClose}
        className="absolute top-4 left-5 z-10 font-bold text-gray-400 hover:text-white transition text-xl py-1 px-2 rounded-lg hover:bg-white/10"
      >
        ✕
      </button>
      <div className="flex flex-col gap-4">
        {/* Imagen grande */}
        <div className="h-40 bg-linear-to-br from-emerald-600 to-teal-300 rounded-2xl flex items-center justify-center text-8xl">
          {plant.image_url ? (
            <img
              src={plant.image_url}
              alt={plant.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            plant.icon || "🍃"
          )}
        </div>

        {/* Información */}
        <div className="flex gap-2 items-end justify-between">
          <h2 className="text-4xl font-bold text-emerald-500">{plant.name}</h2>
          <p className="text-gray-400 italic text-sm">
            ({plant.scientific_name})
          </p>
        </div>
        <p className="text-gray-300 leading-relaxed text-md">
          {plant.description}
        </p>

        <div className="flex gap-2 -mt-2 justify-end">
          <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            {plant.category}
          </span>
          <span className="px-4 py-1 bg-blue-300 text-blue-700 rounded-full text-xs font-medium">
            {plant.difficulty || "Media"}
          </span>
        </div>

        <hr className="text-gray-400 my-1" />

        <div>
          {/* 1. 📅 MEJORA: Calendario Dinámico de Siembra en Rejilla */}
          <div className="bg-black/10 p-3 rounded-xl border border-gray-700/30">
            <span className="block text-xs font-semibold text-emerald-400 mb-2">🗓️ Temporada de Siembra Recomendada:</span>
            <div className="grid grid-cols-12 gap-1 text-center text-[10px] font-bold">
              {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((mes) => {
                // Verificamos si la planta se siembra todo el año o si incluye el mes específico
                const esTodoElAno = plant?.sowing_months?.some(m => m.toLowerCase().includes("todo el año"));
                const mesActivo = esTodoElAno || plant?.sowing_months?.some(m => m.toLowerCase().slice(0, 3) === mes.toLowerCase().slice(0, 3));

                return (
                  <div
                    key={mes}
                    className={`py-1 rounded-sm border transition-colors ${
                      mesActivo
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm"
                        : "bg-gray-800/40 border-gray-700 text-gray-500"
                    }`}
                    title={mesActivo ? "Mes ideal para sembrar" : "No recomendado"}
                  >
                    {mes.slice(0, 1)}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Ficha técnica inferior original optimizada */}
        <div className="bg-black/20 p-3 rounded-xl border border-gray-700/50 flex justify-between">
          
          {/* 2. 🧪 MEJORA: Barra Visual de Escala de pH */}
          {plant?.ph_min !== undefined && plant?.ph_max !== undefined && (
            <div className="border border-gray-700/30 w-2/3">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-400">🧪 Rango de pH óptimo:</span>
                <span className="text-gray-300 font-mono">{plant.ph_min} - {plant.ph_max}</span>
              </div>
              {/* Barra de Gradiente de pH (Ácido a Alcalino) */}
              <div className="relative w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-purple-600 rounded-full mt-2">
                {/* Indicador posicionado de manera aproximada según el rango */}
                <div 
                  className="absolute h-3 w-3 bg-white border-2 border-black rounded-full -top-0.5 shadow-md transform -translate-x-1/2"
                  style={{ left: `${((plant.ph_min + plant.ph_max) / 2 / 14) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                <span>Ácido (1)</span>
                <span>Neutro (7)</span>
                <span>Alcalino (14)</span>
              </div>
            </div>
          )}

            {plant?.hydroponics && (
              <span className="text-cyan-400 font-semibold text-xs">🌾 Hidropónico</span>
            )}
        </div>

        {/* <Link
          href={`/plantas/${plant.id}`}
          className="mt-8 inline-block w-full text-center bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition"
        >
          Ver Detalle Completo →
        </Link> */}
      </div>
    </div>
  );
}
