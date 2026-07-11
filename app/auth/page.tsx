"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("✅ Revisa tu correo para confirmar tu cuenta");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setMessage("❌ " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage("❌ Ingresa tu correo para restablecer la contraseña");
      return;
    }
    setResetLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage("✅ Revisa tu correo para restablecer tu contraseña");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setMessage("❌ " + message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-[#496F82]/30 rounded-3xl shadow-xl p-10 w-full max-w-md w-600 backdrop-blur-sm">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🌱</span>
          <h1 className="text-3xl font-bold text-[#5b869c] text-shadow-sm text-shadow-blue-300">
            {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
          </h1>
          <p className="text-gray-300 mt-2">
            {isLogin
              ? "Inicia sesión para guardar tus plantas favoritas"
              : "Únete a la comunidad de HuertoLIFE"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-emerald-500"
              required
            />
            {isLogin && (
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="text-sm text-emerald-400 hover:underline font-medium"
                >
                  {resetLoading ? "Enviando..." : "¿Olvidaste tu contraseña?"}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-emerald-700 transition disabled:opacity-70"
          >
            {loading
              ? "Procesando..."
              : isLogin
                ? "Iniciar Sesión"
                : "Crear Cuenta"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-sm font-medium">{message}</p>
        )}

        <p className="text-center mt-6 text-sm text-gray-300">
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-400 hover:underline font-medium"
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </main>
  );
}
