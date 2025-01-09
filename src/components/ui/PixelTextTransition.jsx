import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PixelTextTransition = ({ onComplete }) => {
  const [stage, setStage] = useState('initial');
  const text = "céus";
  
  useEffect(() => {
    const centerTimer = setTimeout(() => {
      setStage('center');
    }, 1000);

    const exitTimer = setTimeout(() => {
      setStage('exit');
    }, 2000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

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
            className="inline-block font-['Press_Start_2P'] text-6xl text-black"
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default PixelTextTransition;