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
  image_url: string;
  caption?: string;
  user_id?: string;
  plant_id: string;
  created_at?: string;
  Plants?: { name: string };
  comments?: CommentItem[];
};

type CommentItem = {
  id: string;
  content: string;
  user_id?: string;
  gallery_post_id?: string;
  created_at?: string;
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
  const [myUploadedImages, setMyUploadedImages] = useState<GalleryImage[]>([]); // ✨ Estado para tus publicaciones
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [selectedImageComments, setSelectedImageComments] = useState<
    CommentItem[]
  >([]); // ✨ Comentarios de la foto activa
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { selectedCategory, setCategories, setSelectedCategory } =
    useCategoryShell();

  const handleAction = async (
    type: "fetch" | "upload" | "comment" | "delete",
    payload?: { file?: File; plantId?: string },
  ) => {
    try {
      if (type === "fetch") {
        setLoading(true);

        // 1. Obtener usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id || null;
        setCurrentUserId(userId);

        // 2. Traer TODO el catálogo de plantas sin limitaciones arbitrarias
        const { data: plantsData, error: plantsError } = await supabase
          .from("Plants")
          .select("*")
          .order("name", { ascending: true });

        if (plantsError) throw plantsError;

        // 3. Traer categorías e inyectar iconos
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

        // 4. ✨ Extraer tus imágenes subidas directamente desde gallery_posts de manera segura
        if (userId) {
          const { data: myPosts, error: myPostsError } = await supabase
            .from("gallery_posts")
            .select("id, image_url, caption, plant_id, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (!myPostsError && myPosts) {
            const imagesWithComments = await Promise.all(
              myPosts.map(async (post: any) => {
                const matchingPlant = postsWithIcons.find(
                  (p) => p.id === post.plant_id,
                );

                const { data: postComments } = await supabase
                  .from("comments")
                  .select("*")
                  .eq("gallery_post_id", post.id)
                  .order("created_at", { ascending: true });

                return {
                  id: post.id,
                  image_url: post.image_url,
                  caption: post.caption,
                  plant_id: post.plant_id,
                  created_at: post.created_at,
                  Plants: matchingPlant
                    ? { name: matchingPlant.name }
                    : undefined,
                  comments: postComments || [],
                };
              }),
            );
            setMyUploadedImages(imagesWithComments);
          }
        }

        setError(null);
      }

      if (type === "delete") {
        const postId = payload?.plantId; // Usamos este parámetro para pasar el ID del post
        if (!postId) return;

        const confirmar = confirm(
          "🚨 ¿Estás seguro de que quieres eliminar esta foto de la galería?",
        );
        if (!confirmar) return;

        setLoading(true);

        // 1. Opcional: Si quieres borrar la imagen de Storage, primero tendríamos que obtener su URL/nombre.
        // Por simplicidad y seguridad, eliminamos el registro de la base de datos (las cascadas borrarán comentarios).
        const { error: deleteError } = await supabase
          .from("gallery_posts")
          .delete()
          .eq("id", postId)
          .eq("user_id", currentUserId); // Seguridad: Solo el dueño puede borrarla

        if (deleteError) throw deleteError;

        alert("✅ Foto eliminada correctamente.");
        await handleAction("fetch"); // Recargamos la interfaz
      }

      if (type === "upload") {
        const file = payload?.file;
        const plantId = payload?.plantId;
        if (!file || !plantId) return;

        setUploading(true);
        const fileName = buildUploadFileName(file.name);

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from("gallery_posts")
          .insert({
            image_url: urlData.publicUrl,
            caption: "Nueva foto de la comunidad 🌱",
            user_id: currentUserId,
            plant_id: plantId,
          });

        if (insertError) throw insertError;

        alert("✅ ¡Foto añadida con éxito!");
        await handleAction("fetch");

        if (selectedPost) {
          await refreshSelectedPost(plantId, selectedPost);
        }
        setCurrentImageIndex(0);
      }

      if (type === "comment") {
        if (!newComment.trim() || !selectedPost) return;

        let targetPostId: string | null = null;

        // El comentario debe apuntar al ID único de la FOTO comunitaria activa
        if (currentImageIndex > 0 && selectedPost.allImages) {
          targetPostId = selectedPost.allImages[currentImageIndex - 1].id;
        }

        if (!targetPostId) {
          alert(
            "⚠️ Selecciona una foto comunitaria en el carrusel para añadir un comentario.",
          );
          return;
        }

        const { data: commentData, error: commentError } = await supabase
          .from("comments")
          .insert({
            gallery_post_id: targetPostId,
            content: newComment,
            user_id: currentUserId,
          })
          .select("*")
          .single();

        if (commentError) throw commentError;

        setSelectedImageComments((prev) => [...prev, commentData]);
        setNewComment("");
        await handleAction("fetch"); // Sincroniza feedback superior
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
      .select("id, image_url, caption, plant_id, created_at")
      .eq("plant_id", plantId);

    setSelectedPost({
      ...currentPlant,
      allImages: (communityImages || []) as GalleryImage[],
    });
    setCurrentImageIndex(0);
    setSelectedImageComments([]);
  };

  // Carga automática de comentarios basados en la foto activa del carrusel
  useEffect(() => {
    const fetchCommentsForActiveImage = async () => {
      if (currentImageIndex > 0 && selectedPost?.allImages) {
        const activeImageId = selectedPost.allImages[currentImageIndex - 1].id;
        const { data } = await supabase
          .from("comments")
          .select("*")
          .eq("gallery_post_id", activeImageId)
          .order("created_at", { ascending: true });

        setSelectedImageComments(data || []);
      } else {
        setSelectedImageComments([]);
      }
    };
    fetchCommentsForActiveImage();
  }, [currentImageIndex, selectedPost]);

  const openPost = async (post: GalleryPost) => {
    await refreshSelectedPost(post.id, post);
  };

  useEffect(() => {
    handleAction("fetch");
  }, []);

  const filteredPosts = useMemo(() => {
    return selectedCategory === "Todas"
      ? posts
      : posts.filter((plant) => plant.category === selectedCategory);
  }, [posts, selectedCategory]);

  const closeModal = () => {
    setSelectedPost(null);
    setCurrentImageIndex(0);
  };

  if (loading) {
    return (
      <main className="px-4 w-full h-full">
        <div className="flex flex-col w-full bg-black/20 border border-gray-700 rounded-2xl gap-3 p-3 h-[85vh] animate-pulse">
          <div className="w-full bg-gray-800/50 rounded-xl p-4 space-y-4">
            <div className="h-10 bg-gray-700 rounded-lg w-full"></div>
          </div>

          <div className="flex-1 bg-gray-800/30 rounded-xl p-6 space-y-4">
            <div className="h-8 bg-gray-700 rounded-lg w-1/3"></div>
            <div className="h-48 bg-gray-700 rounded-lg w-full"></div>
            <br />
            <div className="h-8 bg-gray-700 rounded-lg w-1/4"></div>
            <div className="flex gap-5">
              <div className="h-48 bg-gray-700 rounded-lg w-80"></div>
              <div className="h-48 bg-gray-700 rounded-lg w-80"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error)
    return <div className="p-20 text-center text-red-400">{error}</div>;

  return (
    <main className="flex justify-center items-center px-2 py-4 text-white w-364">
      <div className="w-full bg-[url(/bgforest.png)] bg-cover border border-[#d6c8ae]/30 rounded-2xl gap-3 p-3 min-h-[86vh]">
        <div className="flex justify-between items-center mb-3 bg-[#25522c]/40 backdrop-blur-md border border-gray-600/30 p-1.5 rounded-lg">
          <h1 className="text-4xl font-[indie_flower] text-white">
            📷 Galería Comunitaria de ForestHome 🌿
          </h1>
          <Link
            href="/"
            className="text-emerald-300 hover:underline font-medium"
          >
            ← Volver al catálogo
          </Link>
        </div>

        <div className="flex flex-col p-4 w-full bg-[#2C3E50]/50 backdrop-blur-md border-2 border-[#d6c8ae]/50 rounded-xl h-[76vh] overflow-y-auto gap-6 [&::-webkit-scrollbar]:hidden">
          {/* 👤 SECCIÓN: MIS PUBLICACIONES */}
          <section className="w-full bg-slate-900/60 border border-emerald-500/20 p-4 rounded-xl">
            <h2 className="text-xl font-bold text-emerald-400 mb-2">
              👤 Mis Fotos Publicadas
            </h2>
            {myUploadedImages.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No has aportado fotos aún. ¡Añade una foto seleccionando una
                planta del catálogo!
              </p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                {myUploadedImages.map((img) => (
                  <div
                    key={img.id}
                    className="w-70 shrink-0 bg-[#2C3E50]/80 border border-gray-600 rounded-xl p-2"
                  >
                    <img
                      src={img.image_url}
                      alt="Mi publicación"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          {img.Plants?.name || "Planta Desconocida"}
                        </span>
                        {/* 🔥 BOTÓN DE ELIMINAR FLOTANTE */}
                        <button
                          onClick={() =>
                            handleAction("delete", { plantId: img.id })
                          }
                          className="hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md transition-all backdrop-blur-xs opacity-90"
                          title="Eliminar esta foto"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="mt-2 bg-black/30 p-2 rounded-lg max-h-24 overflow-y-auto">
                        <p className="text-[10px] font-bold text-gray-400 border-b border-gray-700 pb-1 mb-1">
                          COMENTARIOS ({img.comments?.length || 0})
                        </p>
                        {img.comments && img.comments.length > 0 ? (
                          img.comments.map((c) => (
                            <p
                              key={c.id}
                              className="text-[11px] text-gray-300 leading-tight mb-1"
                            >
                              <span className="text-emerald-400">↳</span>{" "}
                              {c.content}
                            </p>
                          ))
                        ) : (
                          <p className="text-[10px] text-gray-500 italic">
                            Sin comentarios.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 🌐 SECCIÓN: CATÁLOGO GENERAL DE PLANTAS */}
          <section className="w-full">
            <h2 className="text-xl font-bold text-white mb-3">
              🌱 Catálogo de Plantas ({posts.length})
            </h2>
            {posts.length === 0 ? (
              <p className="text-center text-xl text-gray-200 py-10">
                No hay plantas registradas todavía.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPosts.map((plant) => (
                  <div
                    key={plant.id}
                    onClick={() => openPost(plant)}
                    className="bg-[#2C3E50]/70 border border-gray-500/70 hover:border-emerald-400 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer group"
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
                    <div className="p-4 text-white">
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
          </section>
        </div>
      </div>

      {/* 🖼️ MODAL DE DETALLE */}
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
                    alt="Comunidad"
                    className="w-full h-full object-cover"
                  />
                )}

                <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full z-10 font-medium">
                  {currentImageIndex === 0
                    ? "Foto Oficial 📋"
                    : "Foto de la Comunidad 👥"}
                </span>

                {selectedPost.allImages &&
                  selectedPost.allImages.length > 0 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((p) =>
                            p === 0 ? selectedPost.allImages!.length : p - 1,
                          )
                        }
                        className="absolute left-4 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-600 transition z-10"
                      >
                        ❮
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((p) =>
                            p === selectedPost.allImages!.length ? 0 : p + 1,
                          )
                        }
                        className="absolute right-4 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-600 transition z-10"
                      >
                        ❯
                      </button>
                    </>
                  )}
              </div>

              <div className="md:w-2/5 h-full p-6 bg-gradient-to-b from-[#5baf8bff]/50 to-[#2C3E50] flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
                <div className="p-4 bg-black/20 rounded-2xl border border-[#27E9B5]/20 flex flex-col gap-1 shrink-0">
                  <h3 className="text-2xl font-semibold font-[indie_flower] text-emerald-300">
                    {selectedPost.name}
                  </h3>
                  <p className="text-gray-300 text-sm italic">
                    {selectedPost.scientific_name}
                  </p>
                  <p className="leading-relaxed text-sm text-gray-200 mt-2">
                    {selectedPost.description || "Sin descripción disponible."}
                  </p>
                </div>

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

                {currentImageIndex > 0 ? (
                  <>
                    <div className="mt-4 shrink-0">
                      <h3 className="font-semibold text-sm mb-2 text-gray-200">
                        💬 Dejar Comentario en esta foto
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

                    <div className="mt-4 flex-1 overflow-y-auto space-y-2 min-h-32 pr-1">
                      <h4 className="font-semibold text-xs text-emerald-300 uppercase tracking-wider mb-1">
                        Feedback de esta foto
                      </h4>
                      {selectedImageComments.length > 0 ? (
                        selectedImageComments.map((c) => (
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
                          Sin comentarios en esta foto. ¡Sé el primero!
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 text-xs italic mt-6 text-center bg-black/10 p-3 rounded-xl border border-dashed border-gray-600">
                    Cambia de foto usando las flechas ❯ para ver u opinar sobre
                    las capturas de la comunidad.
                  </p>
                )}

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
