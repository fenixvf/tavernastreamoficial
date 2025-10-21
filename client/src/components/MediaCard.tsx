import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MediaItem } from '@shared/schema';

interface MediaCardProps {
  media: MediaItem;
  onClick: () => void;
  onAddToList: () => void;
  isInList: boolean;
}

export function MediaCard({ media, onClick, onAddToList, isInList }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const posterUrl = media.posterPath
    ? `https://image.tmdb.org/t/p/w500${media.posterPath}`
    : 'https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image';

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      data-testid={`card-media-${media.tmdbId}`}
    >
      {/* Card Container */}
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-card transition-transform duration-200 hover:scale-105 hover:shadow-2xl">
        {/* Poster Image */}
        <img
          src={posterUrl}
          alt={media.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 z-10">
          <Badge
            className="bg-black/70 backdrop-blur-sm text-white border-0 rounded-full px-2 py-1 text-xs font-semibold"
            data-testid={`badge-rating-${media.tmdbId}`}
          >
            ★ {media.rating.toFixed(1)}
          </Badge>
        </div>

        {/* Add to List Button */}
        <Button
          size="icon"
          variant="ghost"
          className={`absolute top-2 left-2 z-10 rounded-full w-8 h-8 backdrop-blur-sm transition-opacity ${
            isHovered || isInList ? 'opacity-100' : 'opacity-0'
          } ${isInList ? 'bg-primary/20 text-primary' : 'bg-black/50 text-white hover:bg-black/70'}`}
          onClick={(e) => {
            e.stopPropagation();
            onAddToList();
          }}
          data-testid={`button-add-list-${media.tmdbId}`}
        >
          <Heart className={`w-4 h-4 ${isInList ? 'fill-current' : ''}`} />
        </Button>

        {/* Hover Overlay with Title */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
              {media.title}
            </h3>
            {media.hasVideo && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </div>
        </div>
      </div>

      {/* Title Below Card (visible on mobile) */}
      <div className="md:hidden mt-2">
        <h3 className="text-sm font-semibold line-clamp-2" data-testid={`text-title-${media.tmdbId}`}>
          {media.title}
        </h3>
      </div>
    </div>
  );
}
