import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vaan-wordlist.keyvez.workers.dev';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  content_markdown: string;
  source_url: string;
  source_name: string;
  published_at: string;
  created_at: string;
}

export function AdminNews() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sourceUrl: '',
    sourceName: '',
    publishedAt: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/news?userId=${encodeURIComponent(user.id)}`
      );
      if (!response.ok) throw new Error('Failed to load news');
      const data = await response.json();
      setNews(data.news || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const url = editingNews
        ? `${API_BASE_URL}/api/admin/news/${editingNews.id}`
        : `${API_BASE_URL}/api/admin/news`;

      const response = await fetch(url, {
        method: editingNews ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...formData })
      });

      if (!response.ok) throw new Error('Failed to save news');

      await loadNews();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save news');
    }
  };

  const handleDelete = async (newsId: number) => {
    if (!user || !confirm('Delete this news item?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/news/${newsId}?userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE'
      });
      await loadNews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      sourceUrl: '',
      sourceName: '',
      publishedAt: new Date().toISOString().split('T')[0]
    });
    setEditingNews(null);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      content: item.content_markdown,
      sourceUrl: item.source_url,
      sourceName: item.source_name,
      publishedAt: item.published_at.split('T')[0]
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sanskrit News</h2>
          <p className="text-muted-foreground">Manage news items</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          <span>Add News</span>
        </button>
      </div>

      {error && <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">{error}</div>}

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    {item.source_name && (
                      <span className="text-xs px-2 py-1 bg-secondary rounded">{item.source_name}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.content_markdown}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{new Date(item.published_at).toLocaleDateString()}</span>
                    {item.source_url && (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Source
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={() => openEditModal(item)} className="p-2 hover:bg-secondary rounded-md">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {news.length === 0 && <div className="text-center py-12 text-muted-foreground">No news items found</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background border border-border rounded-lg max-w-3xl w-full p-6 my-8">
            <h3 className="text-xl font-bold mb-4">{editingNews ? 'Edit News' : 'Add News'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Source Name</label>
                  <input
                    type="text"
                    value={formData.sourceName}
                    onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="e.g., Sanskrit Times"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Source URL</label>
                  <input
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content (Markdown) *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm"
                  placeholder="Write the news content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Published Date</label>
                <input
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save News</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
