"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  Mic,
  X,
  Image as ImageIcon,
  Maximize2,
  Send,
  Loader2,
  Users,
  Square,
  Pause,
  Play,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import CameraCapture from "@/components/ui/CameraCapture";

const CreateCollabStoryPage = () => {
  const [storyContent, setStoryContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cloudLocation, setCloudLocation] = useState(null);
  const [collaborator, setCollaborator] = useState("");
  const [showMediaAlert, setShowMediaAlert] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(true);
  const [hideChallenge, setHideChallenge] = useState(false);
  const contentWrapperRef = useRef(null);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const router = useRouter();

  const [error, setError] = useState("");

  const verifyTokenAndUsername = async (token, username) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        username,
      }),
    });

    if (!response.ok) {
      throw new Error("Verification failed");
    }

    const data = await response.json();
    return data.valid;
  };

  useEffect(() => {
    const setVH = () => {
      // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
      const vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Initial set
    setVH();

    // Add event listener to reset on resize and orientation change
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    // Verify token and username
    verifyTokenAndUsername(token, user.username)
      .then((isValid) => {
        if (!isValid) {
          // If invalid, clear localStorage and redirect
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/");
        }
      })
      .catch(() => {
        // Handle error case (e.g., network issue or invalid response)
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
      });
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
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
        (error) => {
          console.error("Erro ao obter localização:", error);
          if (error.code === error.TIMEOUT) {
            alert("A busca por localização demorou demais. Verifique o sinal de GPS.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, [router]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    // Limpar o input para permitir enviar a mesma imagem novamente se der erro
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!files.length) return;

    if (mediaFiles.length + files.length > 10) {
      alert("Você só pode adicionar no máximo 10 mídias por história!");
      return;
    }
    
    setIsProcessingMedia(true);

    import("@/lib/media").then(async ({ compressImage }) => {
      try {
        const processedPromises = files.map(async (file) => {
          if (
            !file.type.startsWith("image/") &&
            !/\.(heic|heif|jpg|jpeg|png|webp|gif)$/i.test(file.name)
          ) {
            alert(`Formato do arquivo ${file.name} não suportado. Envie imagens.`);
            return null;
          }
          return await compressImage(file);
        });

        const results = await Promise.all(processedPromises);
        const validProcessedFiles = results.filter((f) => f !== null);

        if (validProcessedFiles.length > 0) {
          setMediaFiles((prev) => [...prev, ...validProcessedFiles]);
          setShowMediaAlert(true);
          setTimeout(() => setShowMediaAlert(false), 3000);
        }
      } catch (error) {
        console.error("Erro ao processar imagens:", error);
        alert("Ocorreu um erro ao processar as imagens.");
      } finally {
        setIsProcessingMedia(false);
      }
    }).catch(err => {
      console.error(err);
      setIsProcessingMedia(false);
    });
  };

  const startRecording = async () => {
    if (mediaFiles.length >= 10) {
      alert("Você já atingiu o limite de 10 mídias por história!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = {
        mimeType: "audio/webm;codecs=opus",
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
        let mimeType = mediaRecorder.mimeType || "audio/webm";
        let extension = "webm";
        if (mimeType.includes("mp4")) extension = "mp4";
        else if (mimeType.includes("ogg")) extension = "ogg";
        else if (mimeType.includes("wav")) extension = "wav";
        else if (mimeType.includes("aac")) extension = "aac";
        else if (mimeType.includes("mpeg")) extension = "mp3";

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], `recording.${extension}`, {
          type: mimeType,
        });
        setMediaFiles((prev) => [...prev, audioFile]);
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
      console.error("Error recording audio:", error);
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
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cloudLocation) {
      alert("Localização não disponível");
      return;
    }

    if (!storyContent.trim() && mediaFiles.length === 0) {
      alert("Adicione algum conteúdo ou mídia");
      return;
    }

    if (!collaborator.trim()) {
      alert("Adicione um colaborador");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const currentUser = JSON.parse(localStorage.getItem("user")).username;
    const contentWithCollaborators = `Colaboradores: ${currentUser}, ${collaborator}\n\n${storyContent}`;

    const formData = new FormData();
    formData.append("content", contentWithCollaborators);
    formData.append("latitude", cloudLocation.latitude);
    formData.append("longitude", cloudLocation.longitude);
    formData.append("type", "COLLABORATIVE");

    mediaFiles.forEach((file) => {
      formData.append("media", file);
    });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stories`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (response.ok) {
        router.push("/map");
      } else {
        const errorData = await response.json().catch(() => null);
        setError(
          errorData?.message ||
            "Erro ao enviar história. Verifique o tamanho das mídias e tente novamente.",
        );
      }
    } catch (error) {
      console.error("Erro ao criar história:", error);
      if (error.message && error.message.includes("Failed to fetch")) {
        setError("Sem conexão com a internet. Verifique sua rede e tente novamente.");
      } else {
        setError("Erro de conexão ou servidor indisponível. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[url('/collab.png')] bg-cover bg-center bg-no-repeat">
      {/* Main scrollable container that uses the custom vh variable */}
      <div
        className="overflow-y-auto absolute inset-0"
        style={{ height: "calc(var(--vh, 1vh) * 100)" }}
      >
        <div className="container px-4 py-8 mx-auto max-w-4xl">
          <Card className="mb-8 w-full shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <CardTitle className="text-xl md:text-2xl font-bold text-blue-800 font-['Press_Start_2P'] leading-loose break-words">
                Céus Cruzados
              </CardTitle>
              <CardDescription className="text-sm text-blue-600 md:text-base">
                Encontre o jogador mais próximo de você e tirem uma foto juntos.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="w-full">
                <Input
                  placeholder="Nome do outro jogador"
                  value={collaborator}
                  onChange={(e) => setCollaborator(e.target.value)}
                  className="p-4 text-base border-2 border-blue-100 md:text-lg md:p-6 focus:border-blue-300"
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

              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200"
                >
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {showMediaAlert && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription>
                    Mídia adicionada com sucesso!
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingMedia || mediaFiles.length >= 10}
                  className="flex flex-col gap-2 justify-center items-center h-20 bg-blue-50 border-2 border-blue-200 border-dashed transition-colors md:h-24 hover:bg-blue-100 disabled:opacity-50"
                >
                  {isProcessingMedia ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 md:h-6 md:w-6" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-blue-500 md:h-6 md:w-6" />
                  )}
                  <span className="text-sm text-blue-700 md:text-base">
                    {isProcessingMedia ? "Processando..." : "Adicionar Imagens"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCamera(true)}
                  disabled={mediaFiles.length >= 10}
                  className="flex flex-col gap-2 justify-center items-center h-20 bg-blue-50 border-2 border-blue-200 border-dashed transition-colors md:h-24 hover:bg-blue-100 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5 text-blue-500 md:h-6 md:w-6" />
                  <span className="text-sm text-blue-700 md:text-base">
                    Tirar Foto
                  </span>
                </Button>

                {showCamera && (
                  <CameraCapture
                    onCapture={(file) => {
                      if (mediaFiles.length >= 10) {
                        alert("Você só pode adicionar no máximo 10 mídias por história!");
                        return;
                      }
                      setMediaFiles((prev) => [...prev, file]);
                      setShowMediaAlert(true);
                      setTimeout(() => setShowMediaAlert(false), 3000);
                    }}
                    onClose={() => setShowCamera(false)}
                  />
                )}

                <div className="flex flex-col gap-2 justify-center items-center p-4 h-20 bg-blue-50 rounded-lg border-2 border-blue-200 border-dashed md:h-24">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={mediaFiles.length >= 10}
                      className="bg-red-500 transition-colors hover:bg-red-400 disabled:opacity-50"
                    >
                      <Mic className="mr-2 w-4 h-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-base">Gravar Áudio</span>
                    </Button>
                  ) : (
                    <div className="space-y-2 w-full">
                      <div className="flex gap-2 justify-center items-center text-blue-700">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse md:w-3 md:h-3" />
                        <span className="text-sm md:text-base">
                          {formatTime(recordingTime)}
                        </span>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={pauseRecording}
                          className="bg-blue-600 hover:bg-blue-500"
                        >
                          {isPaused ? (
                            <Play className="w-3 h-3 md:h-4 md:w-4" />
                          ) : (
                            <Pause className="w-3 h-3 md:h-4 md:w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={stopRecording}
                          className="bg-red-500 hover:bg-red-400"
                        >
                          <Square className="w-3 h-3 md:h-4 md:w-4" />
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
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith("image/") ? (
                        <div className="overflow-hidden relative bg-gray-100 rounded-lg shadow-md transition-shadow aspect-square group-hover:shadow-lg">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="object-cover w-full h-full"
                          />
                          <div className="flex absolute inset-0 justify-center items-center bg-black bg-opacity-0 transition-all group-hover:bg-opacity-20">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() =>
                                setSelectedImage(URL.createObjectURL(file))
                              }
                            >
                              <Maximize2 className="w-4 h-4 text-white md:h-5 md:w-5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex relative flex-col justify-center items-center p-2 bg-blue-50 rounded-lg shadow-md transition-shadow aspect-square md:p-4 group-hover:shadow-lg">
                          <Mic className="mb-2 w-6 h-6 text-blue-500 md:h-8 md:w-8" />
                          <audio
                            src={URL.createObjectURL(file)}
                            controls
                            className="mt-2 w-full"
                          />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 opacity-0 transition-opacity md:h-8 md:w-8 group-hover:opacity-100"
                        onClick={() => {
                          const newFiles = [...mediaFiles];
                          newFiles.splice(index, 1);
                          setMediaFiles(newFiles);
                        }}
                      >
                        <X className="w-3 h-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                className="py-4 w-full text-base font-medium text-white bg-blue-600 transition-colors hover:bg-blue-500 md:py-6 md:text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex gap-2 justify-center items-center">
                    <Loader2 className="w-4 h-4 animate-spin md:h-5 md:w-5" />
                    <span>Enviando História...</span>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-center items-center">
                    <Users className="w-4 h-4 md:h-5 md:w-5" />
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
              <img
                src={selectedImage}
                alt="Pré-visualização"
                className="object-contain w-full h-full rounded-lg"
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
            localStorage.setItem("hideChallengeDialog", "true");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-blue-800 md:text-2xl">
              Desafio Céus Cruzados
            </DialogTitle>
            <DialogDescription asChild className="pt-4 text-sm text-gray-700 md:text-base">
              <div>
                <p className="mb-4">
                  Quando vocês se encontram, as histórias se cruzam. Juntos, vocês
                  podem criar uma história que só existe porque vocês se
                  encontraram.
                </p>
                <h1 className="mb-4 font-semibold">
                  Missão: encontre o jogador mais próximo de você e tire uma foto.
                </h1>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              className="text-white bg-blue-600 hover:bg-blue-500"
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
