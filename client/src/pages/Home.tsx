import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryRow } from '@/components/CategoryRow';
import { MediaModal } from '@/components/MediaModal';
import { PlayerOverlay } from '@/components/PlayerOverlay';
import { SearchOverlay } from '@/components/SearchOverlay';
import { BrowseOverlay } from '@/components/BrowseOverlay';
import { MobileNav } from '@/components/MobileNav';
import { Loader2 } from 'lucide-react';
import type { MediaItem, TMDBDetails, SeriesBinData } from '@shared/schema';

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState('home');
  const [playerConfig, setPlayerConfig] = useState<{
    tmdbId: number;
    imdbId?: string;
    mediaType: 'movie' | 'tv';
    title: string;
    seasonNumber?: number;
    episodeNumber?: number;
    driveUrl?: string;
    totalEpisodes?: number;
  } | null>(null);

  // Fetch all media (movies + series) - atualiza a cada 30 segundos
  const { data: allMedia, isLoading: isLoadingMedia } = useQuery<MediaItem[]>({
    queryKey: ['/api/media/all'],
    refetchInterval: 30000,
  });

  // Fetch my list
  const { data: myList = [] } = useQuery<{ tmdbId: number }[]>({
    queryKey: ['/api/mylist'],
  });

  // Fetch media details when modal opens
  const { data: mediaDetails } = useQuery<TMDBDetails>({
    queryKey: ['/api/media/details', selectedMedia?.tmdbId, selectedMedia?.mediaType],
    enabled: !!selectedMedia && isModalOpen,
  });

  // Fetch series data if it's a TV show
  const { data: seriesData } = useQuery<SeriesBinData[string]>({
    queryKey: ['/api/media/series', selectedMedia?.tmdbId],
    enabled: !!selectedMedia && selectedMedia.mediaType === 'tv' && isModalOpen,
  });

  // Search results
  const { data: searchResults = [], isLoading: isSearching } = useQuery<MediaItem[]>({
    queryKey: ['/api/media/search?q=' + encodeURIComponent(searchQuery)],
    enabled: searchQuery.length > 2 && isSearchOpen,
  });

  const myListIds = myList.map(item => item.tmdbId);

  // Get hero media (most recent)
  const heroMedia = allMedia?.[0];

  // Categorize media by genre
  const categorizeMedia = () => {
    if (!allMedia) return {};
    
    const categories: { [key: string]: MediaItem[] } = {
      'Filmes': allMedia.filter(m => m.mediaType === 'movie'),
      'Séries e Animes': allMedia.filter(m => m.mediaType === 'tv'),
    };

    // Group by primary genre
    allMedia.forEach(media => {
      if (media.genres && media.genres.length > 0) {
        const genreId = media.genres[0];
        const genreName = getGenreName(genreId);
        if (genreName) {
          if (!categories[genreName]) {
            categories[genreName] = [];
          }
          categories[genreName].push(media);
        }
      }
    });

    return categories;
  };

  const getGenreName = (genreId: number): string | null => {
    const genreMap: { [key: number]: string } = {
      28: 'Ação',
      12: 'Aventura',
      16: 'Animação',
      35: 'Comédia',
      80: 'Crime',
      18: 'Drama',
      14: 'Fantasia',
      27: 'Terror',
      878: 'Ficção Científica',
      53: 'Suspense',
      10759: 'Ação & Aventura',
    };
    return genreMap[genreId] || null;
  };

  const categories = categorizeMedia();

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
    setIsModalOpen(true);
  };

  const handleAddToList = async (media: MediaItem) => {
    try {
      const isInList = myListIds.includes(media.tmdbId);
      const { apiRequest } = await import('@/lib/queryClient');
      const { queryClient } = await import('@/lib/queryClient');
      
      if (isInList) {
        await apiRequest('DELETE', `/api/mylist/${media.tmdbId}`);
      } else {
        await apiRequest('POST', '/api/mylist', {
          tmdbId: media.tmdbId,
          mediaType: media.mediaType,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/mylist'] });
    } catch (error) {
      console.error('Error updating my list:', error);
    }
  };

  const handlePlayMovie = async () => {
    if (!selectedMedia) return;
    
    // Fetch movie URL from backend
    let driveUrl: string | undefined;
    try {
      const response = await fetch(`/api/media/movie/${selectedMedia.tmdbId}/url`);
      if (response.ok) {
        const data = await response.json();
        driveUrl = data.url;
      }
    } catch (error) {
      console.error('Error fetching movie URL:', error);
    }
    
    setPlayerConfig({
      tmdbId: selectedMedia.tmdbId,
      imdbId: selectedMedia.imdbId,
      mediaType: 'movie',
      title: selectedMedia.title,
      driveUrl,
    });
    setIsPlayerOpen(true);
  };

  const handlePlayEpisode = (seasonNumber: number, episodeNumber: number) => {
    if (!selectedMedia || !seriesData) return;
    
    const driveUrl = seriesData.temporadas[seasonNumber.toString()]?.[episodeNumber - 1];
    const totalEpisodes = seriesData.temporadas[seasonNumber.toString()]?.length || 1;
    
    setPlayerConfig({
      tmdbId: selectedMedia.tmdbId,
      imdbId: selectedMedia.imdbId,
      mediaType: 'tv',
      title: selectedMedia.title,
      seasonNumber,
      episodeNumber,
      driveUrl,
      totalEpisodes,
    });
    setIsPlayerOpen(true);
  };

  const handleEpisodeChange = (newEpisodeNumber: number) => {
    if (!playerConfig || !playerConfig.seasonNumber || !seriesData) return;
    
    const driveUrl = seriesData.temporadas[playerConfig.seasonNumber.toString()]?.[newEpisodeNumber - 1];
    const totalEpisodes = seriesData.temporadas[playerConfig.seasonNumber.toString()]?.length || 1;
    
    setPlayerConfig({
      ...playerConfig,
      episodeNumber: newEpisodeNumber,
      driveUrl,
      totalEpisodes,
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearchOpen(true);
  };

  const handleLogoClick = () => {
    setMobileTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (mobileTab === 'search') {
      setIsSearchOpen(true);
    } else if (mobileTab === 'mylist') {
      setLocation('/minha-lista');
    } else if (mobileTab === 'browse') {
      setIsBrowseOpen(true);
    }
  }, [mobileTab, setLocation]);

  if (isLoadingMedia) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <Header
        onSearch={handleSearch}
        onLogoClick={handleLogoClick}
      />

      {/* Main Content */}
      <main className="pt-16 md:pt-20">
        {/* Hero Banner */}
        {heroMedia && (
          <HeroBanner
            media={heroMedia}
            onPlay={() => {
              if (heroMedia.mediaType === 'movie') {
                setSelectedMedia(heroMedia);
                handlePlayMovie();
              } else {
                handleMediaClick(heroMedia);
              }
            }}
            onMoreInfo={() => handleMediaClick(heroMedia)}
          />
        )}

        {/* Category Rows */}
        <div className="mt-8 md:mt-12 space-y-8">
          {/* Categories */}
          {Object.entries(categories).map(([categoryName, items]) => (
            items.length > 0 && (
              <CategoryRow
                key={categoryName}
                title={categoryName}
                media={items}
                onMediaClick={handleMediaClick}
                onAddToList={handleAddToList}
                myListIds={myListIds}
              />
            )
          ))}
        </div>
      </main>

      {/* Media Modal */}
      <MediaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        details={mediaDetails || null}
        seriesData={seriesData}
        mediaType={selectedMedia?.mediaType || 'movie'}
        onPlayMovie={handlePlayMovie}
        onPlayEpisode={handlePlayEpisode}
        onAddToList={() => selectedMedia && handleAddToList(selectedMedia)}
        isInList={selectedMedia ? myListIds.includes(selectedMedia.tmdbId) : false}
      />

      {/* Player Overlay */}
      {playerConfig && (
        <PlayerOverlay
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          onEpisodeChange={playerConfig.mediaType === 'tv' ? handleEpisodeChange : undefined}
          {...playerConfig}
        />
      )}

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
          setMobileTab('home');
        }}
        query={searchQuery}
        results={searchResults}
        isLoading={isSearching}
        onMediaClick={handleMediaClick}
        onAddToList={handleAddToList}
        myListIds={myListIds}
      />

      {/* Browse Overlay (Mobile) */}
      <BrowseOverlay
        isOpen={isBrowseOpen}
        onClose={() => {
          setIsBrowseOpen(false);
          setMobileTab('home');
        }}
        allMedia={allMedia}
        isLoading={isLoadingMedia}
        onMediaClick={handleMediaClick}
        onAddToList={handleAddToList}
        myListIds={myListIds}
      />

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={mobileTab}
        onTabChange={setMobileTab}
      />
    </div>
  );
}
