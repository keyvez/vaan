import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vaan-wordlist.keyvez.workers.dev';

interface Video {
  id: number;
  title: string;
  slug: string;
  youtube_url: string;
  youtube_id: string;
  description: string;
  duration: number;
  category: string;
  thumbnail_url: string;
  published_at: string;
  created_at: string;
}

const categories = ['Pronunciation', 'Grammar', 'Culture', 'Stories', 'Mantras', 'Songs', 'Other'];

export function AdminVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVideo, setNewVideo] = useState({
    youtubeUrl: '',
    category: 'Pronunciation',
    description: '',
    publishedAt: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/videos?userId=${encodeURIComponent(user.id)}`
      );

      if (!response.ok) throw new Error('Failed to load videos');

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          youtubeUrl: newVideo.youtubeUrl,
          category: newVideo.category,
          description: newVideo.description,
          publishedAt: newVideo.publishedAt
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add video');
      }

      await loadVideos();
      setShowAddModal(false);
      setNewVideo({
        youtubeUrl: '',
        category: 'Pronunciation',
        description: '',
        publishedAt: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/videos/${videoId}?userId=${encodeURIComponent(user.id)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete video');

      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sanskrit Videos</h2>
          <p className="text-muted-foreground">Manage video content</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          <span>Add Video</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold line-clamp-2">{video.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{video.category}</p>
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
              )}
              <div className="flex items-center justify-between">
                <a
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Watch
                </a>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No videos yet. Add your first video!</p>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Sanskrit Video</h3>
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">YouTube URL *</label>
                <input
                  type="url"
                  required
                  value={newVideo.youtubeUrl}
                  onChange={(e) => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Video title and thumbnail will be auto-fetched
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={newVideo.category}
                  onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Published Date</label>
                <input
                  type="date"
                  value={newVideo.publishedAt}
                  onChange={(e) => setNewVideo({ ...newVideo, publishedAt: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border rounded-md hover:bg-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
