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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SafariAudioPlayer from "@/components/ui/SafariAudioPlayer";
import {
  ImageIcon,
  Music,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  Trash2,
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
import { getMediaUrl } from "@/lib/media";

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

const MediaPreview = ({ type, urls, onClose, downloadMedia }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  if (!urls.length) return null;

  return (
    <Dialog open={urls.length > 0} onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-sm sm:text-base">
            <span>
              {type === "image" ? "Visualização de Imagem" : "Player de Áudio"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadMedia(
                    urls[currentIndex],
                    `${type}_${currentIndex + 1}${
                      type === "image" ? ".jpg" : ".mp3"
                    }`,
                  )
                }
              >
                Baixar Atual
              </Button>
              {urls.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadZip(urls, type)}
                >
                  Baixar Todos
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          {type === "image" ? (
            <div className="flex relative justify-center items-center rounded-md aspect-video bg-black/5 max-h-[70vh]">
              <img
                src={getMediaUrl(urls[currentIndex])}
                alt={`Imagem ${currentIndex + 1}`}
                className="max-h-[60vh] max-w-full object-contain"
              />
              {urls.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="p-3 sm:p-4 rounded-md bg-black/5">
              <div className="flex gap-2 sm:gap-4 justify-center items-center mb-3">
                {urls.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                <span className="text-xs sm:text-sm text-gray-500">
                  Áudio {currentIndex + 1} de {urls.length}
                </span>
                {urls.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={handleNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <SafariAudioPlayer audioUrl={getMediaUrl(urls[currentIndex])} />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 sm:top-2 right-1 sm:right-2"
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });
  const [analytics, setAnalytics] = useState({
    dailyPosts: [],
    categoryDistribution: [],
    flaggedContent: 0,
    totalStories: 0,
    storiesWithMedia: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchStories(pagination.page);
  }, [pagination.page]);

  const fetchStories = async (page = 1) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Token de autenticação não encontrado");
        router.push("/map");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stories/admin/all?page=${page}&limit=${pagination.limit}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Você não tem permissão para acessar esta página");
          router.push("/map");
          return;
        }
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const responseData = await response.json();
      setStories(responseData.data);
      setPagination(prev => ({ ...prev, ...responseData.meta }));
      
      // Update analytics with the fetched batch (Note: precise analytics might need a separate endpoint)
      updateAnalytics(responseData.data);
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
        `${process.env.NEXT_PUBLIC_API_URL}/stories/${storyId}`,
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
        ? url.startsWith("data:image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
        : url.startsWith("data:audio") || /\.(mp3|wav|ogg|m4a)$/i.test(url),
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

  const downloadMedia = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadZip = async (urls, type) => {
    try {
      // Dynamic import JSZip only when needed
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const promises = urls.map(async (url, index) => {
        const fetchUrl = getMediaUrl(url);
        const response = await fetch(fetchUrl);
        const blob = await response.blob();
        const extension = type === 'image' ? '.jpg' : '.mp3';
        zip.file(`${type}_${index + 1}${extension}`, blob);
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `media_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating zip:', error);
      toast.error('Falha ao baixar arquivos');
    }
  };

  const downloadAllMedia = async () => {
    try {
      const allMedia = stories.reduce((acc, story) => {
        const images = (story.mediaUrls || []).filter(url => url.startsWith("data:image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
        const audios = (story.mediaUrls || []).filter(url => url.startsWith("data:audio") || /\.(mp3|wav|ogg|m4a)$/i.test(url));
        return [...acc, ...images, ...audios];
      }, []);

      if (allMedia.length === 0) {
        toast.info("Não há arquivos de mídia para baixar");
        return;
      }

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const promises = allMedia.map(async (url, index) => {
        const isImage = url.startsWith("data:image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        const extension = isImage ? '.jpg' : '.mp3';
        const type = isImage ? 'image' : 'audio';
        
        if (url.startsWith('data:')) {
          zip.file(`${type}_${index + 1}${extension}`, url.split(',')[1], {base64: true});
        } else {
          const response = await fetch(getMediaUrl(url));
          const blob = await response.blob();
          zip.file(`${type}_${index + 1}${extension}`, blob);
        }
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `todas_midias_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success('Download iniciado com sucesso');
    } catch (error) {
      console.error('Erro ao baixar todas as mídias:', error);
      toast.error('Falha ao baixar arquivos');
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
      <div className="max-w-[90rem] mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 h-screen overflow-y-auto">
        <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
          <h1 className="text-xl sm:text-2xl font-bold">Painel Administrativo</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
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
            <Button
              onClick={downloadAllMedia}
              disabled={loading || stories.length === 0}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Baixar Todas Mídias
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="pb-6 space-y-4 sm:space-y-6">
            {/* Painel de Análises */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
                <h3 className="mb-2 text-sm sm:text-lg font-semibold">Total de Histórias</h3>
                <p className="text-2xl sm:text-3xl font-bold">{analytics.totalStories}</p>
              </div>
              <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
                <h3 className="mb-2 text-sm sm:text-lg font-semibold">Conteúdo Sinalizado</h3>
                <p className="text-2xl sm:text-3xl font-bold">{analytics.flaggedContent}</p>
              </div>
              <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
                <h3 className="mb-2 text-sm sm:text-lg font-semibold">Histórias com Mídia</h3>
                <p className="text-2xl sm:text-3xl font-bold">{analytics.storiesWithMedia}</p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
                <h3 className="mb-4 text-sm sm:text-lg font-semibold">Histórias por Dia</h3>
                <div style={{ width: "100%", height: 250, minHeight: "250px" }}>
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

              <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
                <h3 className="mb-4 text-sm sm:text-lg font-semibold">
                  Distribuição de Sinalizações
                </h3>
                <div style={{ width: "100%", height: 250, minHeight: "250px" }}>
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
                        innerRadius={40}
                        outerRadius={60}
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
              <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white rounded-lg shadow">
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
                            url.startsWith("data:image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(url),
                          );
                          const audios = (story.mediaUrls || []).filter((url) =>
                            url.startsWith("data:audio") || /\.(mp3|wav|ogg|m4a)$/i.test(url),
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

                {/* Pagination Controls */}
                <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between flex-1 sm:hidden">
                    <Button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                      disabled={pagination.page === 1}
                      variant="outline"
                      size="sm"
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
                      disabled={pagination.page === pagination.totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Próxima
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando página <span className="font-medium">{pagination.page}</span> de <span className="font-medium">{pagination.totalPages}</span> ({pagination.total} resultados)
                      </p>
                    </div>
                    <div>
                      <nav className="inline-flex relative z-0 -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Button
                          onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                          disabled={pagination.page === 1}
                          variant="outline"
                          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50"
                        >
                          <span className="sr-only">Anterior</span>
                          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                        </Button>
                        <Button
                          onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
                          disabled={pagination.page === pagination.totalPages}
                          variant="outline"
                          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50"
                        >
                          <span className="sr-only">Próxima</span>
                          <ChevronRight className="w-5 h-5" aria-hidden="true" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {stories.map((story) => {
                    const flags = checkInappropriateContent(story.content);
                    const images = (story.mediaUrls || []).filter((url) =>
                      url.startsWith("data:image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(url),
                    );
                    const audios = (story.mediaUrls || []).filter((url) =>
                      url.startsWith("data:audio") || /\.(mp3|wav|ogg|m4a)$/i.test(url),
                    );

                    return (
                      <Card key={story.id} className="shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-sm">
                                {story.user.username}
                              </span>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(story.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {story.content}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {images.length > 0 && (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMediaPreview(story, "image")}
                                  className="text-xs"
                                >
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  {images.length} img
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadZip(images, 'image')}
                                  className="text-xs"
                                >
                                  ↓
                                </Button>
                              </div>
                            )}
                            {audios.length > 0 && (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMediaPreview(story, "audio")}
                                  className="text-xs"
                                >
                                  <Music className="w-3 h-3 mr-1" />
                                  {audios.length} áudio
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadZip(audios, 'audio')}
                                  className="text-xs"
                                >
                                  ↓
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
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
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(story.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {flags.length > 0 && (
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
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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
          downloadMedia={downloadMedia}
        />
      </div>
    </main>
  );
};

export default dynamic(() => Promise.resolve(AdminDashboard), { ssr: false });
