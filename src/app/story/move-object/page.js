'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Mic, Trash, Image as ImageIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SkiesInHandsPage = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [objectContent, setObjectContent] = useState('');
  const [cloudLocation, setCloudLocation] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const router = useRouter();

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
  }, [router]);

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
        // Stop video stream after capturing
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
    }
  };

  const removeMedia = (type) => {
    if (type === 'captured') setCapturedImage(null);
    if (type === 'uploaded') setUploadedImage(null);
    if (type === 'audio') setAudioFile(null);
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
      formData.append('type', 'OBJECT')
      if (capturedImage) formData.append('media', capturedImage);
      if (uploadedImage) formData.append('media', uploadedImage);
      if (audioFile) formData.append('media', audioFile);

      const response = await fetch('http://localhost:5522/stories', {
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Céus nas Mãos</CardTitle>
          <CardDescription>Desloque um objeto e registre sua história</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            placeholder="Digite o nome do objeto deslocado"
            value={objectContent}
            onChange={(e) => setObjectContent(e.target.value)}
          />

          <div className="flex flex-col items-center gap-4">
            {!capturedImage && (
              <>
                <Button onClick={handleStartCamera} disabled={isCapturing}>
                  Iniciar Câmera
                </Button>
                <video ref={videoRef} className="w-full max-w-md rounded-lg" />
                <Button onClick={handleCapturePhoto} disabled={!isCapturing}>
                  Capturar Foto
                </Button>
              </>
            )}

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-5 w-5" />
              Adicionar Foto
            </Button>
            <Button
              onClick={() => audioInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Mic className="h-5 w-5" />
              Adicionar Áudio
            </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={audioInputRef}
            onChange={handleAudioUpload}
            accept="audio/*"
            className="hidden"
          />

          {capturedImage && (
            <div className="relative">
              <img
                src={URL.createObjectURL(capturedImage)}
                alt="Foto capturada"
                className="w-full max-w-md rounded-lg shadow-lg"
              />
              <Button
                onClick={() => removeMedia('captured')}
                className="absolute top-2 right-2 p-2 rounded-full bg-red-600 text-white"
              >
                <Trash className="h-5 w-5" />
              </Button>
            </div>
          )}

          {uploadedImage && (
            <div className="relative">
              <img
                src={URL.createObjectURL(uploadedImage)}
                alt="Foto enviada"
                className="w-full max-w-md rounded-lg shadow-lg"
              />
              <Button
                onClick={() => removeMedia('uploaded')}
                className="absolute top-2 right-2 p-2 rounded-full bg-red-600 text-white"
              >
                <Trash className="h-5 w-5" />
              </Button>
            </div>
          )}

          {audioFile && (
            <div className="relative">
              <audio
                src={URL.createObjectURL(audioFile)}
                controls
                className="w-full"
              />
              <Button
                onClick={() => removeMedia('audio')}
                className="absolute top-2 right-2 p-2 rounded-full bg-red-600 text-white"
              >
                <Trash className="h-5 w-5" />
              </Button>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando Objeto...
              </>
            ) : (
              'Registrar Objeto Deslocado'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkiesInHandsPage;