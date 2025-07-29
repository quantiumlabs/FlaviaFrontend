"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud } from "lucide-react";
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
    const token = Cookies.get("token");
    if (token) {
      router.push("/map");
    } else {
      setIsVisible(true);
    }
  }, [router]);

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
  const [showStart, setShowStart] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isBloomComplete, setIsBloomComplete] = useState(false);
  const [showPixelTransition, setShowPixelTransition] = useState(false);
  const [showMainContent, setShowMainContent] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  
  const videoRef = useRef(null);
  const videoIntroAudioRef = useRef(null);
  const ceusLogoAudioRef = useRef(null);
  const mainMenuAudioRef = useRef(null);
  const menuAudioRef = useRef(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      router.push("/map");
    } else {
      setIsVisible(true);
    }
  }, [router]);

  // Stop intro audios and start menu audio when main content shows
  useEffect(() => {
    if (showMainContent) {
      // Fade out and stop intro audios
      if (videoIntroAudioRef.current) {
        const fadeOut = setInterval(() => {
          if (videoIntroAudioRef.current.volume > 1) {
            videoIntroAudioRef.current.volume -= 1;
          } else {
            videoIntroAudioRef.current.pause();
            clearInterval(fadeOut);
          }
        }, 100);
      }
      if (ceusLogoAudioRef.current) {
        const fadeOut = setInterval(() => {
          if (ceusLogoAudioRef.current.volume > 1) {
            ceusLogoAudioRef.current.volume -= 1;
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

  // Video playback effects
  useEffect(() => {
    if (!isVideoPlaying) return;
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Video playback failed:", error);
        handleVideoEnd();
      });
    }
  }, [isVideoPlaying]);

  useEffect(() => {
    if (!isVideoPlaying) return;
    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', () => {
        if (videoRef.current.duration - videoRef.current.currentTime < 0.5) {
          handleVideoEnd();
        }
      });
    }
  }, [isVideoPlaying]);

  // Function to play intro audios
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
      mainMenuAudioRef.current.volume = 1;
      mainMenuAudioRef.current.play().catch(() => {});
    }

    if (menuAudioRef.current) {
      menuAudioRef.current.volume = 1;
      menuAudioRef.current.play().catch(() => {});
    }
  };

  

  const handleStart = () => {
    setAudioEnabled(true);
    setShowStart(false);
    setIsVideoPlaying(true);

    // Unlock all audio files by playing and pausing them immediately.
    const audioElements = [
      videoIntroAudioRef,
      ceusLogoAudioRef,
      mainMenuAudioRef,
      menuAudioRef,
    ];

    audioElements.forEach((audioRef) => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        audioRef.current.pause();
      }
    });

    // Play intro audios
    playIntroAudios();

    // Play main menu audio after a 14-second delay
    setTimeout(() => {
      startMainMenuAudio();
    }, 14000);

    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleVideoEnd = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsVideoPlaying(false);
      setTimeout(() => {
        setIsBloomComplete(true);
        handleIntroComplete();
      }, 3000);
    }, 500);
  };

  const handleIntroComplete = () => {
    setShowPixelTransition(true);
  };

  const handleTransitionComplete = () => {
    setShowPixelTransition(false);
    setShowMainContent(true);
  };

  useEffect(() => {
    if (
      !showMainContent &&
      !showPixelTransition &&
      isBloomComplete
    ) {
      setShowMainContent(true);
    }
  }, [showMainContent, showPixelTransition, isBloomComplete]);

  const handleTitleClick = () => {
    setClickCount((prev) => prev + 1);
    if (clickCount === 2) {
      triggerConfetti();
      setShowModal(true);
      setClickCount(0);
    }
  };

  const playMenuSound = () => {
    if (menuAudioRef.current) {
      menuAudioRef.current.currentTime = 0;
      menuAudioRef.current.play().catch(() => {});
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
        playsInline
      />
      <audio
        ref={ceusLogoAudioRef}
        src="/track/ceuslogo.wav"
        className="hidden"
        playsInline
      />
      <audio
        ref={mainMenuAudioRef}
        src="/track/mainmenu.wav"
        loop
        className="hidden"
        playsInline
      />
      <audio ref={menuAudioRef} src="/track/menu.wav" className="hidden" playsInline />

      <AnimatePresence>
        {showTransitionOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="fixed inset-0 z-[999] bg-white"
          />
        )}
      </AnimatePresence>

      <div className="relative w-full h-screen">
        <AnimatePresence mode="wait">
          {isVisible && !isBloomComplete && (
            <>
              {/* Start Button Overlay */}
              <AnimatePresence>
                {showStart && (
                  <motion.div
                    className="flex overflow-hidden absolute inset-0 z-50 flex-col justify-center items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{
                      background: 'linear-gradient(135deg, #e0f2f7 0%, #ffffff 50%, #ffe0b2 100%)'
                    }}
                  >
                    {/* Animated Clouds Background */}
                    <div className="absolute inset-0">
                      {[...Array(10)].map((_, i) => (
                        <motion.div
                          key={`cloud-${i}`}
                          className="absolute rounded-full opacity-60"
                          initial={{
                            x: `${Math.random() * 120 - 10}%`,
                            y: `${Math.random() * 120 - 10}%`,
                            scale: 0
                          }}
                          animate={{
                            x: [`${Math.random() * 120 - 10}%`, `${Math.random() * 120 - 10}%`],
                            y: [`${Math.random() * 120 - 10}%`, `${Math.random() * 120 - 10}%`],
                            scale: [0.5, 1, 0.5],
                            rotate: [0, 180]
                          }}
                          transition={{
                            duration: 10 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 3
                          }}
                          style={{
                            width: `${Math.random() * 150 + 80}px`,
                            height: `${Math.random() * 80 + 40}px`,
                            background: 'rgba(255, 255, 255, 0.6)',
                            filter: 'blur(10px)',
                            borderRadius: '50px'
                          }}
                        />
                      ))}
                    </div>

                    {/* Floating Particles */}
                    <div className="absolute inset-0">
                      {[...Array(15)].map((_, i) => (
                        <motion.div
                          key={`particle-${i}`}
                          className="absolute rounded-full"
                          initial={{
                            x: `${Math.random() * 100}%`,
                            y: `${100 + Math.random() * 10}%`,
                            opacity: 0
                          }}
                          animate={{
                            y: [`${100 + Math.random() * 10}%`, `${-10}%`],
                            opacity: [0, 0.6, 0],
                            scale: [0.3, 0.8, 0.3]
                          }}
                          transition={{
                            duration: 6 + Math.random() * 3,
                            delay: Math.random() * 2,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                          style={{
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            background: 'rgba(255, 165, 0, 0.5)',
                            boxShadow: '0 0 8px rgba(255, 165, 0, 0.3)'
                          }}
                        />
                      ))}
                    </div>

                    {/* Enhanced Heavenly Button */}
                    <motion.button
                      onClick={handleStart}
                      className="relative px-12 py-6 text-xl font-['Press_Start_2P'] text-white rounded-xl overflow-hidden group"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 1, type: "spring", bounce: 0.2 }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: '0 10px 30px rgba(249, 115, 22, 0.5)'
                      }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        background: 'linear-gradient(45deg, #f97316, #fb923c, #f97316)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      {/* Button Background Glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transition-opacity duration-500 transform -skew-x-12 group-hover:opacity-20" />
                      
                      {/* Button Sparkles */}
                      <div className="absolute inset-0">
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={`sparkle-${i}`}
                            className="absolute bg-white rounded-full"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0],
                              rotate: [0, 180]
                            }}
                            transition={{
                              duration: 2,
                              delay: i * 0.3,
                              repeat: Infinity,
                              repeatDelay: 1
                            }}
                            style={{
                              width: '3px',
                              height: '3px',
                              left: `${Math.random() * 80 + 10}%`,
                              top: `${Math.random() * 80 + 10}%`,
                              filter: 'blur(0.5px)'
                            }}
                          />
                        ))}
                      </div>
                      
                      <span className="relative z-10">Entrar no Céus</span>
                    </motion.button>

                    {/* Ethereal Mist Effect */}
                    <div className="absolute right-0 bottom-0 left-0 h-32">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={`mist-${i}`}
                          className="absolute bottom-0 rounded-full"
                          initial={{ 
                            x: `${Math.random() * 100}%`,
                            y: '100%',
                            opacity: 0 
                          }}
                          animate={{
                            y: [100, -30],
                            opacity: [0, 0.2, 0],
                            scale: [0.3, 1]
                          }}
                          transition={{
                            duration: 4,
                            delay: i * 1,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                          style={{
                            width: `${Math.random() * 100 + 50}px`,
                            height: `${Math.random() * 50 + 20}px`,
                            background: 'rgba(255, 255, 255, 0.3)',
                            filter: 'blur(10px)'
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video Layer */}
              <motion.div
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 1, filter: 'blur(0px)' }}
                animate={{ 
                  opacity: isTransitioning ? 0 : 1,
                  scale: isTransitioning ? 1.1 : 1,
                  filter: isTransitioning ? 'blur(20px)' : 'blur(0px)'
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                <video
                  ref={videoRef}
                  className="object-cover w-full h-full"
                  src="/intro.mp4"
                  muted
                  playsInline
                  style={{ display: isVideoPlaying ? "block" : "none" }}
                />
              </motion.div>

              {/* Transition Effects */}
              <AnimatePresence>
                {isTransitioning && !isBloomComplete && (
                  <>
                    {/* Dynamic Particle Field */}
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2 }}
                    >
                      {[...Array(100)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full"
                          initial={{
                            x: `${50}%`,
                            y: `${50}%`,
                            scale: 0,
                            opacity: 0
                          }}
                          animate={{
                            x: `${Math.random() * 100}%`,
                            y: `${Math.random() * 100}%`,
                            scale: [0, 1, 0],
                            opacity: [0, 0.4, 0],
                            filter: ['blur(0px)', 'blur(2px)', 'blur(0px)']
                          }}
                          transition={{
                            duration: 2 + Math.random() * 2,
                            ease: "easeOut",
                            delay: Math.random() * 0.5
                          }}
                          style={{
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            background: `rgba(${Math.random() * 50 + 200}, ${Math.random() * 50 + 150}, ${Math.random() * 50 + 100}, 0.3)`,
                            backdropFilter: 'blur(8px)'
                          }}
                        />
                      ))}
                    </motion.div>

                    {/* Blurred Background Elements */}
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={`blur-${i}`}
                        className="absolute rounded-full"
                        initial={{
                          x: `${Math.random() * 100}%`,
                          y: `${Math.random() * 100}%`,
                          scale: 0,
                          opacity: 0
                        }}
                        animate={{
                          scale: [1, 2, 1],
                          opacity: [0, 0.3, 0],
                          filter: ['blur(10px)', 'blur(20px)', 'blur(10px)']
                        }}
                        transition={{
                          duration: 3,
                          delay: i * 0.2,
                          ease: "easeInOut"
                        }}
                        style={{
                          width: '200px',
                          height: '200px',
                          background: `radial-gradient(circle, rgba(255,180,100,0.2) 0%, rgba(255,140,50,0.1) 50%, transparent 100%)`,
                          mixBlendMode: 'screen'
                        }}
                      />
                    ))}

                    {/* Floating Dust Particles */}
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {[...Array(50)].map((_, i) => (
                        <motion.div
                          key={`dust-${i}`}
                          className="absolute rounded-full"
                          initial={{
                            x: `${Math.random() * 100}%`,
                            y: `${Math.random() * 100}%`,
                            opacity: 0
                          }}
                          animate={{
                            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            opacity: [0, 0.3, 0]
                          }}
                          transition={{
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                          }}
                          style={{
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            background: 'rgba(255, 255, 255, 0.3)',
                            filter: 'blur(1px)'
                          }}
                        />
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </>
          )}

          {showPixelTransition && (
            <PixelTextTransition onComplete={handleTransitionComplete} />
          )}

          {showMainContent && (
            <motion.div
              className="relative z-10 bg-black"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ 
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)'
              }}
              transition={{ 
                duration: 3,
                ease: "easeOut",
                delay: 0.5
              }}
            >
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
                        onClick={() => {
                          playMenuSound();
                          setShowTransitionOverlay(true);
                          setTimeout(() => {
                            router.push("/auth");
                          }, 1000); // Adjust delay as needed for transition
                        }}
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
                    onClick={() => {
                      playMenuSound();
                      setShowTransitionOverlay(true);
                      setTimeout(() => {
                        router.push("/auth?mode=register");
                      }, 1000); // Adjust delay as needed for transition
                    }}
                    className="px-8 py-4 text-sm md:text-base"
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
                <div className="text-white/60">QL 2.0.0-beta 2025</div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
