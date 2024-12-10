
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Mic, X, Image as ImageIcon, Send, Loader2, Plus, Minus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/toast';

const API_URL = 'http://localhost:5522';
const MIN_COLLABORATORS = 1;

const CollaboratorInput = ({ collaborators, updateCollaborator, removeCollaborator, addCollaborator }) => (
  <div>
    <CardTitle className="mb-4">Colaboradores</CardTitle>
    {collaborators.map((collaborator, index) => (
      <div key={index} className="flex items-center gap-2 mb-2">
        <Input
          value={collaborator}
          onChange={(e) => updateCollaborator(index, e.target.value)}
          placeholder="Nome de usuário"
          className="w-full"
        />
        {index > 0 && (
          <Button 
            variant="destructive" 
            onClick={() => removeCollaborator(index)}
            type="button"
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}
        {index === collaborators.length - 1 && (
          <Button 
            variant="secondary" 
            onClick={addCollaborator}
            type="button"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    ))}
  </div>
);

const MediaUploader = ({ mediaFiles, setMediaFiles, handleCameraCapture, startRecording, stopRecording, isRecording, recordingTime }) => {
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('audio/'));
    setMediaFiles(prev => [...prev, ...imageFiles]);
  };

  return (
    <div>
      <CardTitle className="mb-4">Mídia</CardTitle>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={() => fileInputRef.current.click()}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Imagem
        </Button>
        <Button type="button" onClick={handleCameraCapture} disabled={isRecording}>
          <Camera className="h-4 w-4 mr-2" />
          Fotografar
        </Button>
        <Button type="button" onClick={isRecording ? stopRecording : startRecording}>
          <Mic className="h-4 w-4 mr-2" />
          {isRecording ? `Parar (${formatTime(recordingTime)})` : 'Gravar Áudio'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          hidden
          multiple
          accept="image/*,audio/*"
        />
      </div>
      <MediaFilesList mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} />
    </div>
  );
};

const MediaFilesList = ({ mediaFiles, setMediaFiles }) => (
  mediaFiles.length > 0 && (
    <div className="mt-4">
      <CardTitle className="mb-2">Arquivos Selecionados</CardTitle>
      <div className="flex flex-wrap gap-2">
        {mediaFiles.map((file, index) => (
          <div key={index} className="flex items-center bg-gray-100 p-2 rounded-md">
            <span>{file.name}</span>
            <Button 
              variant="ghost" 
              onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
);

const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => setError(`Erro ao obter localização: ${error.message}`)
    );
  }, []);

  return { location, error };
};

const CreateStoryPage = () => {
  const [storyContent, setStoryContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collaborators, setCollaborators] = useState(['']);
  const [userData, setUserData] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const router = useRouter();
  const { location, error: locationError } = useLocation();
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
        setMediaFiles((prev) => [...prev, audioFile]);
      };
  
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
  
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Erro ao iniciar gravação",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };
  const handleCameraCapture = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Erro",
        description: "Câmera não suportada pelo navegador",
        variant: "destructive",
      });
      return;
    }
  
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
  
        const canvas = document.createElement("canvas");
        const captureButton = document.createElement("button");
        captureButton.textContent = "Capturar";
        captureButton.style.position = "absolute";
        captureButton.style.top = "10px";
        captureButton.style.left = "10px";
        captureButton.style.zIndex = "1000";
        document.body.appendChild(video);
        document.body.appendChild(captureButton);
  
        captureButton.addEventListener("click", () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            const file = new File([blob], "captura.jpg", { type: "image/jpeg" });
            setMediaFiles((prev) => [...prev, file]);
          });
  
          stream.getTracks().forEach((track) => track.stop());
          document.body.removeChild(video);
          document.body.removeChild(captureButton);
        });
      })
      .catch((err) => {
        toast({
          title: "Erro",
          description: "Não foi possível acessar a câmera: " + err.message,
          variant: "destructive",
        });
      });
  };
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      toast({
        title: "Erro de autenticação",
        description: "Dados do usuário não encontrados",
        variant: "destructive"
      });
      router.push('/');
      return;
    }
    const user = JSON.parse(userString);
    setUserData(user);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location || locationError) {
      toast({
        title: "Erro de localização",
        description: locationError || "Localização não disponível",
        variant: "destructive"
      });
      return;
    }

    if (!storyContent.trim() && mediaFiles.length === 0) {
      toast({
        title: "Conteúdo necessário",
        description: "Adicione algum conteúdo ou mídia",
        variant: "destructive"
      });
      return;
    }

    const validCollaborators = collaborators.filter(c => c.trim());
    if (validCollaborators.length < MIN_COLLABORATORS) {
      toast({
        title: "Colaboradores necessários",
        description: "Adicione pelo menos um colaborador",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('content', storyContent);
    formData.append('location', JSON.stringify(location));
    formData.append('collaborators', JSON.stringify(validCollaborators));
    formData.append('ownerId', userData.id);

    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/stories/collaborative`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar história colaborativa');
      }

      toast({
        title: "Sucesso",
        description: "História colaborativa criada com sucesso"
      });
      router.push('/map');
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCollaborator = () => setCollaborators(prev => [...prev, '']);
  const removeCollaborator = (index) => setCollaborators(prev => prev.filter((_, i) => i !== index));
  const updateCollaborator = (index, value) => setCollaborators(prev => prev.map((c, i) => i === index ? value : c));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <Toaster />
      <Card className="max-w-2xl mx-auto bg-white shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>Céus Cruzados</CardTitle>
          <CardDescription>Crie histórias colaborativas com outros jogadores</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CollaboratorInput
              collaborators={collaborators}
              updateCollaborator={updateCollaborator}
              removeCollaborator={removeCollaborator}
              addCollaborator={addCollaborator}
            />
            <div>
              <CardTitle className="mb-4">Conteúdo da História</CardTitle>
              <Textarea
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                placeholder="Escreva aqui o conteúdo da sua história..."
                className="w-full"
              />
            </div>
            <MediaUploader
              mediaFiles={mediaFiles}
              setMediaFiles={setMediaFiles}
              isRecording={isRecording}
              recordingTime={recordingTime}
              handleCameraCapture={handleCameraCapture}
              startRecording={startRecording}
              stopRecording={stopRecording}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateStoryPage;