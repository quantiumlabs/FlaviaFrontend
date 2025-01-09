'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud } from "lucide-react";
import { VideoIntro } from "@/components/VideoIntro";
import confetti from "canvas-confetti";

// PixelButton Component
const PixelButton = ({ children, onClick, className = "", variant = "primary" }) => {
  const baseStyle = "relative px-6 py-3 font-['Press_Start_2P'] text-sm transition-all duration-100 active:translate-y-1";
  const variants = {
    primary: "bg-orange-500 text-white border-b-4 border-r-4 border-orange-700 hover:border-b-2 hover:border-r-2 hover:translate-y-1 hover:shadow-lg hover:shadow-orange-500/30",
    secondary: "bg-white/10 backdrop-blur-sm text-white border-b-4 border-r-4 border-white/30 hover:border-b-2 hover:border-r-2 hover:translate-y-1 hover:bg-white/20"
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
  const [stage, setStage] = useState('initial');
  const text = "C é u s";
  
  useEffect(() => {
    const centerTimer = setTimeout(() => {
      setStage('center');
    }, 1000);

    const exitTimer = setTimeout(() => {
      setStage('exit');
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
        ease: "easeOut"
      }
    },
    exit: {
      x: window.innerWidth,
      transition: {
        duration: 0.8,
        ease: "easeIn"
      }
    }
  };

  const letterVariants = {
    initial: (index) => ({
      opacity: 0,
      filter: "blur(10px)",
      transition: {
        delay: index * 0.1
      }
    }),
    center: (index) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: index * 0.1,
        duration: 0.3
      }
    }),
    exit: {
      opacity: 0,
      filter: "blur(10px)",
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-white flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex justify-center"
        variants={containerVariants}
        initial="initial"
        animate={stage}
      >
        {text.split('').map((letter, index) => (
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/map");
    } else {
      setIsVisible(true);
    }
  }, [router]);

  const handleIntroComplete = () => {
    setIsIntroComplete(true);
    setShowPixelTransition(true);
  };

  const handleTransitionComplete = () => {
    setShowPixelTransition(false);
    setShowMainContent(true);
  };

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
    <AnimatePresence mode="wait">
      {isVisible && !isIntroComplete && (
        <VideoIntro onIntroComplete={handleIntroComplete} />
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
              <div className="max-w-7xl mx-auto flex justify-between items-center">
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
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full"
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
                        className="mt-6 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                        onClick={() => setShowModal(false)}
                      >
                        Fechar
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

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

                <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
                  Explore o mundo, compartilhe momentos e descubra histórias únicas em cada lugar que visita.
                </p>

                <PixelButton
                  onClick={() => router.push("/auth?mode=register")}
                  className="text-sm md:text-base px-8 py-4"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  COMEÇAR JORNADA
                  <motion.span
                    className="ml-2 inline-block"
                    animate={{ x: isHovering ? 5 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    →
                  </motion.span>
                </PixelButton>
              </motion.div>
            </main>

            <footer className="fixed bottom-0 left-0 w-full text-center py-6 text-white/60">
              V QL1.0.0 2025
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}