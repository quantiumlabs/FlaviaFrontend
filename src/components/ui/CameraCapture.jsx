import React, { useRef, useState } from 'react';
import { Camera, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment"); // 'environment' is back camera, 'user' is front camera

  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
        },
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          // Ignorar AbortError (ocorre se o componente desmontar ou recarregar antes de dar play)
          if (playError.name !== "AbortError") {
            console.error("Erro ao tocar vídeo:", playError);
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      onClose();
    }
  };

  const switchCamera = async () => {
    setFacingMode((current) =>
      current === "environment" ? "user" : "environment",
    );
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");

      // Flip the image horizontally if using front camera
      if (facingMode === "user") {
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      } else {
        context.drawImage(video, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          const file = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });
          onCapture(file);

          // Cleanup
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
          onClose();
        },
        "image/jpeg",
      );
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]); // Restart camera when facingMode changes

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogTitle className="sr-only">Captura de Câmera</DialogTitle>
        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
            <video
              ref={videoRef}
              className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              playsInline
              autoPlay
            />
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
            <Button
              className="bg-white text-black hover:bg-gray-100"
              onClick={switchCamera}
              size="icon"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            
            <Button
              className="bg-white text-black hover:bg-gray-100"
              onClick={handleCapture}
            >
              <Camera className="mr-2 h-4 w-4" />
              Capturar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
