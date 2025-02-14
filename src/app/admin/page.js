'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import mapboxgl from 'mapbox-gl';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Trash2,
  ArrowLeft,
  Filter,
  Search,
  MessageSquare,
  AlertTriangle,
  ImageIcon,
  Menu,
  MapPin,
  List,
  X,
  Loader2,
  Play,
  Pause,
  Music,
  ChevronLeft,
  ChevronRight,
  XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
// Content filters object


const Map = dynamic(() => import('mapbox-gl'), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

const AdminDashboard = () => {
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [mediaDialog, setMediaDialog] = useState({ isOpen: false, type: null, urls: [], currentIndex: 0 });
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [audioPlayer, setAudioPlayer] = useState({ url: null, isPlaying: false });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const router = useRouter();
  const audioRef = React.useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const mapContainer = React.useRef(null);
  const mapRef = React.useRef(null); 
  const contentFilters = {
    Xingamentos: [
      "palavrão", "xingamento", "idiota", "burro", "feio", "Desgraçado, cú, cu, buceta, pinto, pênis, merda, bosta, macaco, preto"
    ],
    Spam: [
      "grátis", "promoção", "desconto", "imperdível", "oportunidade única",
      "dinheiro rápido", "lucro fácil", "clique aqui", "ganhe já",
      "trabalhe em casa", "renda extra", "marketing multinível"
    ],
    Golpes: [
      "fraude", "golpe", "phishing", "clonado", "hackear", "esquema",
      "pirâmide financeira", "investimento falso", "conta bloqueada",
      "transferência suspeita", "pix urgente", "whatsapp clonado"
    ],
    ilegal: [
      "drogas", "armas", "contrabando", "tráfico", "ilegal", "criminoso",
      "dark web", "deep web", "lavagem de dinheiro"
    ],
    Ameaça: [
      "assédio", "bullying", "ameaça", "perseguição", "difamação",
      "calúnia", "cyberbullying", "discriminação", "preconceito"
    ],
    NSFW: [
      "pornografia", "nudez", "conteúdo adulto", "sexual"
    ]
  };
  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || activeView !== 'map') return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-43.2096, -22.9035], // Default center (Rio de Janeiro)
      zoom: 10
    });

    // Store map instance in ref
    mapRef.current = newMap;

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activeView]);

  const checkContent = useMemo(() => (content) => {
    const results = {};
    Object.entries(contentFilters).forEach(([category, words]) => {
      results[category] = words.some(word => 
        content.toLowerCase().includes(word.toLowerCase())
      );
    });
    return results;
  }, [contentFilters]);

  // Update markers when filtered stories change or map is initialized
  useEffect(() => {
    if (!mapRef.current || !filteredStories.length) return;

    // Remove existing markers
    if (markers.length) {
      markers.forEach(marker => marker.remove());
      setMarkers([]);
    }

    const newMarkers = filteredStories.map(story => {
      if (!story.latitude || !story.longitude) return null;

      const el = document.createElement('div');
      el.className = 'story-marker';
      el.style.cssText = `
        width: 12px;
        height: 12px;
        background: #FF5722;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 0 0 2px rgba(255,87,34,0.3);
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([story.longitude, story.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <div class="font-bold">${story.user.username}</div>
                <p class="text-sm">${story.content.substring(0, 100)}...</p>
              </div>
            `)
        )
        .addTo(mapRef.current);

      el.addEventListener('click', () => {
        setSelectedStory(story);
        setIsStoryDialogOpen(true);
      });

      return marker;
    }).filter(Boolean);

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredStories.forEach(story => {
        if (story.latitude && story.longitude) {
          bounds.extend([story.longitude, story.latitude]);
        }
      });
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [filteredStories, mapRef.current]);

  // Modify the "View on map" button click handler
  const handleViewOnMap = (story) => {
    if (!story.latitude || !story.longitude) return;
    
    // Switch to map view
    setActiveView('map');
    
    // Wait for map to be initialized
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [story.longitude, story.latitude],
          zoom: 15,
          essential: true
        });
        
        // Open the popup for this story
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setLngLat([story.longitude, story.latitude])
          .setHTML(`
            <div class="p-2">
              <div class="font-bold">${story.user.username}</div>
              <p class="text-sm">${story.content.substring(0, 100)}...</p>
            </div>
          `)
          .addTo(mapRef.current);
      }
    }, 100);
  };

  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Nenhum token encontrado');

        const response = await fetch('https://ceusgame.com:5522/admin/stories', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            toast.error('Você não tem permissão para acessar esta página');
            router.push('/map');
            return;
          }
          throw new Error('Falha ao carregar histórias');
        }

        const data = await response.json();
        setStories(data);
        setFilteredStories(data);
      } catch (error) {
        setError(error.message);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [router]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((searchTerm) => setSearch(searchTerm), 300),
    []
  );

  // Filter stories
  useEffect(() => {
    let filtered = stories;

    if (search) {
      filtered = filtered.filter(
        (story) =>
          story.content.toLowerCase().includes(search.toLowerCase()) ||
          story.user.username.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (activeFilters.length > 0) {
      filtered = filtered.filter((story) => {
        const contentFlags = checkContent(story.content);
        return activeFilters.some(filter => contentFlags[filter]);
      });
    }

    setFilteredStories(filtered);
  }, [search, activeFilters, stories, checkContent]);

  // Handle story deletion
  const handleDelete = async (storyId) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta história?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Nenhum token encontrado');

      const response = await fetch(`https://ceusgame.com:5522/stories/${storyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setStories(stories.filter((story) => story.id !== storyId));
        toast.success('História excluída com sucesso');
      } else {
        throw new Error('Falha ao excluir história');
      }
    } catch (error) {
      toast.error('Erro ao excluir história');
    }
  };

  // Audio playback control
  const toggleAudioPlayback = (url) => {
    if (!audioRef.current) return;

    if (audioRef.current.src !== url) {
      audioRef.current.src = url;
    }

    if (audioPlayer.isPlaying && audioPlayer.url === url) {
      audioRef.current.pause();
      setAudioPlayer({ url: null, isPlaying: false });
    } else {
      audioRef.current.play();
      setAudioPlayer({ url, isPlaying: true });
    }
  };

  // Get content flags for a story
  const getContentFlags = (content) => {
    const flags = checkContent(content);
    return Object.entries(flags)
      .filter(([_, hasFlag]) => hasFlag)
      .map(([category]) => category);
  };

  // Stats card component
  const StatsCard = ({ title, value, subtitle, icon: Icon }) => (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );

  // Media preview component
  const MediaPreviewDialog = () => {
    const { isOpen, type, urls, currentIndex } = mediaDialog;
    
    if (!isOpen) return null;

    const handlePrevious = () => {
      setMediaDialog(prev => ({
        ...prev,
        currentIndex: (prev.currentIndex - 1 + urls.length) % urls.length
      }));
    };

    const handleNext = () => {
      setMediaDialog(prev => ({
        ...prev,
        currentIndex: (prev.currentIndex + 1) % urls.length
      }));
    };

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && setMediaDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {type === 'image' ? 'Visualização de Imagem' : 'Player de Áudio'}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {type === 'image' ? (
              <div className="relative aspect-video flex items-center justify-center bg-black/5 rounded-md">
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
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={handleNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 bg-black/5 rounded-md">
                <audio
                  src={urls[currentIndex]}
                  controls
                  className="w-full"
                />
                {urls.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button onClick={handlePrevious}>Anterior</Button>
                    <Button onClick={handleNext}>Próximo</Button>
                  </div>
                )}
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMediaDialog(prev => ({ ...prev, isOpen: false }))}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Updated Media Preview Component
  const renderMediaPreview = (story) => {
    const images = story.mediaUrls?.filter(url => url.startsWith('data:image')) || [];
    const audioFiles = story.mediaUrls?.filter(url => url.startsWith('data:audio')) || [];

    return (
      <div className="flex flex-wrap gap-2">
        {images.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {images.map((url, index) => (
              <button
                key={`image-${index}`}
                onClick={() => setMediaDialog({
                  isOpen: true,
                  type: 'image',
                  urls: images,
                  currentIndex: index
                })}
                className="relative w-12 h-12 rounded overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={url}
                  alt={`media-${index}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        {audioFiles.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {audioFiles.map((url, index) => (
              <Button
                key={`audio-${index}`}
                variant="outline"
                size="sm"
                onClick={() => setMediaDialog({
                  isOpen: true,
                  type: 'audio',
                  urls: audioFiles,
                  currentIndex: index
                })}
                className="flex items-center gap-1"
              >
                <Music className="h-4 w-4" />
                <span className="sr-only">Reproduzir áudio {index + 1}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };


  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/map')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="ml-4 text-lg font-semibold">Painel de Administração</h2>
          
          <div className="ml-auto flex items-center space-x-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-4">
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveView('list')}>
                    <List className="h-4 w-4 mr-2" />
                    Lista de Histórias
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveView('map')}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Mapa de Histórias
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
  
      {/* Main Content */}
      <div className="container px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Histórias"
            value={stories.length}
            subtitle="Todas as histórias"
            icon={MessageSquare}
          />
          <StatsCard
            title="Histórias com Imagens"
            value={stories.filter(s => s.mediaUrls?.some(url => url.startsWith('data:image'))).length}
            subtitle="Com anexos de imagem"
            icon={ImageIcon}
          />
          <StatsCard
            title="Histórias com Áudio"
            value={stories.filter(s => s.mediaUrls?.some(url => url.startsWith('data:audio'))).length}
            subtitle="Com anexos de áudio"
            icon={Music}
          />
          <StatsCard
            title="Conteúdo Flagged"
            value={stories.filter(s => getContentFlags(s.content).length > 0).length}
            subtitle="Histórias com alertas"
            icon={AlertTriangle}
          />
        </div>
  
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar histórias..."
                className="pl-10"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Categorias de Conteúdo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(contentFilters).map((filter) => (
                <DropdownMenuItem
                  key={filter}
                  onClick={() => {
                    setActiveFilters((prev) =>
                      prev.includes(filter)
                        ? prev.filter((f) => f !== filter)
                        : [...prev, filter]
                    )
                  }}
                  className="flex items-center justify-between"
                >
                  {filter}
                  {activeFilters.includes(filter) && (
                    <X className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
  
        {/* Content Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="list" className="flex-1 sm:flex-initial">
              <List className="h-4 w-4 mr-2" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-1 sm:flex-initial">
              <MapPin className="h-4 w-4 mr-2" />
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="rounded-md border">
              <ScrollArea className="h-[calc(100vh-24rem)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead className="hidden md:table-cell">Localização</TableHead>
                      <TableHead className="hidden md:table-cell">Mídia</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStories.map((story) => (
                      <TableRow key={story.id}>
                        <TableCell className="font-medium">{story.user.username}</TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <p className="truncate">{story.content}</p>
                            {getContentFlags(story.content).length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {getContentFlags(story.content).map((flag) => (
                                  <Badge key={flag} variant="destructive" className="text-xs">
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOnMap(story)}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver no mapa
                          </Button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {renderMediaPreview(story)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedStory(story);
                                setIsStoryDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(story.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStories.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma história encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <div className="space-y-4">
              <div className="rounded-md border bg-card">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Histórias no Mapa</h3>
                  <p className="text-sm text-muted-foreground">
                    Total de {filteredStories.length} histórias visíveis
                  </p>
                </div>
                <div className="h-[60vh] sm:h-[600px] relative">
                  <div ref={mapContainer} className="h-full w-full" />
                  {!mapRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground">Carregando mapa...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedStory && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">História Selecionada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-sm">Usuário</p>
                        <p>{selectedStory.user.username}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Conteúdo</p>
                        <p className="text-sm">{selectedStory.content}</p>
                      </div>
                      {getContentFlags(selectedStory.content).length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-1">Alertas</p>
                          <div className="flex gap-1 flex-wrap">
                            {getContentFlags(selectedStory.content).map((flag) => (
                              <Badge key={flag} variant="destructive" className="text-xs">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedStory.mediaUrls?.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-1">Mídia</p>
                          {renderMediaPreview(selectedStory)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
  
      {/* Story Dialog */}
      <Dialog open={isStoryDialogOpen} onOpenChange={setIsStoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da História</DialogTitle>
          </DialogHeader>
          {selectedStory && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Usuário</h4>
                <p>{selectedStory.user.username}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Conteúdo</h4>
                <p>{selectedStory.content}</p>
                {getContentFlags(selectedStory.content).length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {getContentFlags(selectedStory.content).map((flag) => (
                      <Badge key={flag} variant="destructive" className="text-xs">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-1">Mídia</h4>
                {renderMediaPreview(selectedStory)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
  
      {/* Media Preview Dialog */}
      <Dialog 
        open={mediaDialog.isOpen} 
        onOpenChange={(open) => !open && setMediaDialog(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mediaDialog.type === 'image' ? 'Visualização de Imagem' : 'Player de Áudio'}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {mediaDialog.type === 'image' ? (
              <div className="relative aspect-video flex items-center justify-center bg-black/5 rounded-md">
                <img
                  src={mediaDialog.urls[mediaDialog.currentIndex]}
                  alt={`Imagem ${mediaDialog.currentIndex + 1}`}
                  className="max-h-[60vh] max-w-full object-contain"
                />
                {mediaDialog.urls.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        setMediaDialog(prev => ({
                          ...prev,
                          currentIndex: (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length
                        }));
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        setMediaDialog(prev => ({
                          ...prev,
                          currentIndex: (prev.currentIndex + 1) % prev.urls.length
                        }));
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 bg-black/5 rounded-md">
                <audio
                  src={mediaDialog.urls[mediaDialog.currentIndex]}
                  controls
                  className="w-full"
                />
                {mediaDialog.urls.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      onClick={() => {
                        setMediaDialog(prev => ({
                          ...prev,
                          currentIndex: (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length
                        }));
                      }}
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={() => {
                        setMediaDialog(prev => ({
                          ...prev,
                          currentIndex: (prev.currentIndex + 1) % prev.urls.length
                        }));
                      }}
                    >
                      Próximo
                    </Button>
                  </div>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setMediaDialog(prev => ({ ...prev, isOpen: false }))}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );}

export default dynamic(() => Promise.resolve(AdminDashboard), {
  ssr: false
});