import { useEffect, useState } from 'react';
import { Play, Filter } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vaan-wordlist.keyvez.workers.dev';

interface Video {
  id: number;
  title: string;
  slug: string;
  youtube_url: string;
  youtube_id: string;
  description: string;
  category: string;
  thumbnail_url: string;
  published_at: string;
}

const categories = ['All', 'Pronunciation', 'Grammar', 'Culture', 'Stories', 'Mantras', 'Songs', 'Other'];

export function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      // For now, fetch from admin endpoint without auth to show public videos
      // In production, you'd create a separate public endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/videos?userId=public`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = selectedCategory === 'All'
    ? videos
    : videos.filter(v => v.category === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Sanskrit Videos</h1>
        <p className="text-lg text-muted-foreground">
          Learn Sanskrit through curated video content
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8 flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No videos available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="group cursor-pointer border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative aspect-video bg-muted">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{video.category}</p>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="bg-background rounded-lg p-4">
              <h2 className="text-2xl font-bold mb-2">{selectedVideo.title}</h2>
              <p className="text-sm text-muted-foreground mb-3">{selectedVideo.category}</p>
              {selectedVideo.description && (
                <p className="text-muted-foreground">{selectedVideo.description}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedVideo(null)}
              className="mt-4 w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
