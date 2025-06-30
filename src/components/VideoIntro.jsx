import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

export const VideoIntro = ({ onIntroComplete, onPlayAudios, children }) => {
  const [showStart, setShowStart] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isBloomComplete, setIsBloomComplete] = useState(false);
  const videoRef = useRef(null);

  // Start video and audio on button click
  const handleStart = () => {
    setShowStart(false);
    setIsVideoPlaying(true);
    
    // Play the intro audios via the prop function
    if (onPlayAudios) {
      onPlayAudios();
    }
    
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (!isVideoPlaying) return;
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Video playback failed:", error);
        handleVideoEnd();
      });
    }
  }, [isVideoPlaying]);

  const handleVideoEnd = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsVideoPlaying(false);
      setTimeout(() => {
        setIsBloomComplete(true);
        onIntroComplete?.();
      }, 3000);
    }, 500);
  };

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

  return (
    <div className="relative w-full h-screen">


      {/* Start Button Overlay */}
      <AnimatePresence>
        {showStart && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 20%, #87CEEB 40%, #FFFFFF 60%, #fed7aa 80%, #f97316 100%)'
            }}
          >
            {/* Animated Clouds Background */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
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
                    scale: [0.8, 1.2, 0.8],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 15 + Math.random() * 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 5
                  }}
                  style={{
                    width: `${Math.random() * 200 + 100}px`,
                    height: `${Math.random() * 100 + 60}px`,
                    background: 'rgba(255, 255, 255, 0.4)',
                    filter: 'blur(20px)',
                    borderRadius: '50px'
                  }}
                />
              ))}
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  initial={{
                    x: `${Math.random() * 100}%`,
                    y: `${100 + Math.random() * 20}%`,
                    opacity: 0
                  }}
                  animate={{
                    y: [`${100 + Math.random() * 20}%`, `${-20}%`],
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 8 + Math.random() * 4,
                    delay: Math.random() * 3,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  style={{
                    width: `${Math.random() * 4 + 2}px`,
                    height: `${Math.random() * 4 + 2}px`,
                    background: 'rgba(249, 115, 22, 0.7)',
                    boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)'
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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 transform -skew-x-12" />
              
              {/* Button Sparkles */}
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute rounded-full bg-white"
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
            <div className="absolute bottom-0 left-0 right-0 h-32">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`mist-${i}`}
                  className="absolute bottom-0 rounded-full"
                  initial={{ 
                    x: `${Math.random() * 100}%`,
                    y: '100%',
                    opacity: 0 
                  }}
                  animate={{
                    y: [100, -50],
                    opacity: [0, 0.3, 0],
                    scale: [0.5, 1.5]
                  }}
                  transition={{
                    duration: 6,
                    delay: i * 1.2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  style={{
                    width: `${Math.random() * 150 + 100}px`,
                    height: `${Math.random() * 80 + 40}px`,
                    background: 'rgba(255, 255, 255, 0.4)',
                    filter: 'blur(15px)'
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
          className="w-full h-full object-cover"
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

      {/* Main Content Fade In */}
      <motion.div
        className="relative z-10 bg-black"
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ 
          opacity: isBloomComplete ? 1 : 0,
          scale: isBloomComplete ? 1 : 0.95,
          filter: isBloomComplete ? 'blur(0px)' : 'blur(10px)'
        }}
        transition={{ 
          duration: 3,
          ease: "easeOut",
          delay: 0.5
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default VideoIntro;