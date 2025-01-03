'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Cloud, Map, Users, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoIntro } from "@/components/VideoIntro";

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



export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/map");
    } else {
      setIsVisible(true);
    }
  }, [router]);

  return (
    <AnimatePresence>
      {isVisible && (
        <VideoIntro onIntroComplete={() => setIsIntroComplete(true)}>
          <motion.div 
            className="relative min-h-screen w-full overflow-x-hidden bg-[url('/story.png')] bg-cover bg-center bg-no-repeat"
            initial={{ opacity: 0 }}
            animate={{ opacity: isIntroComplete ? 1 : 0 }}
            transition={{ duration: 1 }}
          >
            {/* Gradient Overlay */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            />

            <div className="relative z-10 w-full">
              {/* Header */}
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

              {/* Hero Section */}
              <main className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-center px-6 py-12">
                  <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                  >
                    {/* Title with Pixel Art Shadow */}
                    <h1
                      className="font-['Press_Start_2P'] text-4xl md:text-6xl text-white leading-relaxed tracking-wider"
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



              {/* Footer */}
              <footer className="text-center py-8 text-white/60">

              </footer>
            </div>
          </motion.div>
        </VideoIntro>
      )}
    </AnimatePresence>
  );
}
