"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImageIcon,
  Music,
  Play,
  Pause,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// Filtros de conteúdo inapropriado
const contentFilters = {
  Xingamentos: [
    "palavrão",
    "xingamento",
    "idiota",
    "burro",
    "feio",
    "desgraçado",
    "cu",
    "buceta",
    "pinto",
    "pênis",
    "merda",
    "bosta",
    "macaco",
    "preto",
  ],
  Spam: [
    "grátis",
    "promoção",
    "desconto",
    "imperdível",
    "oportunidade única",
    "dinheiro rápido",
    "lucro fácil",
    "clique aqui",
    "ganhe já",
    "trabalhe em casa",
    "renda extra",
    "marketing multinível",
  ],
  Golpes: [
    "fraude",
    "golpe",
    "phishing",
    "clonado",
    "hackear",
    "esquema",
    "pirâmide financeira",
    "investimento falso",
    "conta bloqueada",
    "transferência suspeita",
    "pix urgente",
    "whatsapp clonado",
  ],
  Ilegal: [
    "drogas",
    "armas",
    "contrabando",
    "tráfico",
    "ilegal",
    "criminoso",
    "dark web",
    "deep web",
    "lavagem de dinheiro",
  ],
  Ameaça: [
    "assédio",
    "bullying",
    "ameaça",
    "perseguição",
    "difamação",
    "calúnia",
    "cyberbullying",
    "discriminação",
    "preconceito",
  ],
  NSFW: ["pornografia", "nudez", "conteúdo adulto", "sexual"],
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF99E6",
  "#AF19FF",
];

const MediaPreview = ({ type, urls, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!urls.length) return null;

  return (
    <Dialog open={urls.length > 0} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === "image" ? "Visualização de Imagem" : "Player de Áudio"}
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          {type === "image" ? (
            <div className="flex relative justify-center items-center rounded-md aspect-video bg-black/5">
              <img
                src={urls[currentIndex]}
                alt={`Imagem ${currentIndex + 1}`}
                className="max-h-[60vh] max-w-full object-contain"
              />
              {urls.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-md bg-black/5">
              <audio
                ref={audioRef}
                src={urls[currentIndex]}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex gap-4 justify-center items-center">
                {urls.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleAudio}
                  className="w-12 h-12"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
                {urls.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={handleNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-center text-gray-500">
                Áudio {currentIndex + 1} de {urls.length}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => onClose()}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AdminDashboard = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaPreview, setMediaPreview] = useState({ type: null, urls: [] });
  const [analytics, setAnalytics] = useState({
    dailyPosts: [],
    categoryDistribution: [],
    flaggedContent: 0,
    totalStories: 0,
    storiesWithMedia: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Token de autenticação não encontrado");
        router.push("/map");
        return;
      }

      const response = await fetch("https://ceusgame.com:5522/admin/stories", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Você não tem permissão para acessar esta página");
          router.push("/map");
          return;
        }
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      setStories(data);
      updateAnalytics(data);
    } catch (error) {
      console.error("Erro ao buscar histórias:", error);
      setError(error.message);
      toast.error("Falha ao carregar histórias");
    } finally {
      setLoading(false);
    }
  };

  const updateAnalytics = (stories) => {
    const dailyPosts = stories.reduce((acc, story) => {
      const date = new Date(story.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const flaggedContent = stories.filter((story) =>
      Object.values(contentFilters).some((filterWords) =>
        filterWords.some((word) =>
          story.content.toLowerCase().includes(word.toLowerCase()),
        ),
      ),
    ).length;

    const storiesWithMedia = stories.filter(
      (story) => story.mediaUrls && story.mediaUrls.length > 0,
    ).length;

    setAnalytics({
      dailyPosts: Object.entries(dailyPosts).map(([date, count]) => ({
        date,
        posts: count,
      })),
      flaggedContent,
      totalStories: stories.length,
      storiesWithMedia,
    });
  };

  const checkInappropriateContent = (content) => {
    const flags = [];
    Object.entries(contentFilters).forEach(([category, words]) => {
      if (
        words.some((word) => content.toLowerCase().includes(word.toLowerCase()))
      ) {
        flags.push(category);
      }
    });
    return flags;
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta história?"))
      return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token de autenticação não encontrado");

      const response = await fetch(
        `https://ceusgame.com:5522/stories/${storyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      setStories(stories.filter((story) => story.id !== storyId));
      toast.success("História excluída com sucesso");
      updateAnalytics(stories.filter((story) => story.id !== storyId));
    } catch (error) {
      console.error("Erro ao excluir história:", error);
      toast.error("Falha ao excluir história");
    }
  };

  const getGoogleMapsLink = (latitude, longitude) => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  const handleMediaPreview = (story, type) => {
    const mediaUrls = story.mediaUrls || [];
    const filteredUrls = mediaUrls.filter((url) =>
      type === "image"
        ? url.startsWith("data:image")
        : url.startsWith("data:audio"),
    );
    setMediaPreview({ type, urls: filteredUrls });
  };

  const handleExport = () => {
    try {
      const csvRows = stories.map((story) => {
        const flags = checkInappropriateContent(story.content);
        return {
          id: story.id,
          usuario: story.user.username,
          conteudo: story.content.replace(/"/g, '""'),
          localizacao: `${story.latitude}, ${story.longitude}`,
          dataCriacao: new Date(story.createdAt).toLocaleString(),
          sinalizacoes: flags.join(", "),
          midias: (story.mediaUrls || []).length,
        };
      });

      const headers = [
        "ID",
        "Usuário",
        "Conteúdo",
        "Localização",
        "Data de Criação",
        "Sinalizações",
        "Mídias",
      ];
      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) =>
          [
            row.id,
            `"${row.usuario}"`,
            `"${row.conteudo}"`,
            `"${row.localizacao}"`,
            `"${row.dataCriacao}"`,
            `"${row.sinalizacoes}"`,
            row.midias,
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `historias-export-${new Date().toISOString()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Exportação concluída com sucesso");
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Falha ao exportar dados");
    }
  };

  if (error) {
    return (
      <div className="p-4 min-h-screen bg-gray-50">
        <div
          className="relative px-4 py-3 text-red-700 bg-red-100 rounded border border-red-400"
          role="alert"
        >
          <strong className="font-bold">Erro! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <main className="overflow-hidden min-h-screen bg-gray-50">
      <div className="max-w-[90rem] mx-auto px-4 py-6 space-y-6 h-screen overflow-y-auto">
        <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button
              onClick={() => router.push("/map")}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Voltar ao Mapa
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading || stories.length === 0}
              className="w-full sm:w-auto"
            >
              Exportar CSV
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="pb-6 space-y-6">
            {/* Painel de Análises */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="mb-2 text-lg font-semibold">Total de Histórias</h3>
                <p className="text-3xl font-bold">{analytics.totalStories}</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="mb-2 text-lg font-semibold">Conteúdo Sinalizado</h3>
                <p className="text-3xl font-bold">{analytics.flaggedContent}</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="mb-2 text-lg font-semibold">Histórias com Mídia</h3>
                <p className="text-3xl font-bold">{analytics.storiesWithMedia}</p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="mb-4 text-lg font-semibold">Histórias por Dia</h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={analytics.dailyPosts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="posts"
                        stroke="#8884d8"
                        name="Histórias"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="mb-4 text-lg font-semibold">
                  Distribuição de Sinalizações
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={Object.entries(contentFilters).map(
                          ([category], index) => ({
                            name: category,
                            value: stories.filter((story) =>
                              checkInappropriateContent(story.content).includes(
                                category,
                              ),
                            ).length,
                          }),
                        )}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {Object.entries(contentFilters).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Lista de Histórias */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 rounded-full border-b-2 border-gray-900 animate-spin"></div>
              </div>
            ) : stories.length === 0 ? (
              <div className="py-8 text-center bg-white rounded-lg shadow">
                <p className="text-gray-500">Nenhuma história encontrada</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Usuário</TableHead>
                        <TableHead>Conteúdo</TableHead>
                        <TableHead className="w-[100px]">Mídia</TableHead>
                        <TableHead className="w-[120px]">Localização</TableHead>
                        <TableHead className="w-[180px]">Data</TableHead>
                        <TableHead className="w-[150px]">Sinalizações</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stories.map((story) => {
                        const flags = checkInappropriateContent(story.content);
                        const images = (story.mediaUrls || []).filter((url) =>
                          url.startsWith("data:image"),
                        );
                        const audios = (story.mediaUrls || []).filter((url) =>
                          url.startsWith("data:audio"),
                        );

                        return (
                          <TableRow key={story.id}>
                            <TableCell className="font-medium">
                              {story.user.username}
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate">
                              {story.content}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {images.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleMediaPreview(story, "image")
                                    }
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="hidden ml-2 sm:inline">
                                      {images.length}
                                    </span>
                                  </Button>
                                )}
                                {audios.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleMediaPreview(story, "audio")
                                    }
                                  >
                                    <Music className="w-4 h-4" />
                                    <span className="hidden ml-2 sm:inline">
                                      {audios.length}
                                    </span>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <a
                                href={getGoogleMapsLink(
                                  story.latitude,
                                  story.longitude,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Ver no Mapa
                              </a>
                            </TableCell>
                            <TableCell>
                              {new Date(story.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {flags.map((flag) => (
                                  <Badge
                                    key={flag}
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(story.id)}
                              >
                                Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Media Preview Dialog */}
        <MediaPreview
          type={mediaPreview.type}
          urls={mediaPreview.urls}
          onClose={() => setMediaPreview({ type: null, urls: [] })}
        />
      </div>
    </main>
  );
};

export default dynamic(() => Promise.resolve(AdminDashboard), { ssr: false });
