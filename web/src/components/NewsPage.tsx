import { useEffect, useState } from 'react';
import { Newspaper, Calendar, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vaan-wordlist.keyvez.workers.dev';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  content_markdown: string;
  source_url: string;
  source_name: string;
  published_at: string;
}

export function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/news?userId=public`);
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading news...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Sanskrit News</h1>
        <p className="text-lg text-muted-foreground">
          Latest updates and news from the Sanskrit world
        </p>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No news available yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {news.map((item) => (
            <article
              key={item.id}
              className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold flex-1">{item.title}</h2>
                {item.source_name && (
                  <span className="ml-4 text-xs px-2 py-1 bg-primary/10 text-primary rounded whitespace-nowrap">
                    {item.source_name}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-4 line-clamp-3">
                {item.content_markdown}
              </p>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(item.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>

                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Read at source
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
