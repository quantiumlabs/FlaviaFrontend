'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Mic, X, Image as ImageIcon, Maximize2, Send, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CreateStoryPage = () => {
  const [storyContent, setStoryContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [cloudLocation, setCloudLocation] = useState(null);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);
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
            longitude: position.coords.longitude
          });
        },
        (error) => console.error('Erro ao obter localização:', error)
      );
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, [router]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setMediaFiles(prev => [...prev, ...imageFiles]);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const blob = await imageCapture.takePhoto();
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      setMediaFiles(prev => [...prev, file]);
      track.stop();
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'gravacao.wav', { type: 'audio/wav' });
        setMediaFiles(prev => [...prev, audioFile]);
        setPreviewAudio(URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao gravar áudio:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cloudLocation) {
      alert('Localização não disponível');
      return;
    }

    if (!storyContent.trim() && mediaFiles.length === 0) {
      alert('Adicione algum conteúdo ou mídia');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('content', storyContent);
    formData.append('latitude', cloudLocation.latitude);
    formData.append('longitude', cloudLocation.longitude);
    formData.append('type', 'PERSONAL')

    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5522/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        localStorage.removeItem('isFirstLogin');
        router.push('/map');
      }
    } catch (error) {
      console.error('Erro ao criar história:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Colecionar névoas</CardTitle>
          <CardDescription>Deixe sua marca pelo mundo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Textarea
            placeholder="Compartilhe algo interessante para as pessoas..."
            value={storyContent}
            onChange={(e) => setStoryContent(e.target.value)}
            className="min-h-32 text-lg resize-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Adicionar Imagens
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCameraCapture}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Tirar Foto
            </Button>

            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              {isRecording ? `Gravando ${formatTime(recordingTime)}` : 'Gravar Áudio'}
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mediaFiles.map((file, index) => (
                <div key={index} className="relative group">
                  {file.type.startsWith('image/') ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedImage(URL.createObjectURL(file))}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative aspect-square rounded-lg bg-gray-100 flex flex-col items-center justify-center p-4">
                      <Mic className="h-8 w-8 mb-2 text-blue-500" />
                      <audio
                        src={URL.createObjectURL(file)}
                        controls
                        className="w-full mt-2"
                      />
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const newFiles = [...mediaFiles];
                      newFiles.splice(index, 1);
                      setMediaFiles(newFiles);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando História...-
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Compartilhar História
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualização de Imagem</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Pré-visualização"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateStoryPage;