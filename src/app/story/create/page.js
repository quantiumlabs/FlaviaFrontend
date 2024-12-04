'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Mic, X } from 'lucide-react';

export default function CreateMistPage() {
  const [mistContent, setMistContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [cloudLocation, setCloudLocation] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
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
  }, [router]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles([...mediaFiles, ...files]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setMediaFiles([...mediaFiles, audioFile]);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro na gravação:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cloudLocation) {
      alert('Localização não disponível');
      return;
    }

    const formData = new FormData();
    formData.append('content', mistContent);
    formData.append('latitude', cloudLocation.latitude);
    formData.append('longitude', cloudLocation.longitude);
    
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://192.168.15.5:5522/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Clear first-time login flag after successful story creation
        localStorage.removeItem('isFirstLogin');
        router.push('/map');
      }
    } catch (error) {
      console.error('Erro ao criar névoa:', error);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <Card>
        <CardContent className="space-y-4 p-4">
          <Textarea
            placeholder="Compartilhe sua história como névoa..."
            value={mistContent}
            onChange={(e) => setMistContent(e.target.value)}
            className="min-h-32"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mr-2" /> Adicionar Imagens
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic className="mr-2" />
              {isRecording ? 'Parar Gravação' : 'Gravar Áudio'}
            </Button>
          </div>

          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {mediaFiles.map((file, index) => (
                <div key={index} className="relative">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Pré-visualização"
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                      Arquivo de Áudio
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2"
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
          >
            Compartilhar Névoa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}