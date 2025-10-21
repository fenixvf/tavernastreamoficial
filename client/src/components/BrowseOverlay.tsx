import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaCard } from './MediaCard';
import { CategoryRow } from './CategoryRow';
import type { MediaItem } from '@shared/schema';

interface BrowseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  allMedia: MediaItem[] | undefined;
  isLoading: boolean;
  onMediaClick: (media: MediaItem) => void;
  onAddToList: (media: MediaItem) => void;
  myListIds: number[];
}

export function BrowseOverlay({
  isOpen,
  onClose,
  allMedia,
  isLoading,
  onMediaClick,
  onAddToList,
  myListIds,
}: BrowseOverlayProps) {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Navegar</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
              data-testid="button-close-browse"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          {!isLoading && allMedia && (
            <p className="text-muted-foreground mt-1">
              {allMedia.length} {allMedia.length === 1 ? 'título disponível' : 'títulos disponíveis'}
            </p>
          )}
        </div>
      </div>

      <div className="pb-20">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Category Rows */}
        {!isLoading && allMedia && (
          <div className="mt-4 space-y-8">
            {Object.entries(categories).map(([categoryName, items]) => (
              items.length > 0 && (
                <CategoryRow
                  key={categoryName}
                  title={categoryName}
                  media={items}
                  onMediaClick={onMediaClick}
                  onAddToList={onAddToList}
                  myListIds={myListIds}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
