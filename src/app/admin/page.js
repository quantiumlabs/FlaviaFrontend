'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Trash2,
  ArrowLeft,
  Filter,
  Play,
  Pause,
  AlertTriangle,
  Image as ImageIcon,
  Music,
  Search,
  MessageSquare,
  Keyboard,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import ImageLightbox from 'react-image-lightbox';
import debounce from 'lodash/debounce';

// Content filters object
const contentFilters = {
  Xingamentos: [
    "palavrão", "xingamento", "idiota", "burro", "feio", "Desgraçado"
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

const AdminDashboard = () => {
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [audioPlayer, setAudioPlayer] = useState({ url: null, isPlaying: false });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Create audio element ref
  const audioRef = React.useRef(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  // Memoized content checker
  const checkContent = useMemo(() => (content) => {
    const results = {};
    Object.entries(contentFilters).forEach(([category, words]) => {
      results[category] = words.some(word => 
        content.toLowerCase().includes(word.toLowerCase())
      );
    });
    return results;
  }, []);

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
    window.alert('A pagina de administrador ainda está em desenvolvimento, é recomendado que ela seja usada apenas no computador');
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


  // Get content flags
  const getContentFlags = (content) => {
    const flags = checkContent(content);
    return Object.entries(flags)
      .filter(([_, hasFlag]) => hasFlag)
      .map(([category]) => category);
  };

  // Media preview component
  const renderMediaPreview = (story) => {
    const hasImages = story.mediaUrls?.some(url => url.startsWith('data:image'));
    const hasAudio = story.mediaUrls?.some(url => url.startsWith('data:audio'));

    return (
      <div className="flex gap-2">
        {hasImages && (
          <div className="flex gap-1">
            {story.mediaUrls
              .filter(url => url.startsWith('data:image'))
              .map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`media-${index}`}
                  className="w-12 h-12 rounded cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setImages(story.mediaUrls.filter(u => u.startsWith('data:image')));
                    setPhotoIndex(index);
                    setIsOpen(true);
                  }}
                />
              ))}
          </div>
        )}
        {hasAudio && (
          <div className="flex gap-1">
            {story.mediaUrls
              .filter(url => url.startsWith('data:audio'))
              .map((url, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAudioPlayback(url)}
                  className="flex items-center gap-1"
                >
                  {audioPlayer.isPlaying && audioPlayer.url === url ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <Music className="h-4 w-4" />
                </Button>
              ))}
          </div>
        )}
      </div>
    );
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

  // Mobile story card component
  const MobileStoryCard = ({ story }) => (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{story.user.username}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(story.createdAt).toLocaleDateString()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(story.id)}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm mb-2">{story.content}</p>
        {getContentFlags(story.content).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {getContentFlags(story.content).map((flag) => (
              <Badge key={flag} variant="secondary" className="text-xs">
                {flag}
              </Badge>
            ))}
          </div>
        )}
        <div className="text-xs text-muted-foreground mb-2">
          {`${story.latitude.toFixed(4)}, ${story.longitude.toFixed(4)}`}
        </div>
        {renderMediaPreview(story)}
      </CardContent>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 flex justify-center items-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <p className="text-lg font-semibold text-center">{error}</p>
            <Button onClick={() => router.push('/map')}>Voltar ao Mapa</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-auto">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/map')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold hidden md:block">Painel de Administração</h2>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Keyboard className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Atalhos do Teclado</SheetTitle>
                  <SheetDescription>
                    Comandos rápidos para aumentar sua produtividade
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Buscar</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-sm">⌘ K</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Limpar busca/fechar modal</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-sm">Esc</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Play/Pause áudio</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-sm">Space</kbd>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80">
                <div className="flex flex-col h-full">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-4">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          document.querySelector('input[type="text"]')?.focus();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Buscar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start">
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                            {activeFilters.length > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {activeFilters.length}
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuLabel>Tipos de Conteúdo</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {Object.keys(contentFilters).map((filter) => (
                            <DropdownMenuItem
                              key={filter}
                              className="flex items-center justify-between"
                              onClick={() => {
                                setActiveFilters(
                                  activeFilters.includes(filter)
                                    ? activeFilters.filter((f) => f !== filter)
                                    : [...activeFilters, filter]
                                );
                              }}
                            >
                              {filter.charAt(0).toUpperCase() + filter.slice(1)}
                              {activeFilters.includes(filter) && (
                                <Badge variant="secondary">Ativo</Badge>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="container py-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total de Histórias"
            value={stories.length}
            subtitle={`+${stories.filter(s => {
              const date = new Date(s.createdAt);
              const now = new Date();
              return date > new Date(now - 24*60*60*1000);
            }).length} nas últimas 24h`}
            icon={MessageSquare}
          />
          <StatsCard
            title="Conteúdo Suspeito"
            value={stories.filter(story => getContentFlags(story.content).length > 0).length}
            subtitle={`${((stories.filter(story => getContentFlags(story.content).length > 0).length / stories.length) * 100).toFixed(1)}% do total`}
            icon={AlertTriangle}
          />
          <StatsCard
            title="Com Mídia"
            value={stories.filter(story => story.mediaUrls?.length > 0).length}
            subtitle={`${((stories.filter(story => story.mediaUrls?.length > 0).length / stories.length) * 100).toFixed(1)}% do total`}
            icon={ImageIcon}
          />
        </div>
  
        {/* Search and Filters - Desktop */}
        <div className="hidden md:flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por usuário ou conteúdo..."
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tipos de Conteúdo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(contentFilters).map((filter) => (
                <DropdownMenuItem
                  key={filter}
                  className="flex items-center justify-between"
                  onClick={() => {
                    setActiveFilters(
                      activeFilters.includes(filter)
                        ? activeFilters.filter((f) => f !== filter)
                        : [...activeFilters, filter]
                    );
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {activeFilters.includes(filter) && (
                    <Badge variant="secondary">Ativo</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
  
        {/* Search Input - Mobile */}
        <div className="md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full"
              placeholder="Buscar..."
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
        </div>
  
        {/* Content */}
        <Card className="overflow-hidden">
        <ScrollArea className="md:max-h-[600px] h-[50vh] overflow-y-auto">
        {/* Desktop Table View */}
                  <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Usuário</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead className="w-32">Data</TableHead>
                      <TableHead className="w-40">Localização</TableHead>
                      <TableHead className="w-32">Mídia</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {filteredStories.map((story) => (
                    <TableRow key={story.id}>
                      <TableCell className="font-medium">{story.user.username}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <p className="line-clamp-2">{story.content}</p>
                          {getContentFlags(story.content).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {getContentFlags(story.content).map((flag) => (
                                <Badge
                                  key={flag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {flag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(story.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {`${story.latitude.toFixed(4)}, ${story.longitude.toFixed(4)}`}
                        </span>
                      </TableCell>
                      <TableCell>{renderMediaPreview(story)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(story.id)}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
  
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {filteredStories.map((story) => (
                <MobileStoryCard key={story.id} story={story} />
              ))}
            </div>
          </ScrollArea>
        </Card>
  
        {/* Empty State */}
        {filteredStories.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma história encontrada</p>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                {search || activeFilters.length > 0
                  ? 'Tente ajustar seus filtros de busca'
                  : 'Não há histórias para exibir no momento'}
              </p>
              {(search || activeFilters.length > 0) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setActiveFilters([]);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
  
      {/* Image Lightbox */}
      {isOpen && (
        <ImageLightbox
          mainSrc={images[photoIndex]}
          nextSrc={images[(photoIndex + 1) % images.length]}
          prevSrc={images[(photoIndex + images.length - 1) % images.length]}
          onCloseRequest={() => setIsOpen(false)}
          onMovePrevRequest={() => setPhotoIndex((photoIndex + images.length - 1) % images.length)}
          onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % images.length)}
        />
      )}
    </div>
  );}

export default AdminDashboard;