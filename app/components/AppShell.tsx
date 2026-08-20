<<<<<<< HEAD
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCategoryShell } from "./CategoryShell";

type User = {
  id: string;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { categories, selectedCategory, setSelectedCategory } =
    useCategoryShell();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen flex justify-center items-center px-2 py-4">
      <div className="rounded-2xl max-w-[90vw] h-[95vh] flex flex-col bg-linear-to-t from-[#d6c8ae]/50 to-[#3B5265]/70 backdrop-blur-xs border-2 border-[#d6c8ae]/50 px-4 py-3">
        <header className="flex pb-3 items-center justify-between">
          {/* Sesión */}
          <div className="flex gap-3 sm:flex-row sm:items-center">
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-xs md:text-sm text-[#c0141d] hover:text-red-400 cursor-pointer border transition border-[#91D49D] bg-[#162936]/70 px-2 md:px-4 py-2 rounded-2xl backdrop-blur-md"
              >
                Cerrar Sesión
              </button>
            ) : (
              <Link
                href="/auth"
                className="text-sm text-[#27E9B5] hover:bg-emerald-700 cursor-pointer transition bg-[#3B5265] px-4 py-2 rounded-2xl text-center"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          <nav className="flex lg:flex-wrap overflow-x-auto w-40 lg:w-210 items-center gap-3 text-sm font-medium border-2 border-[#d6c8ae]/40 rounded-2xl mx-2 px-2 -py-1 lg:px-4 lg:py-1 bg-[#5baf8bff]/50 backdrop-blur-md">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-2xl transition ${
                  selectedCategory === cat
                    ? "bg-emerald-700 text-white"
                    : "hover:bg-emerald-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          <h1 className="text-(--white-front) text-[20px] lg:text-4xl font-[indie_flower]">
            ForestHome
          </h1>
        </header>

        <div className="flex min-h-0 items-center">
          <aside className="flex flex-col justify-evenly items-start h-[70%] mr-2 -ml-2 lg:m-2 w-10 lg:w-35">
            <Link
              href="/"
              className="hover:text-emerald-600 transition border border-[#91D49D] bg-[#3B5265] py-1 px-2 md:px-3 rounded-2xl text-md lg:text-2xl"
            >
              🍃
            </Link>
            <Link
              href="/mi-huerto"
              className="hover:text-emerald-600 transition border border-[#91D49D] bg-[#3B5265] py-1 px-2 md:px-3 rounded-2xl text-md lg:text-2xl"
            >
              🌱
            </Link>
            <Link
              href="/galeria"
              className="hover:text-emerald-600 transition border border-[#91D49D] bg-[#3B5265] py-1 px-2 md:px-3 rounded-2xl text-md lg:text-2xl"
            >
              🖼️
            </Link>

            {/* <Link
              href="#"
              className="hover:text-emerald-600 transition border border-[#91D49D] bg-[#3B5265] py-1 px-3 rounded-2xl text-2xl"
            >
              🪢
            </Link> */}
          </aside>

          <section className="w-750">{children}</section>
        </div>
      </div>
    </main>
  );
}
=======
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCategoryShell } from "./CategoryShell";

type User = {
  id: string;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { categories, selectedCategory, setSelectedCategory } =
    useCategoryShell();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen flex justify-center items-center px-2 py-4">
      <div className="rounded-2xl w-full max-w-[1550px] h-[95vh] flex flex-col bg-linear-to-t from-[#d6c8ae]/50 to-[#3B5265]/70 backdrop-blur-xs border-2 border-[#d6c8ae]/50 px-4 py-3">
        <header className="flex pb-3 items-center justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-sm text-[#c0141d] hover:text-red-400 cursor-pointer border transition border-[#91D49D] bg-[#162936]/70 px-4 py-2 rounded-2xl backdrop-blur-md"
              >
                Cerrar Sesión
              </button>
            ) : (
              <Link
                href="/auth"
                className="text-sm text-[#27E9B5] hover:bg-emerald-700 cursor-pointer transition bg-[#3B5265] px-4 py-2 rounded-2xl text-center"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium border-2 border-[#d6c8ae]/40 rounded-2xl px-4 py-1 bg-[#5baf8bff]/50 backdrop-blur-md">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-2xl transition ${
                  selectedCategory === cat
                    ? "bg-emerald-700 text-white"
                    : "hover:bg-emerald-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          <h1 className="text-(--white-front) text-4xl font-[indie_flower]">
            ForestHome 🌿
          </h1>
        </header>

        <div className="flex min-h-0 items-center">
          <aside className="flex flex-col justify-evenly items-start h-[80%] m-2 w-35">
            <Link
              href="/"
              className="hover:text-emerald-600 transition border border-[#91D49D] bg-[#3B5265] py-1 px-3 rounded-2xl text-2xl"
            >
              🍃
            </Link>
            <Link
              href="/mi-huerto"
              className="hover:text-emerald-600 transition border border-[#91D49D] bg-[#3B5265] py-1 px-3 rounded-2xl text-2xl"
            >
              🌱
            </Link>
            <Link
              href="/galeria"
              className="hover:text-emerald-600 transition border border-[#91D49D] bg-[#3B5265] py-1 px-3 rounded-2xl text-2xl"
            >
              🖼️
            </Link>

            {/* <Link
              href="#"
              className="hover:text-emerald-600 transition border border-[#91D49D] bg-[#3B5265] py-1 px-3 rounded-2xl text-2xl"
            >
              🪢
            </Link> */}
          </aside>

          <section className="w-750">{children}</section>
        </div>
      </div>
    </main>
  );
}
>>>>>>> 02f9303c8184b0748965b59f13c2968fd053d4f2
