"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCategoryShell } from "../components/CategoryShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, X } from "lucide-react";

type Plant = {
  id: string;
  name?: string;
  scientific_name?: string;
  category?: string;
  description?: string;
  image_url?: string;
  icon?: string;
  watering?: string; // Aseguramos que existan en el tipo
  light?: string; // Aseguramos que existan en el tipo
  difficulty?: string;
  sowing_months?: string[];
  harvest_days?: number;
  climate?: string;
  ph_min?: number;
  ph_max?: number;
  hydroponics?: boolean;
  type?: string;
  uses?: string;

  // ✨ NUEVOS CAMPOS AGREGADOS:
  companion_plants?: string[];
  antagonist_plants?: string[];
  common_pests?: string[];
  planting_depth_cm?: number;
  separation_cm?: number;
  max_height_cm?: number;
  requires_staking?: boolean;
  fertilizer_type?: string;
  soil_type?: string;
  edible_parts?: string[];
  medicinal_benefits?: string;
  growth_speed?: string;
  watering_frequency_days?: number;
  toxic_to_pets?: boolean;
  care_tips?: string;
  habitat?: string;
};

type User = {
  id: string;
};

type UserPlant = {
  id: string;
  plant_id: string;
  status?: string;
  planted_date?: string;
  Plants?: Plant; // Relación anidada de Supabase
  icon?: string;
};

export default function MiHuerto() {
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<UserPlant | null>(null);

  // Traemos el contexto de forma segura
  const categoryContext = useCategoryShell();
  const selectedCategory =
    categoryContext && "selectedCategory" in categoryContext
      ? (categoryContext as any).selectedCategory
      : "Todas";

  useEffect(() => {
    const fetchUserPlants = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({ id: session.user.id });

          const { data: userPlantRows, error: userPlantsError } = await supabase
            .from("user_plants")
            .select("id, plant_id, status, planted_date, user_id")
            .eq("user_id", session.user.id);

          if (userPlantsError) throw userPlantsError;

          const plantIds = [
            ...new Set(
              (userPlantRows ?? [])
                .map((row) => String(row.plant_id))
                .filter(Boolean),
            ),
          ];
          const plantsById: Record<string, Plant> = {};

          if (plantIds.length > 0) {
            const { data: plantsData, error: plantsError } = await supabase
              .from("Plants")
              .select("*")
              .in("id", plantIds);

            if (plantsError) throw plantsError;

            const { data: categoriesData, error: categoriesError } =
              await supabase.from("Categories").select("name, icon");

            if (categoriesError) throw categoriesError;

            (plantsData ?? []).forEach((plant) => {
              const categoryInfo = categoriesData?.find(
                (category) =>
                  category.name?.toLowerCase() ===
                  (plant.category || "").toLowerCase(),
              );

              plantsById[String(plant.id)] = {
                ...(plant as Plant),
                icon: (plant as Plant).icon || categoryInfo?.icon || "🌱",
              };
            });
          }

          const hydratedUserPlants = (userPlantRows ?? []).map((row) => {
            const plant = plantsById[String(row.plant_id)];

            return {
              ...row,
              icon: plant?.icon || "🌱",
              Plants: plant,
            };
          });

          setUserPlants(hydratedUserPlants as UserPlant[]);
        }
      } catch (error: any) {
        console.error("Error cargando el huerto personal:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlants();
  }, []);

  const [mensajeAlerta, setMensajeAlerta] = useState<string | null>(null);

  const deletePlant = async (userPlantId: string, plantName?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_plants")
        .delete()
        .eq("id", userPlantId)
        .eq("user_id", user.id);

      if (error) throw error;

      setUserPlants((prev) => prev.filter((item) => item.id !== userPlantId));
      setSelectedPost(null);
      setMensajeAlerta(
        `¡${plantName || "La planta"} se ha eliminado correctamente de tu huerto!`,
      );
      setTimeout(() => setMensajeAlerta(null), 4000);
    } catch (error: any) {
      console.error("Error eliminando planta del huerto:", error.message);
      setMensajeAlerta("No se pudo eliminar la planta. Inténtalo de nuevo.");
      setTimeout(() => setMensajeAlerta(null), 4000);
    }
  };

  const filteredUserPlants = useMemo(() => {
    return userPlants.filter((up) => {
      const nameMatches =
        up.Plants?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;
      if (selectedCategory === "Todas") return nameMatches;
      return nameMatches && up.Plants?.category === selectedCategory;
    });
  }, [userPlants, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <main className="flex justify-center items-center px-4 text-white w-full h-full">
        <div className="flex w-full bg-black/20 border border-gray-700 rounded-2xl gap-3 p-3 h-[85vh] animate-pulse">
          <div className="w-[300px] bg-gray-800/50 rounded-xl p-4 space-y-4">
            <div className="h-10 bg-gray-700 rounded-lg w-full"></div>
            <div className="h-20 bg-gray-700 rounded-lg w-full"></div>
            <div className="h-20 bg-gray-700 rounded-lg w-full"></div>
          </div>
          <div className="flex-1 bg-gray-800/30 rounded-xl p-6 space-y-4">
            <div className="h-8 bg-gray-700 rounded-lg w-1/3"></div>
            <div className="h-48 bg-gray-700 rounded-lg w-full"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center text-white p-6">
        <h2 className="text-3xl font-bold font-[indie_flower] mb-4">
          Tu invernadero está cerrado 🔒
        </h2>
        <p className="text-gray-400 mb-6">
          Inicia sesión para poder guardar y personalizar tus propias plantas.
        </p>
        <Link
          href="/"
          className="bg-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition"
        >
          Volver al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="flex justify-center items-center px-2 py-4 text-white w-full h-full overflow-hidden">
      <div className="flex w-full bg-[url(/bgforest.png)] bg-cover border border-[#d6c8ae]/30 rounded-2xl gap-3 p-3 h-[86vh] min-h-0 overflow-hidden">
        {/* COLUMNA IZQUIERDA: Listado de plantas guardadas y buscador */}
        <div className="w-full max-w-[300px] flex flex-col bg-[#25522c]/40 backdrop-blur-md border border-gray-600/30 rounded-xl p-3 min-h-0">
          {/* Barra de búsqueda interactiva */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Buscar en mi huerto... 🔍"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 placeholder-gray-400 transition"
            />
          </div>

          {/* Lista escrolleable de plantas */}
          <div className="flex-1 overflow-auto space-y-2 pr-1 [&::-webkit-scrollbar]:hidden">
            {filteredUserPlants.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 italic">
                No se encontraron plantas.
              </p>
            ) : (
              filteredUserPlants.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    selectedPost?.id === post.id
                      ? "bg-emerald-600/30 border-emerald-400"
                      : "bg-[#2C3E50]/70 border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div className="text-3xl bg-black/20 p-2 rounded-xl">
                    {post.Plants?.icon || post.icon || "🌱"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {post.Plants?.name || "Sin nombre"}
                    </h4>
                    <p className="text-xs text-gray-400 italic truncate">
                      {post.Plants?.scientific_name}
                    </p>
                    {post.status && (
                      <span className="inline-block mt-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {post.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            {mensajeAlerta && (
              <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>¡Excelente!</AlertTitle>
                  <AlertDescription>{mensajeAlerta}</AlertDescription>
                </Alert>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMensajeAlerta(null);
                  }}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Visor detallado de la planta seleccionada */}
        <div className="flex-1 flex bg-[#2C3E50]/50 backdrop-blur-md border border-gray-600/30 rounded-xl p-4 min-h-0 overflow-auto">
          {selectedPost ? (
            <div className="flex flex-col md:flex-row w-full gap-6">
              {/* COLUMNA INTERNA IZQUIERDA: Textos, Medidores y Datos */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl">
                      {selectedPost.icon || selectedPost.Plants?.icon || "🌱"}
                    </span>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold font-[indie_flower] text-emerald-400">
                        {selectedPost.Plants?.name}
                      </h2>
                      <p className="text-sm text-gray-400 italic">
                        {selectedPost.Plants?.scientific_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mt-4 leading-relaxed">
                    {selectedPost.Plants?.description ||
                      "Esta planta no cuenta con una descripción detallada todavía."}
                  </p>

                  <div className="flex gap-2 mt-2 justify-end">
                    <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      {selectedPost.Plants?.category}
                    </span>
                    <span className="px-4 py-1 bg-blue-300 text-blue-700 rounded-full text-xs font-medium">
                      {selectedPost.Plants?.difficulty || "Media"}
                    </span>
                  </div>

                  <div className="overflow-auto [&::-webkit-scrollbar]:hidden h-[43vh] mt-5">
                    {/* 1. 📅 MEJORA: Calendario Dinámico de Siembra en Rejilla */}
                    <div className="bg-black/10 p-3 rounded-xl border border-gray-700/30">
                      <span className="block text-xs font-semibold text-emerald-400 mb-2">
                        🗓️ Temporada de Siembra:
                      </span>
                      <div className="grid grid-cols-12 gap-1 text-center text-[10px] font-bold">
                        {[
                          "Ene",
                          "Feb",
                          "Mar",
                          "Abr",
                          "May",
                          "Jun",
                          "Jul",
                          "Ago",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dic",
                        ].map((mes) => {
                          // Verificamos si la planta se siembra todo el año o si incluye el mes específico
                          const esTodoElAno =
                            selectedPost.Plants?.sowing_months?.some((m) =>
                              m.toLowerCase().includes("todo el año"),
                            );
                          const mesActivo =
                            esTodoElAno ||
                            selectedPost.Plants?.sowing_months?.some(
                              (m) =>
                                m.toLowerCase().slice(0, 3) ===
                                mes.toLowerCase().slice(0, 3),
                            );

                          return (
                            <div
                              key={mes}
                              className={`py-1 rounded-sm border transition-colors ${
                                mesActivo
                                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm"
                                  : "bg-gray-800/40 border-gray-700 text-gray-500"
                              }`}
                              title={
                                mesActivo
                                  ? "Mes ideal para sembrar"
                                  : "No recomendado"
                              }
                            >
                              {mes.slice(0, 1)}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 🪱 Nutrición, Suelo, Hábitat y Consejos */}
                    <div className="bg-black/10 p-3 rounded-xl border border-gray-700/30 text-xs space-y-1 mt-4">
                      <p className="text-gray-300">
                        <strong className="text-emerald-400">
                          🌍 Hábitat de origen:
                        </strong>{" "}
                        {selectedPost.Plants?.habitat ?? "No especificado"}
                      </p>
                      <p className="text-gray-300">
                        <strong className="text-emerald-400">
                          🪵 Sustrato ideal:
                        </strong>{" "}
                        {selectedPost.Plants?.soil_type ??
                          "Sustrato universal bien drenado"}
                      </p>
                      <p className="text-gray-300">
                        <strong className="text-emerald-400">
                          🧪 Fertilizado:
                        </strong>{" "}
                        {selectedPost.Plants?.fertilizer_type ??
                          "Abono orgánico balanceado"}
                      </p>

                      {selectedPost.Plants?.care_tips && (
                        <div className="bg-emerald-500/5 border-l-2 border-emerald-500 p-2 my-2 text-gray-300 italic">
                          💡 <strong>Consejo clave:</strong>{" "}
                          {selectedPost.Plants.care_tips}
                        </div>
                      )}

                      {selectedPost.Plants?.edible_parts &&
                        selectedPost.Plants.edible_parts.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <span className="text-emerald-400 font-semibold mr-1">
                              🍽️ Partes comestibles:
                            </span>
                            {selectedPost.Plants.edible_parts.map((part) => (
                              <span
                                key={part}
                                className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px]"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* 📐 Marco de Diseño, Espacio y Riego exacto */}
                    <div className="bg-black/10 p-3 rounded-xl border border-gray-700/30 mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block font-semibold text-emerald-400 mb-1">
                          📐 Morfología:
                        </span>
                        <ul className="space-y-1 text-gray-300">
                          <li>
                            • <strong>Profundidad:</strong>{" "}
                            {selectedPost.Plants?.planting_depth_cm ?? "0.5"} cm
                          </li>
                          <li>
                            • <strong>Separación:</strong>{" "}
                            {selectedPost.Plants?.separation_cm ?? "20"} cm
                          </li>
                          <li>
                            • <strong>Altura máx:</strong>{" "}
                            {selectedPost.Plants?.max_height_cm ?? "40"} cm
                          </li>
                        </ul>
                      </div>
                      <div>
                        <span className="block font-semibold text-emerald-400 mb-1">
                          ⚡ Cuidados Técnicos:
                        </span>
                        <ul className="space-y-1 text-gray-300">
                          <li>
                            • <strong>Velocidad:</strong>{" "}
                            {selectedPost.Plants?.growth_speed ?? "Media"}
                          </li>
                          <li>
                            • <strong>Riego cada:</strong>{" "}
                            {selectedPost.Plants?.watering_frequency_days
                              ? `${selectedPost.Plants.watering_frequency_days} días`
                              : "N/A"}
                          </li>
                          <li>
                            • <strong>Soporte/Tutor:</strong>{" "}
                            {selectedPost.Plants?.requires_staking
                              ? "✅ Requerido"
                              : "❌ No necesita"}
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* 🪱 Nutrición, Suelo y Consumo */}
                    <div className="bg-black/10 p-3 rounded-xl border border-gray-700/30 mt-4 text-xs">
                      <p className="text-gray-300 mb-1">
                        <strong className="text-emerald-400">
                          🪵 Sustrato ideal:
                        </strong>{" "}
                        {selectedPost.Plants?.soil_type ??
                          "Sustrato universal bien drenado"}
                      </p>
                      <p className="text-gray-300 mb-1">
                        <strong className="text-emerald-400">
                          🧪 Fertilizado:
                        </strong>{" "}
                        {selectedPost.Plants?.fertilizer_type ??
                          "Abono orgánico balanceado"}
                      </p>
                      {selectedPost.Plants?.edible_parts &&
                        selectedPost.Plants.edible_parts.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <span className="text-emerald-400 font-semibold mr-1">
                              🍽️ Partes comestibles:
                            </span>
                            {selectedPost.Plants.edible_parts.map((part) => (
                              <span
                                key={part}
                                className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px]"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* 🌿 Biomímesis e Interacciones Ecológicas */}
                    <div className="bg-black/10 p-3 rounded-xl border border-gray-700/30 mt-4 text-xs gap-3 flex flex-col items-center">
                      {selectedPost.Plants?.companion_plants &&
                        selectedPost.Plants.companion_plants.length > 0 && (
                          <div>
                            <span className="block font-semibold text-emerald-400 mb-1">
                              🤝 Vecinos (Asociación ideal):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {selectedPost.Plants.companion_plants.map((p) => (
                                <span
                                  key={p}
                                  className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]"
                                >
                                  +{p}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {selectedPost.Plants?.common_pests &&
                        selectedPost.Plants.common_pests.length > 0 && (
                          <div>
                            <span className="block font-semibold text-amber-400 mb-1">
                              🪰 Plagas comunes a vigilar:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {selectedPost.Plants.common_pests.map((pest) => (
                                <span
                                  key={pest}
                                  className="bg-red-500/10 border border-red-500/20 text-red-300 px-2 py-0.5 rounded-full text-[10px]"
                                >
                                  ⚠️ {pest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {selectedPost.Plants?.medicinal_benefits && (
                        <p className="text-gray-400 text-[11px] italic border-t border-gray-700/40 pt-2 mt-2">
                          ❤️ <strong>Propiedad destacada:</strong>{" "}
                          {selectedPost.Plants.medicinal_benefits}
                        </p>
                      )}
                      {/* 🐾 Alerta de toxicidad para mascotas */}
                      {selectedPost.Plants?.toxic_to_pets !== undefined && (
                        <div className="m-auto flex justify-center text-[11px] font-semibold flex items-center gap-1">
                          {selectedPost.Plants.toxic_to_pets ? (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md">
                              ⚠️ Tóxica para mascotas (Perros/Gatos)
                            </span>
                          ) : (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              🐾 Segura para mascotas
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. 🧪 MEJORA: Barra Visual de Escala de pH */}
                    {selectedPost.Plants?.ph_min !== undefined &&
                      selectedPost.Plants?.ph_max !== undefined && (
                        <div className="bg-black/10 p-3 rounded-xl border border-gray-700/30 mt-4">
                          <div className="flex text-xs mb-1 justify-between">
                            <span className="font-semibold text-emerald-400">
                              🧪Rango de pH óptimo:
                            </span>

                            <span className="text-gray-300 font-mono">
                              {selectedPost.Plants.ph_min} -{" "}
                              {selectedPost.Plants.ph_max}
                            </span>
                          </div>
                          {/* Barra de Gradiente de pH (Ácido a Alcalino) */}
                          <div className="relative w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-purple-600 rounded-full mt-2">
                            {/* Indicador posicionado de manera aproximada según el rango */}
                            <div
                              className="absolute h-3 w-3 bg-white border-2 border-black rounded-full -top-0.5 shadow-md transform -translate-x-1/2"
                              style={{
                                left: `${((selectedPost.Plants.ph_min + selectedPost.Plants.ph_max) / 2 / 14) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                            <span>Ácido (1)</span>
                            <span>Neutro (7)</span>
                            <span>Alcalino (14)</span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Ficha técnica inferior original optimizada */}
                <div className="bg-black/20 p-3 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between pb-2">
                    <div className=" w-3/4">
                      <p className="text-xs text-gray-300">
                        📅 <strong>Fecha de siembra:</strong>{" "}
                        {selectedPost.planted_date
                          ? new Date(
                              selectedPost.planted_date,
                            ).toLocaleDateString()
                          : "No registrada"}
                      </p>

                      {/* 3. ⏳ MEJORA: Contador Regresivo de Cosecha */}
                      {selectedPost.planted_date && (
                        <p className="text-xs font-mono">
                          {selectedPost.Plants?.harvest_days &&
                          selectedPost.Plants.harvest_days > 0 ? (
                            (() => {
                              const diasPasados = Math.floor(
                                (Date.now() -
                                  new Date(
                                    selectedPost.planted_date,
                                  ).getTime()) /
                                  (1000 * 60 * 60 * 24),
                              );
                              const diasRestantes =
                                selectedPost.Plants.harvest_days - diasPasados;
                              return diasRestantes > 0 ? (
                                <span className="text-amber-400">
                                  ⏳ Faltan aproximadamente {diasRestantes} días
                                  para la cosecha.
                                </span>
                              ) : (
                                <span className="text-emerald-400 animate-pulse">
                                  ✨ ¡Listo para recolectar o cosechar!
                                </span>
                              );
                            })()
                          ) : (
                            <span className="text-teal-400">
                              ✨ Planta perenne (Decorativa / Cuidado continuo)
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        deletePlant(selectedPost.id, selectedPost.Plants?.name);
                      }}
                      className="text-sm transition text-gray-300 hover:border-red-400 border border-red-500/40 bg-red-500/10 px-3 py-2 rounded-xl hover:bg-red-500/20"
                      title="Eliminar del huerto"
                    >
                      🗑️
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 italic border-t border-gray-700/50 pt-2 flex justify-between">
                    <span>
                      💧 <strong>Riego:</strong>{" "}
                      {selectedPost.Plants?.watering || "N/A"}
                    </span>
                    <span>
                      ☀️ <strong>Luz:</strong>{" "}
                      {selectedPost.Plants?.light || "N/A"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 italic border-t border-gray-700/50 pt-2 flex justify-between">
                    {selectedPost.Plants?.hydroponics && (
                      <span className="text-cyan-400 font-semibold text-xs  m-auto">
                        🌾 Hidropónico
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* COLUMNA INTERNA DERECHA: Imagen de la planta */}
              <div className="w-full md:w-1/2 max-h-[300px] md:max-h-full border border-gray-700 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
                {selectedPost.Plants?.image_url ? (
                  <img
                    src={selectedPost.Plants.image_url}
                    alt={selectedPost.Plants.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-8xl text-white/20 select-none">
                    {selectedPost.icon || selectedPost.Plants?.icon || "🌱"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl italic text-gray-400 p-6 text-center">
              <span className="text-5xl mb-2">🌿</span>
              <p>
                Selecciona una planta de tu lista para explorar sus
                especificaciones y cuidados.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
