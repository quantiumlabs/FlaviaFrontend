"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// PixelButton Component matching the main app theme
const PixelButton = ({
  children,
  onClick,
  className = "",
  variant = "primary",
  type = "button",
  disabled = false,
}) => {
  const baseStyle =
    "relative px-6 py-3 font-['Press_Start_2P'] text-sm transition-all duration-100 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-orange-500 text-white border-b-4 border-r-4 border-orange-700 hover:border-b-2 hover:border-r-2 hover:translate-y-1 hover:shadow-lg hover:shadow-orange-500/30",
    secondary:
      "bg-white/90 backdrop-blur-sm text-slate-800 border-b-4 border-r-4 border-slate-300 hover:border-b-2 hover:border-r-2 hover:translate-y-1 hover:bg-white",
    ghost:
      "bg-transparent text-slate-700 border-b-4 border-r-4 border-transparent hover:border-slate-300 hover:bg-white/50 hover:border-b-2 hover:border-r-2 hover:translate-y-1",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// PixelInput Component
const PixelInput = ({ ...props }) => {
  return (
    <input
      {...props}
      className={`w-full px-4 py-4 bg-white border-4 border-slate-300 focus:outline-none focus:border-orange-500 font-['Press_Start_2P'] text-xs text-slate-900 placeholder-slate-400 transition-colors ${props.className || ""}`}
    />
  );
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/map");
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get("mode");
      if (mode === "register") {
        setIsLogin(false);
      }
    }
  }, [router]);

  const validateForm = () =>
    formData.username.trim() && formData.password.trim();

  const getErrorMessage = (message) => {
    const errorMessages = {
      "Invalid credentials": "USUARIO OU SENHA INCORRETOS.",
      "Username and password are required": "PREENCHA TODOS OS CAMPOS.",
      "Usuário já existe": "NOME DE USUARIO JA EM USO.",
      default: "ALGO DEU ERRADO. TENTE NOVAMENTE.",
    };
    return errorMessages[message] || errorMessages.default;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("PREENCHA TODOS OS CAMPOS COM VALORES VALIDOS.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username.trim(),
            password: formData.password,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro inesperado.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (!isLogin) {
        localStorage.setItem("isFirstLogin", "true");
      }

      router.push("/map");
    } catch (error) {
      setError(getErrorMessage(error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-center items-center min-h-screen bg-[url('/story.png')] bg-cover bg-center bg-no-repeat overflow-hidden">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />

      <div className="z-10 w-full max-w-lg px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-amber-50/95 backdrop-blur-md border-4 border-orange-500 p-8 shadow-[8px_8px_0_0_rgba(249,115,22,0.5)]"
        >
          <div className="text-center mb-8">
            <h1
              className="font-['Press_Start_2P'] text-2xl md:text-3xl text-orange-600 mb-2 tracking-widest"
              style={{
                textShadow: "2px 2px 0 rgba(234,88,12,0.2)",
              }}
            >
              {isLogin ? "LOGIN" : "CADASTRO"}
            </h1>
            <p className="font-['Press_Start_2P'] text-[10px] text-slate-500 mt-6 leading-loose">
              {isLogin
                ? "BEM-VINDO DE VOLTA AO CEUS"
                : "JUNTE-SE A NOSSA JORNADA"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block font-['Press_Start_2P'] text-[10px] text-slate-600 mb-3">
                  USUARIO
                </label>
                <PixelInput
                  type="text"
                  placeholder="DIGITE SEU NOME"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block font-['Press_Start_2P'] text-[10px] text-slate-600 mb-3">
                  SENHA
                </label>
                <PixelInput
                  type="password"
                  placeholder="******"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-100 border-4 border-red-500 p-4 mt-6">
                    <p className="font-['Press_Start_2P'] text-[10px] text-red-700 leading-relaxed text-center">
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-6">
              <PixelButton
                type="submit"
                variant="primary"
                className="w-full flex justify-center items-center h-16"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">CARREGANDO...</span>
                ) : (
                  <span>{isLogin ? "ENTRAR" : "CRIAR CONTA"}</span>
                )}
              </PixelButton>
            </div>

            <div className="pt-4 text-center">
              <PixelButton
                type="button"
                variant="ghost"
                className="text-[10px] w-full"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setFormData({ username: "", password: "" });
                }}
              >
                {isLogin
                  ? "NAO TEM CONTA? CADASTRE-SE"
                  : "JA TEM CONTA? FAZER LOGIN"}
              </PixelButton>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
