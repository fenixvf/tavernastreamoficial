import { Info, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MediaItem } from '@shared/schema';

interface HeroBannerProps {
  media: MediaItem;
  onPlay: () => void;
  onMoreInfo: () => void;
}

export function HeroBanner({ media, onPlay, onMoreInfo }: HeroBannerProps) {
  const backdropUrl = media.backdropPath
    ? `https://image.tmdb.org/t/p/original${media.backdropPath}`
    : null;

  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : '';

  return (
    <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      {backdropUrl && (
        <div className="absolute inset-0">
          <img
            src={backdropUrl}
            alt={media.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-12 md:pb-20 pt-24">
        <div className="max-w-2xl space-y-4">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight" data-testid="text-hero-title">
            {media.title}
          </h1>

          {/* Metadata */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-sm font-semibold" data-testid="badge-hero-rating">
              ★ {media.rating.toFixed(1)}
            </Badge>
            {year && (
              <span className="text-sm text-muted-foreground">{year}</span>
            )}
            <span className="text-sm text-muted-foreground uppercase tracking-wide">
              {media.mediaType === 'movie' ? 'Filme' : 'Série'}
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-base md:text-lg text-foreground/90 line-clamp-3 max-w-lg">
            {media.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              size="lg"
              className="rounded-md gap-2"
              onClick={onPlay}
              data-testid="button-hero-play"
            >
              <Play className="w-5 h-5 fill-current" />
              <span className="font-semibold">Assistir</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-md gap-2 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
              onClick={onMoreInfo}
              data-testid="button-hero-info"
            >
              <Info className="w-5 h-5" />
              <span className="font-semibold">Mais Informações</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
