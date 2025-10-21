import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMyListItemSchema } from "@shared/schema";
import type { MediaItem } from "@shared/schema";
import {
  getMovieDetails,
  getMovieExternalIds,
  getTVDetails,
  searchMulti,
} from "./tmdb";
import {
  getAllMovieIds,
  getAllSeriesIds,
  getMovieUrl,
  getSeriesData,
} from "./jsonbin";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all media (movies + series) with TMDB data
  app.get("/api/media/all", async (req, res) => {
    try {
      const allMedia: MediaItem[] = [];
      
      // Fetch all movies
      const movieIds = await getAllMovieIds();
      for (const tmdbId of movieIds) {
        try {
          const [details, externalIds, hasVideo] = await Promise.all([
            getMovieDetails(tmdbId),
            getMovieExternalIds(tmdbId).catch(() => ({ imdb_id: undefined })),
            getMovieUrl(tmdbId)
          ]);
          allMedia.push({
            tmdbId,
            imdbId: externalIds.imdb_id,
            title: details.title || '',
            posterPath: details.poster_path,
            backdropPath: details.backdrop_path,
            overview: details.overview || '',
            rating: details.vote_average || 0,
            releaseDate: details.release_date || '',
            mediaType: 'movie',
            genres: details.genres?.map(g => g.id) || [],
            hasVideo: !!hasVideo,
          });
        } catch (error) {
          console.error(`Error fetching movie ${tmdbId}:`, error);
        }
      }
      
      // Fetch all series
      const seriesIds = await getAllSeriesIds();
      for (const tmdbId of seriesIds) {
        try {
          const [details, hasVideo] = await Promise.all([
            getTVDetails(tmdbId),
            getSeriesData(tmdbId)
          ]);
          allMedia.push({
            tmdbId,
            title: details.name || '',
            posterPath: details.poster_path,
            backdropPath: details.backdrop_path,
            overview: details.overview || '',
            rating: details.vote_average || 0,
            releaseDate: details.first_air_date || '',
            mediaType: 'tv',
            genres: details.genres?.map(g => g.id) || [],
            hasVideo: !!hasVideo,
          });
        } catch (error) {
          console.error(`Error fetching series ${tmdbId}:`, error);
        }
      }
      
      // Manter a ordem de adição do JSON bin (mais recentes primeiro)
      // Como os objetos mantêm a ordem de inserção em JS moderno,
      // invertemos para que o último adicionado apareça primeiro
      allMedia.reverse();
      
      res.json(allMedia);
    } catch (error) {
      console.error('Error fetching all media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  });

  // Get media details
  app.get("/api/media/details/:id/:type", async (req, res) => {
    try {
      const tmdbId = parseInt(req.params.id);
      const mediaType = req.params.type as 'movie' | 'tv';
      
      if (isNaN(tmdbId)) {
        return res.status(400).json({ error: 'Invalid TMDB ID' });
      }
      
      const details = mediaType === 'movie'
        ? await getMovieDetails(tmdbId)
        : await getTVDetails(tmdbId);
      
      res.json(details);
    } catch (error) {
      console.error('Error fetching media details:', error);
      res.status(500).json({ error: 'Failed to fetch details' });
    }
  });

  // Get series data from bin
  app.get("/api/media/series/:id", async (req, res) => {
    try {
      const tmdbId = parseInt(req.params.id);
      
      if (isNaN(tmdbId)) {
        return res.status(400).json({ error: 'Invalid TMDB ID' });
      }
      
      const seriesData = await getSeriesData(tmdbId);
      
      if (!seriesData) {
        return res.status(404).json({ error: 'Series not found in bin' });
      }
      
      res.json(seriesData);
    } catch (error) {
      console.error('Error fetching series data:', error);
      res.status(500).json({ error: 'Failed to fetch series data' });
    }
  });

  // Search media
  app.get("/api/media/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 3) {
        return res.json([]);
      }
      
      // Get available IDs from bins
      const [movieIds, seriesIds, searchResults] = await Promise.all([
        getAllMovieIds(),
        getAllSeriesIds(),
        searchMulti(query)
      ]);
      
      const results: MediaItem[] = [];
      
      for (const item of searchResults.results) {
        if ('title' in item) {
          // Movie - only include if ID is in our bin
          if (movieIds.includes(item.id)) {
            results.push({
              tmdbId: item.id,
              title: item.title,
              posterPath: item.poster_path,
              backdropPath: item.backdrop_path,
              overview: item.overview || '',
              rating: item.vote_average || 0,
              releaseDate: item.release_date || '',
              mediaType: 'movie',
              genres: item.genre_ids || [],
              hasVideo: true,
            });
          }
        } else if ('name' in item) {
          // TV Series - only include if ID is in our bin
          if (seriesIds.includes(item.id)) {
            results.push({
              tmdbId: item.id,
              title: item.name,
              posterPath: item.poster_path,
              backdropPath: item.backdrop_path,
              overview: item.overview || '',
              rating: item.vote_average || 0,
              releaseDate: item.first_air_date || '',
              mediaType: 'tv',
              genres: item.genre_ids || [],
              hasVideo: true,
            });
          }
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error('Error searching media:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  });

  // Get my list
  app.get("/api/mylist", async (req, res) => {
    try {
      const myList = await storage.getMyList();
      res.json(myList);
    } catch (error) {
      console.error('Error fetching my list:', error);
      res.status(500).json({ error: 'Failed to fetch my list' });
    }
  });

  // Add to my list
  app.post("/api/mylist", async (req, res) => {
    try {
      const validated = insertMyListItemSchema.parse(req.body);
      
      // Check if already in list
      const existing = await storage.getMyListItem(validated.tmdbId);
      if (existing) {
        return res.status(409).json({ error: 'Already in list' });
      }
      
      const item = await storage.addToMyList(validated);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error adding to my list:', error);
      res.status(500).json({ error: 'Failed to add to my list' });
    }
  });

  // Remove from my list
  app.delete("/api/mylist/:tmdbId", async (req, res) => {
    try {
      const tmdbId = parseInt(req.params.tmdbId);
      
      if (isNaN(tmdbId)) {
        return res.status(400).json({ error: 'Invalid TMDB ID' });
      }
      
      const removed = await storage.removeFromMyList(tmdbId);
      
      if (!removed) {
        return res.status(404).json({ error: 'Item not found in list' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing from my list:', error);
      res.status(500).json({ error: 'Failed to remove from my list' });
    }
  });

  // Get movie URL from bin
  app.get("/api/media/movie/:id/url", async (req, res) => {
    try {
      const tmdbId = parseInt(req.params.id);
      
      if (isNaN(tmdbId)) {
        return res.status(400).json({ error: 'Invalid TMDB ID' });
      }
      
      const url = await getMovieUrl(tmdbId);
      
      if (!url) {
        return res.status(404).json({ error: 'Movie URL not found' });
      }
      
      res.json({ url });
    } catch (error) {
      console.error('Error fetching movie URL:', error);
      res.status(500).json({ error: 'Failed to fetch movie URL' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
