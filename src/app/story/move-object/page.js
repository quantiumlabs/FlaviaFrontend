'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Mic, Trash, Image as ImageIcon, X, Square, Play, Pause } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SkiesInHandsPage = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [objectContent, setObjectContent] = useState('');
  const [showChallengeDialog, setShowChallengeDialog] = useState(true);
  const [hideChallenge, setHideChallenge] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cloudLocation, setCloudLocation] = useState(null);
  
  // New audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const router = useRouter();
  const verifyTokenAndUsername = async (token, username) => {
    const response = await fetch('https://ceusgame.com:5522/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        username,
      }),
    });
  
    if (!response.ok) {
      throw new Error('Verification failed');
    }
  
    const data = await response.json();
    return data.valid;
  };

    useEffect(() => {
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      setVH();
      window.addEventListener('resize', setVH);
      window.addEventListener('orientationchange', setVH);

      return () => {
        window.removeEventListener('resize', setVH);
        window.removeEventListener('orientationchange', setVH);
      };
    }, []);

    useEffect(() => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
    
        // Verify token and username
      verifyTokenAndUsername(token, user.username)
          .then((isValid) => {
            if (!isValid) {
              // If invalid, clear localStorage and redirect
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/');
            }
          })
          .catch(() => {
            // Handle error case (e.g., network issue or invalid response)
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/');
          });
      }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCloudLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.error('Erro ao obter localização:', error),
      );
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [router]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        const file = new File([blob], 'recorded-audio.webm', { type: 'audio/webm' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (!isPaused) {
        mediaRecorderRef.current.pause();
        clearInterval(timerRef.current);
      } else {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const handleStartCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      setIsCapturing(false);
    }
  };

  const handleCapturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        setCapturedImage(file);
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        }
        setIsCapturing(false);
      });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioURL(URL.createObjectURL(file));
    }
  };

  const removeMedia = (type) => {
    if (type === 'captured') setCapturedImage(null);
    if (type === 'uploaded') setUploadedImage(null);
    if (type === 'audio') {
      setAudioFile(null);
      setAudioURL(null);
    }
  };

  const handleSubmit = async () => {
    if (!cloudLocation) {
      alert('Localização não disponível');
      return;
    }

    if (!objectContent.trim() || (!capturedImage && !uploadedImage && !audioFile)) {
      alert('Por favor, preencha o nome do objeto e adicione pelo menos uma mídia.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', objectContent);
      formData.append('latitude', cloudLocation.latitude);
      formData.append('longitude', cloudLocation.longitude);
      formData.append('type', 'OBJECT');
      if (capturedImage) formData.append('media', capturedImage);
      if (uploadedImage) formData.append('media', uploadedImage);
      if (audioFile) formData.append('media', audioFile);

      const response = await fetch('https://ceusgame.com:5522/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('Objeto registrado com sucesso!');
        router.push('/map');
      }
    } catch (error) {
      console.error('Erro ao registrar objeto:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="absolute inset-0 bg-[url('/object.png')] bg-cover bg-center bg-no-repeat">
      <div 
        className="absolute inset-0 overflow-y-auto px-4 md:px-8"
        style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      >
        <div className="py-8">
          <Card className="max-w-2xl mx-auto shadow-lg mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl font-bold text-purple-800 font-['Press_Start_2P'] leading-loose break-words">
                Céus nas Mãos
              </CardTitle>
              <CardDescription className="text-purple-600">
                Desloque um objeto para um novo local e registre sua história.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          <Input
            placeholder="Nome do objeto deslocado"
            value={objectContent}
            onChange={(e) => setObjectContent(e.target.value)}
            className="text-lg p-6 border-2 border-purple-100 focus:border-purple-300"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  

            {/* Upload and Recording Buttons */}
            <div className="space-y-4">

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full border-2 border-dashed border-purple-200 bg-purple-50 hover:bg-purple-100"
              >
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-purple-500" />
                  <span className="text-purple-700">Adicionar Foto</span>
                </div>
              </Button>

            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
            <Button
                onClick={() => setShowCamera(true)}
                className="w-full h-full border-2 border-dashed border-purple-200 bg-purple-50 hover:bg-purple-100"
              >
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-6 w-6 text-purple-500" />
                  <span className="text-purple-700">Tirar Foto</span>
                </div>
              </Button>

              {showCamera && (
                <CameraCapture
                  onCapture={(file) => {
                    setCapturedImage(file);
                  }}
                  onClose={() => setShowCamera(false)}
                />
              )}

          {/* Preview Section */}
          <div className="space-y-4">
            {(capturedImage || uploadedImage || audioFile) && (
              <Alert className="bg-purple-50 border-purple-200">
                <AlertDescription>
                  Mídia adicionada com sucesso! Revise abaixo:
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capturedImage && (
                <div className="relative group">
                  <Image
                    src={URL.createObjectURL(capturedImage)}
                    alt="Foto capturada"
                    className="w-full rounded-lg shadow-md transition-transform group-hover:scale-[1.02]"
                  />
                  <Button
                    onClick={() => removeMedia('captured')}
                    className="absolute top-2 right-2 p-2 rounded-full bg-red-500 hover:bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {uploadedImage && (
                <div className="relative group">
                  <Image
                    src={URL.createObjectURL(uploadedImage)}
                    alt="Foto enviada"
                    className="w-full rounded-lg shadow-md transition-transform group-hover:scale-[1.02]"
                  />
                  <Button
                    onClick={() => removeMedia('uploaded')}
                    className="absolute top-2 right-2 p-2 rounded-full bg-red-500 hover:bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-6 text-lg font-medium transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Registrando Objeto...</span>
              </div>
            ) : (
              'Registrar Objeto Deslocado'
            )}
          </Button>
          </CardContent>
          </Card>
        </div>
      </div>
      <Dialog 
        open={showChallengeDialog} 
        onOpenChange={(open) => {
          setShowChallengeDialog(open);
          if (!open && hideChallenge) {
            localStorage.setItem('hideChallengeDialog', 'true');
          }
        }}
      >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-purple-800">Desafio Céus nas Mãos</DialogTitle>
              <DialogDescription className="pt-4 text-base text-gray-700">
                <p className="mb-4">
                  Você carrega histórias, visões de céus, ecos de lugares. Tudo que você vê é casa. Escolha um objeto, um pedaço desse lugar, mas que já mora em você.
                </p>
                <p className="font-semibold mb-4">
                  Missão: Pegue um objeto e transporte-o para outro lugar. Depois, tire uma foto.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-500 text-white"
                onClick={() => setShowChallengeDialog(false)}
              >
                Entendi!
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
    </div>
  );
};

export default SkiesInHandsPage;
