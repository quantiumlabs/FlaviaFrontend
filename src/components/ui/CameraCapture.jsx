import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      onClose();
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        onCapture(file);
        
        // Cleanup
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        onClose();
      }, 'image/jpeg');
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              autoPlay
            />
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          <Button
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black hover:bg-gray-100"
            onClick={handleCapture}
          >
            <Camera className="mr-2 h-4 w-4" />
            Capturar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;