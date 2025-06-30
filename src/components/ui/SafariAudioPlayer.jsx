import React, { useEffect, useRef, useState } from 'react';

const PixelArtGameAudioPlayer = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  
  // References for audio processing
  const audioContext = useRef(null);
  const audioBuffer = useRef(null);
  const audioSource = useRef(null);
  const gainNode = useRef(null);
  const startTime = useRef(0);
  const pausedAt = useRef(0);
  const animationFrame = useRef(null);
  
  // Initialize audio context
  useEffect(() => {
    // Use AudioContext with vendor prefixes for maximum compatibility
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setError("Your browser doesn't support advanced audio");
      setIsLoading(false);
      return;
    }
    
    audioContext.current = new AudioContextClass();
    
    // Create gain node for volume control
    gainNode.current = audioContext.current.createGain();
    gainNode.current.gain.value = volume;
    gainNode.current.connect(audioContext.current.destination);
    
    // Load the audio data
    loadAudio();
    
    return () => {
      // Clean up
      if (audioSource.current) {
        audioSource.current.stop();
      }
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [audioUrl]);
  
  // Load audio data from URL
  const loadAudio = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Handle data URLs for Safari
      let binaryData;
      if (audioUrl.startsWith('data:')) {
        // Extract base64 data
        const base64Data = audioUrl.split(',')[1];
        const binaryString = atob(base64Data);
        
        // Convert to array buffer
        binaryData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          binaryData[i] = binaryString.charCodeAt(i);
        }
      } else {
        // For normal URLs, fetch the data
        const response = await fetch(audioUrl);
        binaryData = await response.arrayBuffer();
      }
      
      // Decode the audio data
      audioContext.current.decodeAudioData(
        binaryData instanceof Uint8Array ? binaryData.buffer : binaryData,
        (buffer) => {
          audioBuffer.current = buffer;
          setIsLoading(false);
        },
        (err) => {
          console.error("Error decoding audio data:", err);
          setError("Unsupported audio format");
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error("Error loading audio:", err);
      setError("Error loading audio");
      setIsLoading(false);
    }
  };
  
  // Play/pause control
  const togglePlay = () => {
    if (isPlaying) {
      // Pause
      if (audioSource.current) {
        audioSource.current.stop();
        audioSource.current = null;
      }
      pausedAt.current = (audioContext.current.currentTime - startTime.current);
      cancelAnimationFrame(animationFrame.current);
      setIsPlaying(false);
    } else {
      // Resume state might need to be handled for Safari
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      
      // Create new source
      audioSource.current = audioContext.current.createBufferSource();
      audioSource.current.buffer = audioBuffer.current;
      audioSource.current.connect(gainNode.current);
      
      // Start playing
      const offset = pausedAt.current;
      audioSource.current.start(0, offset);
      startTime.current = audioContext.current.currentTime - offset;
      
      // Update progress
      updateProgress();
      setIsPlaying(true);
      
      // Handle when playback ends
      audioSource.current.onended = () => {
        pausedAt.current = 0;
        setIsPlaying(false);
        cancelAnimationFrame(animationFrame.current);
        setProgress(0);
      };
    }
  };
  
  // Update progress bar
  const updateProgress = () => {
    if (!audioSource.current || !audioBuffer.current) return;
    
    const elapsed = audioContext.current.currentTime - startTime.current;
    const duration = audioBuffer.current.duration;
    const progress = Math.min(elapsed / duration, 1);
    
    setProgress(progress);
    
    if (progress < 1) {
      animationFrame.current = requestAnimationFrame(updateProgress);
    }
  };
  
  // Handle seek
  const handleSeek = (e) => {
    if (!audioBuffer.current) return;
    
    const duration = audioBuffer.current.duration;
    const seekPosition = parseFloat(e.target.value);
    pausedAt.current = duration * seekPosition;
    
    setProgress(seekPosition);
    
    // If already playing, restart with new position
    if (isPlaying) {
      if (audioSource.current) {
        audioSource.current.stop();
      }
      
      audioSource.current = audioContext.current.createBufferSource();
      audioSource.current.buffer = audioBuffer.current;
      audioSource.current.connect(gainNode.current);
      
      audioSource.current.start(0, pausedAt.current);
      startTime.current = audioContext.current.currentTime - pausedAt.current;
      
      audioSource.current.onended = () => {
        pausedAt.current = 0;
        setIsPlaying(false);
        cancelAnimationFrame(animationFrame.current);
        setProgress(0);
      };
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (gainNode.current) {
      gainNode.current.gain.value = newVolume;
    }
  };
  
  // Format time for display
  const formatTime = (percentage) => {
    if (!audioBuffer.current) return '0:00';
    
    const duration = audioBuffer.current.duration;
    const seconds = duration * percentage;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get total duration
  const getTotalTime = () => {
    if (!audioBuffer.current) return '0:00';
    
    const duration = audioBuffer.current.duration;
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="p-4 bg-white rounded-md shadow-md">
      
      {isLoading ? (
        <div className="flex justify-center items-center py-6 h-12">
          <div className="mx-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="mx-1 w-2 h-2 bg-blue-500 rounded-full delay-100 animate-pulse"></div>
          <div className="mx-1 w-2 h-2 bg-blue-500 rounded-full delay-200 animate-pulse"></div>
        </div>
      ) : error ? (
        <div className="px-3 py-2 mb-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="flex justify-center items-center w-10 h-10 text-white bg-blue-500 rounded-full transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            <div className="flex-1 space-y-1">
              <div className="overflow-hidden relative w-full h-2 bg-gray-200 rounded-full">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={progress}
                  onChange={handleSeek}
                  className="absolute z-10 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Progress"
                />
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100" 
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(progress)}</span>
                <span>{getTotalTime()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => handleVolumeChange({ target: { value: volume === 0 ? 0.7 : 0 } })}
              className="mr-2 text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            
            <div className="relative w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="absolute z-10 w-full h-full opacity-0 cursor-pointer"
                aria-label="Volume"
              />
              <div 
                className="absolute top-0 left-0 h-full bg-blue-400 transition-all duration-100" 
                style={{ width: `${volume * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelArtGameAudioPlayer;
