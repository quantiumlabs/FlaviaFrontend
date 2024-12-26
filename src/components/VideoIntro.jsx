import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

export const VideoIntro = ({ onIntroComplete, children }) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isBloomComplete, setIsBloomComplete] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Video playback failed:", error);
        handleVideoEnd();
      });
    }
  }, []);

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
    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', () => {
        if (videoRef.current.duration - videoRef.current.currentTime < 0.5) {
          handleVideoEnd();
        }
      });
    }
  }, []);

  return (
    <div className="relative w-full h-screen">
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