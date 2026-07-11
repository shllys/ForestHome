"use client";

import { supabase } from "@/lib/supabase";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useCategoryShell } from "../components/CategoryShell";

type Plant = {
  id: string;
  name?: string;
  scientific_name?: string;
  category?: string;
  description?: string;
  image_url?: string;
  icon?: string;
  type?: string;
};

type GalleryImage = {
  id: string;
  image_url?: string;
  gallery_post_id?: string;
};

type CommentItem = {
  id: string;
  content: string;
  user_id?: string;
  gallery_post_id?: string;
};

type GalleryPost = Plant & {
  allImages?: GalleryImage[];
  comments?: CommentItem[];
};

const buildUploadFileName = (fileName: string) => {
  const fileExtension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  return `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
};

export default function Galeria() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { selectedCategory, setCategories, setSelectedCategory } =
    useCategoryShell();

  const handleAction = async (
    type: "fetch" | "upload" | "comment",
    payload?: { file?: File; plantId?: string },
  ) => {
    try {
      if (type === "fetch") {
        setLoading(true);
        // 1. Traemos las plantas base
        const { data: plantsData, error: plantsError } = await supabase
          .from("Plants")
          .select("*")
          .order("name", { ascending: true })
          .limit(30);

        if (plantsError) throw plantsError;

        // 2. Traemos las categorías para inyectar los iconos
        const { data: categoriesData } = await supabase
          .from("Categories")
          .select("name, icon");

        const postsWithIcons = (plantsData || []).map((plant) => {
          const category = categoriesData?.find(
            (c) =>
              c.name.toLowerCase() === (plant.category || "").toLowerCase(),
          );
          return { ...plant, icon: category?.icon || "🌱" };
        });

        const nextCategories = [
          "Todas",
          ...Array.from(
            new Set(
              postsWithIcons.map((plant) => plant.category).filter(Boolean),
            ),
          ),
        ];

        setPosts(postsWithIcons);
        setCategories(nextCategories);
        if (!nextCategories.includes(selectedCategory)) {
          setSelectedCategory("Todas");
        }

        setError(null);
      }

      if (type === "upload") {
        const file = payload?.file;
        const plantId = payload?.plantId;
        if (!file || !plantId) return;

        setUploading(true);
        const fileName = buildUploadFileName(file.name);

        // Subida al Storage
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);
        const user = await supabase.auth.getUser();

        // Guardamos relacionando con la planta
        const { error: insertError } = await supabase
          .from("gallery_posts")
          .insert({
            image_url: urlData.publicUrl,
            caption: "Nueva foto de la comunidad 🌱",
            user_id: user.data.user?.id || null,
            plant_id: plantId,
          });

        if (insertError) throw insertError;

        alert("✅ ¡Foto añadida a esta planta!");

        if (selectedPost) {
          await refreshSelectedPost(plantId, selectedPost);
        }
        setCurrentImageIndex(0);
      }

      if (type === "comment") {
        if (!newComment.trim() || !selectedPost) return;

        const user = await supabase.auth.getUser();
        const { data: commentData, error: commentError } = await supabase
          .from("comments")
          .insert({
            gallery_post_id: selectedPost.id,
            content: newComment,
            user_id: user.data.user?.id || null,
          })
          .select("*")
          .single();

        if (commentError) throw commentError;

        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments
                  ? [...prev.comments, commentData]
                  : [commentData],
              }
            : prev,
        );

        setNewComment("");
        alert("✅ Comentario agregado");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(err);
      setError(errorMessage || "Ocurrió un error");
      alert("Error: " + (errorMessage || "Algo salió mal"));
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const refreshSelectedPost = async (
    plantId: string,
    currentPlant: GalleryPost,
  ) => {
    const { data: communityImages } = await supabase
      .from("gallery_posts")
      .select("*")
      .eq("plant_id", plantId);

    const { data: comments } = await supabase
      .from("comments")
      .select("*")
      .eq("gallery_post_id", plantId)
      .order("created_at", { ascending: true });

    setSelectedPost({
      ...currentPlant,
      allImages: communityImages || [],
      comments: comments || [],
    });
  };

  const openPost = async (post: GalleryPost) => {
    await refreshSelectedPost(post.id, post);
  };

  // ✨ CORRECCIÓN CRÍTICA: Llamar al fetch inicial al montar el componente
  useEffect(() => {
    handleAction("fetch");
  }, []); // eslint-disable- some rules if required

  const filteredPosts = useMemo(() => {
    return selectedCategory === "Todas"
      ? posts
      : posts.filter((plant) => plant.category === selectedCategory);
  }, [posts, selectedCategory]);

  const closeModal = () => {
    setSelectedPost(null);
    setCurrentImageIndex(0);
  };

  if (loading)
    return (
      <div className="p-20 text-center text-xl text-white">
        Cargando galería...
      </div>
    );
  if (error)
    return <div className="p-20 text-center text-red-400">{error}</div>;

  return (
    <main className="flex flex-col gap-2 w-293 bg-[url(/bgforest.png)] cover border border-[#d6c8ae]/30 rounded-2xl p-3 h-[84vh]">
      <div className="flex justify-between mb-1 shrink-0 bg-gradient-to-b from-[#5baf8bff]/50 to-[#2C3E50] p-1 rounded-lg">
        <h1 className="text-4xl font-[indie_flower] text-white">
          📷 Galería Comunitaria de ForestHome 🌿
        </h1>

        <Link href="/" className="text-emerald-300 hover:underline font-medium">
          ← Volver al catálogo
        </Link>
      </div>
      <div className="flex p-2 w-full items-start flex-wrap overflow-auto [&::-webkit-scrollbar]:hidden bg-linear-to-t from-[#25522c]/70 to-[#d6c8ae]/50 backdrop-blur-xs rounded-xl border-2 border-[#d6c8ae]/50">
        {posts.length === 0 ? (
          <p className="text-center text-xl text-gray-200 py-20">
            No hay plantas en la galería todavía.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {filteredPosts.map((plant) => (
              <div
                key={plant.id}
                onClick={() => openPost(plant)}
                className="mb-3 break-inside-avoid bg-gradient-to-l from-[#5baf8bff]/50 to-[#2C3E50] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer group border border-white/5"
              >
                <div className="relative aspect-[5/3] bg-gray-900/40 flex items-center justify-center text-6xl">
                  {plant.image_url ? (
                    <img
                      src={plant.image_url}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    plant.icon || "🌱"
                  )}
                </div>
                <div className="p-5 text-white">
                  <h3 className="font-semibold text-xl group-hover:text-emerald-400 transition-colors">
                    {plant.name}
                  </h3>
                  <p className="text-gray-400 text-sm italic">
                    {plant.scientific_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-[#2C3E50] border border-gray-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row h-[75vh]">
              {/* Contenedor de la Imagen con Slider */}
              <div className="md:w-3/5 bg-gray-950 flex items-center justify-center relative group h-full">
                {currentImageIndex === 0 ? (
                  selectedPost.image_url ? (
                    <img
                      src={selectedPost.image_url}
                      alt={selectedPost.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-8xl flex items-center justify-center w-full h-full">
                      {selectedPost.icon || "🌱"}
                    </div>
                  )
                ) : (
                  <img
                    src={
                      selectedPost.allImages?.[currentImageIndex - 1]?.image_url
                    }
                    alt={`Foto de la comunidad de ${selectedPost.name}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* ETIQUETA INFORMATIVA FLOTANTE */}
                <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full z-10 font-medium">
                  {currentImageIndex === 0
                    ? "Foto Oficial 📋"
                    : "Foto de la Comunidad 👥"}
                </span>

                {/* FLECHAS DEL SLIDER */}
                {selectedPost.allImages &&
                  selectedPost.allImages.length > 0 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === 0
                              ? selectedPost.allImages!.length
                              : prev - 1,
                          )
                        }
                        className="absolute left-4 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-600 transition z-10"
                      >
                        ❮
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === selectedPost.allImages!.length
                              ? 0
                              : prev + 1,
                          )
                        }
                        className="absolute right-4 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-600 transition z-10"
                      >
                        ❯
                      </button>

                      {/* Indicador de bolitas */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                        {Array.from({
                          length: 1 + selectedPost.allImages.length,
                        }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-2 w-2 rounded-full transition-all ${
                              idx === currentImageIndex
                                ? "bg-emerald-400 scale-125"
                                : "bg-gray-500/60"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
              </div>

              {/* Descripción y comentarios */}
              <div className="md:w-2/5 h-full p-6 bg-gradient-to-b from-[#5baf8bff]/50 to-[#2C3E50] flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
                <div className="p-4 bg-black/20 rounded-2xl border border-[#27E9B5]/20 flex flex-col gap-2 shrink-0">
                  <h3 className="text-2xl font-semibold font-[indie_flower] text-emerald-300">
                    {selectedPost.name}
                  </h3>
                  <p className="text-gray-300 text-sm italic">
                    {selectedPost.scientific_name}
                  </p>
                  <hr className="border-gray-600 my-1" />
                  <p className="leading-relaxed text-sm text-gray-200">
                    {selectedPost.description || "Sin descripción disponible."}
                  </p>
                  <div className="flex gap-2 mt-2 justify-end">
                    <span className="px-3 py-0.5 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs">
                      {selectedPost.type || "Planta"}
                    </span>
                    <span className="px-3 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                      {selectedPost.category}
                    </span>
                  </div>
                </div>

                {/* Subir archivo */}
                <label className="mt-4 bg-emerald-600 text-white px-4 py-2.5 rounded-xl cursor-pointer text-center hover:bg-emerald-700 transition block text-sm font-medium shrink-0 shadow-md">
                  📷 Añadir mi foto a esta planta
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) =>
                      handleAction("upload", {
                        file: e.target.files?.[0],
                        plantId: selectedPost.id,
                      })
                    }
                  />
                </label>

                {/* Caja de Comentarios */}
                <div className="mt-4 shrink-0">
                  <h3 className="font-semibold text-sm mb-2 text-gray-200">
                    💬 Dejar Comentario
                  </h3>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="w-full border border-gray-600 bg-gray-900 rounded-xl px-3 py-2 text-white text-sm focus:outline-hidden focus:border-emerald-400"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAction("comment")
                      }
                    />
                    <button
                      onClick={() => handleAction("comment")}
                      className="bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
                    >
                      Comentar
                    </button>
                  </div>
                </div>

                {/* Lista de comentarios */}
                <div className="mt-4 flex-1 overflow-y-auto space-y-2 min-h-32 pr-1">
                  <h4 className="font-semibold text-xs text-emerald-300 uppercase tracking-wider mb-1">
                    Comentarios de la Comunidad
                  </h4>
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    selectedPost.comments.map((c: CommentItem) => (
                      <div
                        key={c.id}
                        className="bg-black/20 p-2.5 rounded-xl text-xs border border-white/5"
                      >
                        <p className="text-gray-400 font-mono text-[10px] mb-1">
                          Usuario #{c.user_id?.substring(0, 5) || "Anónimo"}
                        </p>
                        <p className="text-gray-200">{c.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs italic py-2">
                      Aún no hay comentarios. ¡Sé el primero!
                    </p>
                  )}
                </div>

                <button
                  onClick={closeModal}
                  className="mt-4 w-full py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium text-sm transition shrink-0"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
