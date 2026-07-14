"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import RevealPlant from "./components/RevealPlants";
import { useCategoryShell } from "./components/CategoryShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, X } from "lucide-react"

// Definición del tipo Plant estricto y limpio
type Plant = {
  id: string;
  name: string; 
  scientific_name: string;
  category: string;
  description?: string;
  image_url?: string;
  icon?: string;
  difficulty?: string;
  sowing_months?: string[];
  harvest_days?: number;
  climate?: string;
  ph_min?: number;
  ph_max?: number;
  hydroponics?: boolean;
};

type User = {
  id: string;
};

export default function Home() {
  const [mensajeAlerta, setMensajeAlerta] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [userPlantIds, setUserPlantIds] = useState<string[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✨ CORRECCIÓN 1: Traemos selectedCategory desde tu contexto global
  const { selectedCategory } = useCategoryShell();

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // 1. Obtener sesión del usuario de forma segura
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ id: session.user.id });
        
        // Obtener plantas guardadas del usuario si está autenticado
        const { data: userPlants } = await supabase
          .from("user_plants")
          .select("plant_id")
          .eq("user_id", session.user.id);
          
        if (userPlants) {
          setUserPlantIds(userPlants.map((p) => p.plant_id));
        }
      }

      // 2. Obtener plantas desde Supabase y mapearles el icono según su categoría
      const { data: plantsData, error: plantsError } = await supabase
        .from("Plants")
        .select("*");

      if (plantsError) throw plantsError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("Categories")
        .select("name, icon");

      if (categoriesError) throw categoriesError;

      if (plantsData) {
        const plantsWithIcons = (plantsData as Plant[]).map((plant) => {
          const categoryInfo = categoriesData?.find(
            (category) =>
              category.name.toLowerCase() === (plant.category || "").toLowerCase(),
          );

          return {
            ...plant,
            icon: plant.icon ?? categoryInfo?.icon ?? "🍃",
          };
        });

        setPlants(plantsWithIcons);
      }

    } catch (error: any) {
      console.error("Error cargando datos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Agregar al huerto
  const addToHuerto = async (plant: Plant) => {
    if (!user) return;

    if (userPlantIds.includes(plant.id)) {
      setMensajeAlerta(`¡${plant.name} ya está en tu huerto!`);
      setTimeout(() => setMensajeAlerta(null), 4000);
      return;
    }

    try {
      const { error } = await supabase
        .from("user_plants")
        .insert({ user_id: user.id, plant_id: plant.id });

      if (error) throw error;

      setUserPlantIds((prev) => [...prev, plant.id]);
      setMensajeAlerta(`¡${plant.name} se ha añadido correctamente a tu huerto!`);
      setTimeout(() => setMensajeAlerta(null), 4000);
    } catch (error: any) {
      console.error("Error agregando planta al huerto:", error.message);
      setMensajeAlerta("No se pudo agregar la planta. Inténtalo de nuevo.");
      setTimeout(() => setMensajeAlerta(null), 4000);
    }
  };

  // Filtrado optimizado con useMemo
  const filteredPlants = useMemo(() => {
    if (selectedCategory === "Todas") return plants;
    return plants.filter((plant) => plant.category === selectedCategory);
  }, [plants, selectedCategory]);

  if (loading) {
    return (
      <main className="flex justify-center items-center px-4 text-white w-full h-full">
        <div className="flex w-full bg-black/20 border border-gray-700 rounded-2xl gap-3 p-3 h-[85vh] animate-pulse">
          {/* Esqueleto de la barra lateral */}
          <div className="flex w-247 bg-gray-800/30 rounded-xl p-6 gap-4">
            <div className="h-40 bg-gray-700 rounded-lg w-60"></div>
            <div className="h-40 bg-gray-700 rounded-lg w-60"></div>
            <div className="h-40 bg-gray-700 rounded-lg w-60"></div>
          </div>

          <div className="w-[400px] bg-gray-800/50 rounded-xl p-4 space-y-4">
            <div className="h-45 bg-gray-700 rounded-lg w-full"></div>
            <div className="h-10 bg-gray-700 rounded-lg w-full"></div>
            <div className="h-20 bg-gray-700 rounded-lg w-full"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex w-full  bg-[url(/bgforest.png)] border border-[#d6c8ae]/30 rounded-2xl gap-3 p-3 h-[86vh]  overflow-hidden">
      <div className="flex px-1 w-full items-start flex-wrap overflow-auto [&::-webkit-scrollbar]:hidden bg-linear-to-t from-[#25522c]/70 to-[#d6c8ae]/50 backdrop-blur-xs rounded-xl border-2 border-[#d6c8ae]/50">
        
        {filteredPlants.map((plant) => (
          <div
            key={plant.id}
            onClick={() => setSelectedPlant(plant)} // ✨ CORRECCIÓN 3: Hacer clic en cualquier parte de la tarjeta abre los detalles
            className="rounded-2xl overflow-hidden hover:scale-105 transition-all m-2 w-[225px] cursor-pointer"
          >
            {/* Ícono flotante */}
            <div className="relative top-5 left-[120px] flex items-center justify-center text-6xl bg-linear-to-br from-[#3B5265] to-[#27E9B5] rounded-3xl w-[92px] h-10 z-10">
              {plant.icon || "🍃"}
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="p-4 bg-gradient-to-b from-[#5baf8bff]/50 to-[#2C3E50] rounded-2xl border border-[#27E9B5]/30 pt-8">
              <h3 className="text-xl font-semibold font-[indie_flower] text-(--platinum) truncate">
                {plant.name}
              </h3>
              <p className="text-gray-400 text-sm italic truncate">{plant.scientific_name}</p>
              
              <hr className="my-2 border-gray-400"/>
              <hr className="my-2 border-gray-400"/>

              <div className="mt-4 border-t border-gray-600/50 flex justify-between items-center">
                <span className="text-emerald-400 font-medium hover:underline text-sm">
                  Ver detalles →
                </span>
                
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToHuerto(plant);
                    }}
                    className="text-2xl transition text-gray-300 hover:border-green-400 border border-[#27E9B5]/60 bg-[#27E9B5]/20 px-2 py-1 rounded-2xl z-20"
                  >
                    {userPlantIds.includes(plant.id) ? "🪴" : "🌿"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Renderizado condicional de alertas */}
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

      {/* Vista de Detalles Derecho */}
      <div className="w-full max-w-[400px]">
        <div className="mb-7 h-full border-2 bg-[#2C3E50]/50 border-[#27E9B5]/40 backdrop-blur-md rounded-2xl text-cyan-950 p-4">
          {selectedPlant ? (
            <RevealPlant plant={selectedPlant} onClose={() => setSelectedPlant(null)} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl italic text-gray-400 p-6 text-center h-full">
              <span className="text-5xl mb-2">🌿</span>
              <p>Selecciona una planta de tu lista para explorar sus especificaciones y cuidados.</p>
            </div>
          )}
        </div>
      </div>

    </div>
    
  );
}