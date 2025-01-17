'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Square, Pause, Play, Send, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CreateStoryPage = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloudLocation, setCloudLocation] = useState(null);
  const [isLocationAvailable, setIsLocationAvailable] = useState(false);
  const [showMediaAlert, setShowMediaAlert] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(true);
  const [hideChallenge, setHideChallenge] = useState(false);

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

    const isFirstLogin = localStorage.getItem('isFirstLogin');
    if (isFirstLogin === 'true') {
      setShowWelcomeDialog(true);
    }

    const hideChallengeDialog = localStorage.getItem('hideChallengeDialog');
    if (hideChallengeDialog === 'true') {
      setShowChallengeDialog(false);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCloudLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocationAvailable(true);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setIsLocationAvailable(false);
        }
      );
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, [router]);

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
        setAudioFile(audioFile);
        setShowMediaAlert(true);
        setTimeout(() => setShowMediaAlert(false), 3000);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
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
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
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

    if (!isLocationAvailable) {
      alert('Houve um erro no serviço de localização. Por favor recarregue a página e tente novamente.');
      return;
    }

    if (!audioFile) {
      alert('Grave um áudio antes de compartilhar');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('content', '');
    formData.append('latitude', cloudLocation.latitude);
    formData.append('longitude', cloudLocation.longitude);
    formData.append('type', 'PERSONAL');
    formData.append('media', audioFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://ceusgame.com:5522/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        localStorage.removeItem('isFirstLogin');
        localStorage.setItem('FirstStory', 'false');
        router.push('/map');
      }
    } catch (error) {
      console.error('Erro ao criar história:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[url('/story.png')] bg-cover bg-center bg-no-repeat">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-800 font-['Press_Start_2P'] leading-loose">Colecionar névoas</CardTitle>
          <CardDescription className="text-orange-600">Compartilhe uma história que alguem já lhe contou. Escolha um local na cidade e grave.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showMediaAlert && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertDescription>
                Áudio gravado com sucesso!
              </AlertDescription>
            </Alert>
          )}

          <div>
            <div className="h-24 border-2 border-dashed border-orange-200 bg-orange-50 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-400 transition-colors"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Gravar Áudio
                </Button>
              ) : (
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-center gap-2 text-orange-700">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span>{formatTime(recordingTime)}</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={pauseRecording}
                      className="bg-orange-600 hover:bg-orange-500"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={stopRecording}
                      className="bg-red-500 hover:bg-red-400"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {audioFile && (
            <div className="rounded-lg bg-orange-50 p-4 shadow-md">
              <audio
                src={URL.createObjectURL(audioFile)}
                controls
                className="w-full"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white py-6 text-lg font-medium transition-colors"
            disabled={isSubmitting || !audioFile}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Enviando História...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Send className="h-5 w-5" />
                <span>Compartilhar História</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog 
        open={showWelcomeDialog} 
        onOpenChange={(open) => {
          setShowWelcomeDialog(open);
          if (!open) localStorage.setItem('isFirstLogin', 'false');
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-orange-800">Bem-vindo ao Céus!</DialogTitle>
            <DialogDescription className="pt-4 text-base text-gray-700">
              <p className="mb-4">
                Você está prestes a começar uma jornada única de compartilhamento de histórias em áudio!
              </p>
              <p className="mb-4">
                No Céus, cada história sonora que você compartilha fica conectada ao local onde foi criada, como uma névoa de memórias pairando no ar.
              </p>
              <p className="mb-4">
                Compartilhe suas experiências através da sua voz, criando memórias sonoras únicas que outros jogadores poderão descobrir.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              className="bg-orange-600 hover:bg-orange-500 text-white"
              onClick={() => {
                setShowWelcomeDialog(false);
                localStorage.setItem('isFirstLogin', 'false');
              }}
            >
              Começar minha história
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
          open={showChallengeDialog} 
          onOpenChange={(open) => {
            setShowChallengeDialog(open);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-orange-800">Desafio Colecionar Névoas</DialogTitle>
              <DialogDescription className="pt-4 text-base text-gray-700">
                <p className="mb-4">
                  Cada história que você encontra, cada narrativa que você ouve, se torna parte do céu que você desenha. Colecionar é mais que ouvir: é conectar memórias.
                </p>
                <p className="font-semibold mb-4">
                  Missão: Compartilhe uma história que alguém já lhe contou, um momento único que ficou gravado na sua memória ou capture a história de um desconhecido na cidade.
                </p>

              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button
                type="button"
                className="bg-orange-600 hover:bg-orange-500 text-white"
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

export default CreateStoryPage;
