
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Mic, X, Image as ImageIcon, Maximize2, Send, Loader2, Users, Square, Pause, Play } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';


const CreateCollabStoryPage = () => {
  const [storyContent, setStoryContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cloudLocation, setCloudLocation] = useState(null);
  const [collaborator, setCollaborator] = useState('');
  const [showMediaAlert, setShowMediaAlert] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(true);
  const [hideChallenge, setHideChallenge] = useState(false);
  const contentWrapperRef = useRef(null);


  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);
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
      // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
      const vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial set
    setVH();

    // Add event listener to reset on resize and orientation change
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
    if (imageFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...imageFiles]);
      setShowMediaAlert(true);
      setTimeout(() => setShowMediaAlert(false), 3000);
    }
  };


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'gravacao.wav', { type: 'audio/wav' });
        setMediaFiles(prev => [...prev, audioFile]);
        setShowMediaAlert(true);
        setTimeout(() => setShowMediaAlert(false), 3000);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao gravar áudio:', error);
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
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
      setIsPaused(false);
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

    if (!collaborator.trim()) {
      alert('Adicione um colaborador');
      return;
    }

    setIsSubmitting(true);
    const currentUser = JSON.parse(localStorage.getItem('user')).username;
    const contentWithCollaborators = `Colaboradores: ${currentUser}, ${collaborator}\n\n${storyContent}`;

    const formData = new FormData();
    formData.append('content', contentWithCollaborators);
    formData.append('latitude', cloudLocation.latitude);
    formData.append('longitude', cloudLocation.longitude);
    formData.append('type', 'COLLABORATIVE');

    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://ceusgame.com:5522/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        router.push('/map');
      }
    } catch (error) {
      console.error('Erro ao criar história:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
	  <div className="absolute inset-0 bg-[url('/collab.png')] bg-cover bg-center bg-no-repeat">
	        {/* Main scrollable container that uses the custom vh variable */}
	        <div 
	          className="absolute inset-0 overflow-y-auto"
	          style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
	        >
	          <div className="container mx-auto px-4 py-8 max-w-4xl">
	            <Card className="w-full shadow-lg mb-8">
	            <CardHeader className="text-center space-y-4">
	              <CardTitle className="text-xl md:text-2xl font-bold text-blue-800 font-['Press_Start_2P'] leading-loose break-words">
	                Céus Cruzados
	              </CardTitle>
	              <CardDescription className="text-blue-600 text-sm md:text-base">
	                Encontre o jogador mais próximo de você e tirem uma foto juntos.
	              </CardDescription>
	            </CardHeader>

	            <CardContent className="space-y-6">
	              <div className="w-full">
	                <Input
	                  placeholder="Nome do outro jogador"
	                  value={collaborator}
	                  onChange={(e) => setCollaborator(e.target.value)}
	                  className="text-base md:text-lg p-4 md:p-6 border-2 border-blue-100 focus:border-blue-300"
	                />
	              </div>

	              <div className="w-full">
	                <Textarea
	                  placeholder="Descrição da ação"
	                  value={storyContent}
	                  onChange={(e) => setStoryContent(e.target.value)}
	                  className="min-h-[120px] text-base md:text-lg resize-none border-2 border-blue-100 focus:border-blue-300 rounded-lg p-4"
	                />
	              </div>

	              {showMediaAlert && (
	                <Alert className="bg-blue-50 border-blue-200">
	                  <AlertDescription>
	                    Mídia adicionada com sucesso!
	                  </AlertDescription>
	                </Alert>
	              )}

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						<input
						type="file"
						id="file-upload"
						accept="image/*"
						capture
						onChange={handleImageUpload}
						className="hidden"
						ref={fileInputRef}
						/>
						
						<Button
						type="button"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="h-20 md:h-24 border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center gap-2"
						>
						<ImageIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
						<span className="text-blue-700 text-sm md:text-base">Adicionar Imagens</span>
						</Button>

	                <div className="h-20 md:h-24 border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
	                  {!isRecording ? (
	                    <Button
	                      onClick={startRecording}
	                      className="bg-red-500 hover:bg-red-400 transition-colors"
	                    >
	                      <Mic className="h-4 w-4 md:h-5 md:w-5 mr-2" />
	                      <span className="text-sm md:text-base">Gravar Áudio</span>
	                    </Button>
	                  ) : (
	                    <div className="space-y-2 w-full">
	                      <div className="flex items-center justify-center gap-2 text-blue-700">
	                        <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500 animate-pulse" />
	                        <span className="text-sm md:text-base">{formatTime(recordingTime)}</span>
	                      </div>
	                      <div className="flex justify-center gap-2">
	                        <Button
	                          onClick={pauseRecording}
	                          className="bg-blue-600 hover:bg-blue-500"
	                        >
	                          {isPaused ? <Play className="h-3 w-3 md:h-4 md:w-4" /> : <Pause className="h-3 w-3 md:h-4 md:w-4" />}
	                        </Button>
	                        <Button
	                          onClick={stopRecording}
	                          className="bg-red-500 hover:bg-red-400"
	                        >
	                          <Square className="h-3 w-3 md:h-4 md:w-4" />
	                        </Button>
	                      </div>
	                    </div>
	                  )}
	                </div>
	              </div>

	              <input
	                type="file"
	                ref={fileInputRef}
	                onChange={handleImageUpload}
	                accept="image/*"
	                multiple
	                className="hidden"
	              />

	              {mediaFiles.length > 0 && (
	                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
	                  {mediaFiles.map((file, index) => (
	                    <div key={index} className="relative group">
	                      {file.type.startsWith('image/') ? (
	                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-md group-hover:shadow-lg transition-shadow">
	                          <Image
	                            src={URL.createObjectURL(file)}
	                            alt="Preview"
	                            fill
	                            className="object-cover"
	                          />
	                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
	                            <Button
	                              variant="ghost"
	                              size="icon"
	                              className="opacity-0 group-hover:opacity-100 transition-opacity"
	                              onClick={() => setSelectedImage(URL.createObjectURL(file))}
	                            >
	                              <Maximize2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
	                            </Button>
	                          </div>
	                        </div>
	                      ) : (
	                        <div className="relative aspect-square rounded-lg bg-blue-50 flex flex-col items-center justify-center p-2 md:p-4 shadow-md group-hover:shadow-lg transition-shadow">
	                          <Mic className="h-6 w-6 md:h-8 md:w-8 mb-2 text-blue-500" />
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
	                        className="absolute -top-2 -right-2 h-6 w-6 md:h-8 md:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
	                        onClick={() => {
	                          const newFiles = [...mediaFiles];
	                          newFiles.splice(index, 1);
	                          setMediaFiles(newFiles);
	                        }}
	                      >
	                        <X className="h-3 w-3 md:h-4 md:w-4" />
	                      </Button>
	                    </div>
	                  ))}
	                </div>
	              )}

	              <Button
	                onClick={handleSubmit}
	                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 md:py-6 text-base md:text-lg font-medium transition-colors"
	                disabled={isSubmitting}
	              >
	                {isSubmitting ? (
	                  <div className="flex items-center justify-center gap-2">
	                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
	                    <span>Enviando História...</span>
	                  </div>
	                ) : (
	                  <div className="flex items-center justify-center gap-2">
	                    <Users className="h-4 w-4 md:h-5 md:w-5" />
	                    <span>Criar História Colaborativa</span>
	                  </div>
	                )}
	              </Button>
	            </CardContent>
	          </Card>
	        </div>
	      </div>

	      <Dialog
	        open={!!selectedImage}
	        onOpenChange={() => setSelectedImage(null)}
	      >
	        <DialogContent className="max-w-4xl">
	          <DialogHeader>
	            <DialogTitle>Visualização de Imagem</DialogTitle>
	          </DialogHeader>
	          {selectedImage && (
	            <div className="relative w-full aspect-square">
	              <Image
	                src={selectedImage}
	                alt="Pré-visualização"
	                fill
	                className="object-contain rounded-lg"
	              />
	            </div>
	          )}
	        </DialogContent>
	      </Dialog>

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
	            <DialogTitle className="text-xl md:text-2xl text-blue-800">Desafio Céus Cruzados</DialogTitle>
	            <DialogDescription className="pt-4 text-sm md:text-base text-gray-700">
	              <p className="mb-4">
	                Quando vocês se encontram, as histórias se cruzam. Juntos, vocês podem criar uma história que só existe porque vocês se encontraram.
	              </p>
	              <h1 className="font-semibold mb-4">
	                Missão: encontre o jogador mais próximo de você e tire uma foto.
	              </h1>
	            </DialogDescription>
	          </DialogHeader>
	          <DialogFooter className="sm:justify-center">
	            <Button
	              type="button"
	              className="bg-blue-600 hover:bg-blue-500 text-white"
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

export default CreateCollabStoryPage;
