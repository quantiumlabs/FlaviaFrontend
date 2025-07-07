"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud } from "lucide-react";
import { VideoIntro } from "@/components/VideoIntro";
import confetti from "canvas-confetti";
import Cookies from "js-cookie";

// PixelButton Component
const PixelButton = ({
  children,
  onClick,
  className = "",
  variant = "primary",
}) => {
  const baseStyle =
    "relative px-6 py-3 font-['Press_Start_2P'] text-sm transition-all duration-100 active:translate-y-1";
  const variants = {
    primary:
      "bg-orange-500 text-white border-b-4 border-r-4 border-orange-700 hover:border-b-2 hover:border-r-2 hover:translate-y-1 hover:shadow-lg hover:shadow-orange-500/30",
    secondary:
      "bg-white/10 backdrop-blur-sm text-white border-b-4 border-r-4 border-white/30 hover:border-b-2 hover:border-r-2 hover:translate-y-1 hover:bg-white/20",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// PixelTextTransition Component
const PixelTextTransition = ({ onComplete }) => {
  const [stage, setStage] = useState("initial");
  const text = "C é u s";

  useEffect(() => {
    const centerTimer = setTimeout(() => {
      setStage("center");
    }, 1000);

    const exitTimer = setTimeout(() => {
      setStage("exit");
    }, 5000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearTimeout(centerTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const containerVariants = {
    initial: {
      x: -window.innerWidth,
    },
    center: {
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
    exit: {
      x: window.innerWidth,
      transition: {
        duration: 0.8,
        ease: "easeIn",
      },
    },
  };

  const letterVariants = {
    initial: (index) => ({
      opacity: 0,
      filter: "blur(10px)",
      transition: {
        delay: index * 0.1,
      },
    }),
    center: (index) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: index * 0.1,
        duration: 0.3,
      },
    }),
    exit: {
      opacity: 0,
      filter: "blur(10px)",
    },
  };

  return (
    <motion.div
      className="flex fixed inset-0 justify-center items-center bg-white"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex justify-center"
        variants={containerVariants}
        initial="initial"
        animate={stage}
      >
        {text.split("").map((letter, index) => (
          <motion.span
            key={index}
            custom={index}
            variants={letterVariants}
            initial="initial"
            animate={stage}
            className="inline-block font-['Press_Start_2P'] text-6xl text-orange"
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [showPixelTransition, setShowPixelTransition] = useState(false);
  const [showMainContent, setShowMainContent] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const [audioChoiceMade, setAudioChoiceMade] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const videoIntroAudioRef = useRef(null);
  const ceusLogoAudioRef = useRef(null);
  const mainMenuAudioRef = useRef(null);
  const menuAudioRef = useRef(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      router.push("/map");
    } else {
      // Check if it's Safari
      const safariCheck = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent,
      );
      setIsSafari(safariCheck);

      // If not Safari, no audio choice needed
      if (!safariCheck) {
        setAudioChoiceMade(true);
      }

      setIsVisible(true);
    }
  }, [router]);

  // Stop intro audios and start menu audio when main content shows
  useEffect(() => {
    if (showMainContent) {
      // Fade out and stop intro audios
      if (videoIntroAudioRef.current) {
        const fadeOut = setInterval(() => {
          if (videoIntroAudioRef.current.volume > 0.1) {
            videoIntroAudioRef.current.volume -= 0.1;
          } else {
            videoIntroAudioRef.current.pause();
            clearInterval(fadeOut);
          }
        }, 100);
      }
      if (ceusLogoAudioRef.current) {
        const fadeOut = setInterval(() => {
          if (ceusLogoAudioRef.current.volume > 0.1) {
            ceusLogoAudioRef.current.volume -= 0.1;
          } else {
            ceusLogoAudioRef.current.pause();
            clearInterval(fadeOut);
          }
        }, 100);
      }

      // Start main menu audio if audio is enabled
      if (audioEnabled) {
        startMainMenuAudio();
      }
    }
  }, [showMainContent, audioEnabled]);

  // Function to play intro audios - will be passed to VideoIntro
  const playIntroAudios = () => {
    if (videoIntroAudioRef.current) {
      videoIntroAudioRef.current.currentTime = 0;
      videoIntroAudioRef.current.volume = 0.5;
      videoIntroAudioRef.current.play().catch(() => {});
    }
    if (ceusLogoAudioRef.current) {
      ceusLogoAudioRef.current.currentTime = 0;
      ceusLogoAudioRef.current.volume = 0.5;
      ceusLogoAudioRef.current.play().catch(() => {});
    }
  };

  // Function to start main menu audio
  const startMainMenuAudio = () => {
    if (mainMenuAudioRef.current) {
      mainMenuAudioRef.current.volume = 0.5;
      mainMenuAudioRef.current.play().catch(() => {});
    }

    if (menuAudioRef.current) {
      menuAudioRef.current.volume = 0.5;
      menuAudioRef.current.play().catch(() => {});
    }
  };

  // Function to enable audio after user interaction
  const enableAudio = () => {
    setAudioEnabled(true);
    setShowAudioPrompt(false);
    setAudioChoiceMade(true);
    if (showMainContent) {
      startMainMenuAudio();
    }
  };

  // Function to dismiss audio prompt
  const dismissAudioPrompt = () => {
    setShowAudioPrompt(false);
    setAudioChoiceMade(true);
  };
  const handleIntroComplete = () => {
    setIsIntroComplete(true);
    setShowPixelTransition(true);
  };

  const handleTransitionComplete = () => {
    setShowPixelTransition(false);

    // For Safari users, show audio prompt before main content
    if (isSafari && !audioChoiceMade) {
      setShowAudioPrompt(true);
    } else {
      setShowMainContent(true);
    }
  };

  // Effect to show main content after audio choice is made
  useEffect(() => {
    if (
      audioChoiceMade &&
      !showMainContent &&
      !showPixelTransition &&
      isIntroComplete
    ) {
      setShowMainContent(true);
    }
  }, [audioChoiceMade, showMainContent, showPixelTransition, isIntroComplete]);

  const handleTitleClick = () => {
    setClickCount((prev) => prev + 1);
    if (clickCount === 2) {
      triggerConfetti();
      setShowModal(true);
      setClickCount(0);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <>
      {/* Audio elements - moved outside AnimatePresence to persist */}
      <audio
        ref={videoIntroAudioRef}
        src="/track/videointro.wav"
        className="hidden"
      />
      <audio
        ref={ceusLogoAudioRef}
        src="/track/ceuslogo.wav"
        className="hidden"
      />
      <audio
        ref={mainMenuAudioRef}
        src="/track/mainmenu.wav"
        loop
        className="hidden"
      />
      <audio ref={menuAudioRef} src="/track/menu.wav" className="hidden" />

      {/* Audio prompt - show independently of main content */}
      <AnimatePresence>
        {showAudioPrompt && (
          <motion.div
            className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="p-6 w-full max-w-sm text-center bg-white rounded-lg shadow-xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="font-['Press_Start_2P'] text-lg text-orange-500 mb-4">
                🎵 Ativar Áudio?
              </h2>
              <p className="text-gray-700 mb-6">
                Deseja ativar o áudio do menu principal para uma experiência
                mais imersiva?
              </p>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 text-white bg-orange-500 rounded hover:bg-orange-600 flex-1"
                  onClick={enableAudio}
                >
                  Sim
                </button>
                <button
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 flex-1"
                  onClick={dismissAudioPrompt}
                >
                  Não
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isVisible && !isIntroComplete && (
          <VideoIntro
            onIntroComplete={handleIntroComplete}
            onPlayAudios={playIntroAudios}
          />
        )}

        {showPixelTransition && (
          <PixelTextTransition onComplete={handleTransitionComplete} />
        )}

        {showMainContent && (
          <motion.div
            className="relative min-h-screen w-full overflow-x-hidden bg-[url('/story.png')] bg-cover bg-center bg-no-repeat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            />

            <div className="relative z-10 w-full">
              <header className="p-6">
                <div className="flex justify-between items-center mx-auto max-w-7xl">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                  >
                    <Cloud className="w-8 h-8 text-white pixel-icon" />
                  </motion.div>
                  <PixelButton
                    variant="secondary"
                    onClick={() => router.push("/auth")}
                    className="text-xs"
                  >
                    LOGIN
                  </PixelButton>
                </div>
              </header>

              <main className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-center px-6 py-12">
                <AnimatePresence>
                  {showModal && (
                    <motion.div
                      className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="p-6 w-full max-w-sm text-center bg-white rounded-lg shadow-xl"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                      >
                        <h2 className="font-['Press_Start_2P'] text-xl text-orange-500 mb-4">
                          🎉 Créditos 🎉
                        </h2>
                        <p className="text-gray-700">
                          Céus foi desenvolvido por{" "}
                          <a
                            href="https://github.com/quantiumlabs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:underline"
                          >
                            Quantium Labs
                          </a>
                        </p>
                        <button
                          className="px-4 py-2 mt-6 text-white bg-orange-500 rounded hover:bg-orange-600"
                          onClick={() => setShowModal(false)}
                        >
                          Fechar
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading screen for Safari users waiting for audio choice */}
                {isSafari &&
                  !audioChoiceMade &&
                  isIntroComplete &&
                  !showPixelTransition && (
                    <motion.div
                      className="flex fixed inset-0 z-40 justify-center items-center bg-black"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-white font-['Press_Start_2P'] text-sm">
                          Aguardando configuração de áudio...
                        </p>
                      </div>
                    </motion.div>
                  )}

                <motion.div
                  className="space-y-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  <h1
                    className="font-['Press_Start_2P'] text-6xl md:text-6xl text-white leading-relaxed tracking-wider"
                    onClick={handleTitleClick}
                    style={{
                      textShadow: `
                        2px 2px 0 #ff6b4a,
                        4px 4px 0 #ff8f6b,
                        6px 6px 0 rgba(0, 0, 0, 0.5)
                      `,
                    }}
                  >
                    Céus
                  </h1>

                  <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                    Explore o mundo, compartilhe momentos e descubra histórias
                    únicas em cada lugar que visita.
                  </p>

                  <PixelButton
                    onClick={() => router.push("/auth?mode=register")}
                    className="px-8 py-4 text-sm md:text-base"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    COMEÇAR JORNADA
                    <motion.span
                      className="inline-block ml-2"
                      animate={{ x: isHovering ? 5 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      →
                    </motion.span>
                  </PixelButton>
                </motion.div>
              </main>

              <footer className="fixed bottom-0 left-0 py-6 w-full text-center text-white/60">
                <div className="text-white/60">QL2.0 BETA 2025</div>
                <motion.button
                  onClick={() => router.push("/privacy")}
                  className="text-sm transition-colors text-white/40 hover:text-white/80"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Política de Privacidade
                </motion.button>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
