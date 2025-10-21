import { X, Play, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TMDBDetails, TMDBEpisode, SeriesBinData } from '@shared/schema';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: TMDBDetails | null;
  seriesData?: SeriesBinData[string];
  mediaType: 'movie' | 'tv';
  onPlayMovie?: () => void;
  onPlayEpisode?: (seasonNumber: number, episodeNumber: number) => void;
  onAddToList: () => void;
  isInList: boolean;
}

export function MediaModal({
  isOpen,
  onClose,
  details,
  seriesData,
  mediaType,
  onPlayMovie,
  onPlayEpisode,
  onAddToList,
  isInList,
}: MediaModalProps) {
  if (!details) return null;

  const backdropUrl = details.backdrop_path
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : null;

  const title = details.title || details.name || '';
  const year = details.release_date
    ? new Date(details.release_date).getFullYear()
    : details.first_air_date
    ? new Date(details.first_air_date).getFullYear()
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-card border-card-border">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {details.overview || 'Detalhes do conteúdo'}
        </DialogDescription>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 rounded-full p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
          data-testid="button-close-modal"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Banner Section */}
        {backdropUrl && (
          <div className="relative w-full aspect-video">
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover rounded-t-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          </div>
        )}

        {/* Info Section */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Title and Metadata */}
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-modal-title">
              {title}
            </h2>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold" data-testid="badge-modal-rating">
                ★ {details.vote_average.toFixed(1)}
              </Badge>
              {year && <span className="text-muted-foreground">{year}</span>}
              {details.runtime && (
                <span className="text-muted-foreground">{details.runtime} min</span>
              )}
              {details.number_of_seasons && (
                <span className="text-muted-foreground">
                  {details.number_of_seasons} {details.number_of_seasons === 1 ? 'Temporada' : 'Temporadas'}
                </span>
              )}
            </div>

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {details.genres.map((genre) => (
                  <Badge key={genre.id} variant="secondary" className="text-xs">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Synopsis */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Sinopse</h3>
            <p className="text-muted-foreground leading-relaxed">{details.overview}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {mediaType === 'movie' && onPlayMovie && (
              <Button size="lg" className="gap-2" onClick={onPlayMovie} data-testid="button-modal-play">
                <Play className="w-5 h-5 fill-current" />
                Assistir Agora
              </Button>
            )}
            <Button
              size="lg"
              variant={isInList ? 'default' : 'outline'}
              className="gap-2"
              onClick={onAddToList}
              data-testid="button-modal-add-list"
            >
              <Heart className={`w-5 h-5 ${isInList ? 'fill-current' : ''}`} />
              {isInList ? 'Na Minha Lista' : 'Adicionar à Lista'}
            </Button>
          </div>

          {/* Episodes (Series Only) */}
          {mediaType === 'tv' && seriesData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Episódios</h3>
              <Tabs defaultValue="1" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                  {Object.keys(seriesData.temporadas).map((season) => (
                    <TabsTrigger key={season} value={season} data-testid={`tab-season-${season}`}>
                      Temporada {season}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(seriesData.temporadas).map(([seasonNum, episodes]) => (
                  <TabsContent key={seasonNum} value={seasonNum} className="space-y-2 mt-4">
                    {episodes.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => onPlayEpisode?.(parseInt(seasonNum), index + 1)}
                        className="w-full p-4 rounded-md bg-secondary hover-elevate active-elevate-2 text-left transition-all group"
                        data-testid={`button-episode-${seasonNum}-${index + 1}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold">Episódio {index + 1}</h4>
                                <p className="text-sm text-muted-foreground">
                                  T{seasonNum}:E{index + 1}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Play className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
