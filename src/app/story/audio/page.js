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
  const [showLogout, setShowLogout] = useState(false);
  const [showMediaAlert, setShowMediaAlert] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(true);
  const [showFirstStoryDialog, setShowFirstStoryDialog] = useState(false);
  const [isFirstStory, setIsFirstStory] = useState(false);
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
    const firstStory = localStorage.getItem('FirstStory');
    if (firstStory === 'true') {
      setShowLogout(true);
      setIsFirstStory(true);
      setShowChallengeDialog(false);
      setShowFirstStoryDialog(true);
    }
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
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };
      
      // Try to use preferred MIME type, fallback for Safari
      let mediaRecorder;
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        mediaRecorder = new MediaRecorder(stream, options);
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      audioChunksRef.current = [];
  
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
  
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current);
        // Convert to WAV for better compatibility
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
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
      console.error('Error recording audio:', error);
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
        localStorage.setItem('FirstStory', 'false');
        // Set hasSeenTutorial to false to trigger the tutorial after first story
        if (localStorage.getItem('isFirstLogin') === 'true') {
          localStorage.setItem('ShowTutorial', 'true');

        }
        localStorage.removeItem('hideChallengeDialog');
        localStorage.setItem('isFirstLogin', 'false');
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
        <Card className="mx-auto max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-orange-800 font-['Press_Start_2P'] leading-loose">
              {isFirstStory ? 'Sua primeira história' : 'Gravar uma história'}
            </CardTitle>
            <CardDescription className="text-orange-600">
                {isFirstStory ? 'Compartilhe sua primeira história com o mundo!' : 'Grave um áudio e compartilhe com a comunidade'}
            </CardDescription>
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
              <div className="flex flex-col gap-2 justify-center items-center p-4 h-24 bg-orange-50 rounded-lg border-2 border-orange-200 border-dashed">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="bg-red-500 transition-colors hover:bg-red-400"
                  >
                    <Mic className="mr-2 w-5 h-5" />
                    Gravar Áudio
                  </Button>
                ) : (
                  <div className="space-y-2 w-full">
                    <div className="flex gap-2 justify-center items-center text-orange-700">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span>{formatTime(recordingTime)}</span>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={pauseRecording}
                        className="bg-orange-600 hover:bg-orange-500"
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={stopRecording}
                        className="bg-red-500 hover:bg-red-400"
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
  
            {audioFile && (
              <div className="p-4 bg-orange-50 rounded-lg shadow-md">
                <audio
                  src={URL.createObjectURL(audioFile)}
                  controls
                  className="w-full"
                />
              </div>
            )}
  
            <Button
              onClick={handleSubmit}
              className="py-6 w-full text-lg font-medium text-white bg-orange-600 transition-colors hover:bg-orange-500"
              disabled={isSubmitting || !audioFile}
            >
              {isSubmitting ? (
                <div className="flex gap-2 justify-center items-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando História...</span>
                </div>
              ) : (
                <div className="flex gap-2 justify-center items-center">
                  <Send className="w-5 h-5" />
                  <span>Compartilhar áudio</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>


  

      </div>
    );
  }

export default CreateStoryPage;
