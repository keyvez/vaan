import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Users, BookOpen, Baby, Video, FileText, Newspaper, TrendingUp } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vaan-wordlist.keyvez.workers.dev';

interface Stats {
  users: {
    total: number;
    recent_signups: number;
    active_users: number;
  };
  content: {
    lexemes: number;
    baby_names: number;
    videos: number;
    blog_posts: number;
    published_blogs: number;
    draft_blogs: number;
    news: number;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
}

function StatCard({ title, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          {trend}
        </div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/stats/overview?userId=${encodeURIComponent(user.id)}`
      );

      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
        <p className="text-destructive">Error: {error}</p>
        <button
          onClick={loadStats}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
        <p className="text-muted-foreground">Here's what's happening with संस्कृत रोज़</p>
      </div>

      {/* User Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4">User Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            icon={<Users className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Active Users"
            value={stats.users.active_users}
            icon={<Users className="w-6 h-6 text-primary" />}
            subtitle="Last 7 days"
          />
          <StatCard
            title="Recent Signups"
            value={stats.users.recent_signups}
            icon={<TrendingUp className="w-6 h-6 text-primary" />}
            subtitle="Last 30 days"
          />
        </div>
      </div>

      {/* Content Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Sanskrit Words"
            value={stats.content.lexemes}
            icon={<BookOpen className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Baby Names"
            value={stats.content.baby_names}
            icon={<Baby className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Videos"
            value={stats.content.videos}
            icon={<Video className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="News Items"
            value={stats.content.news}
            icon={<Newspaper className="w-6 h-6 text-primary" />}
          />
        </div>
      </div>

      {/* Blog Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Blog Posts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Posts"
            value={stats.content.blog_posts}
            icon={<FileText className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Published"
            value={stats.content.published_blogs}
            icon={<FileText className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Drafts"
            value={stats.content.draft_blogs}
            icon={<FileText className="w-6 h-6 text-yellow-600" />}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/videos?node=raton-noir-189843"
            className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <Video className="w-6 h-6 mb-2 text-primary" />
            <h4 className="font-medium mb-1">Add Video</h4>
            <p className="text-sm text-muted-foreground">Upload a new Sanskrit video</p>
          </a>
          <a
            href="/admin/blog?node=raton-noir-189843"
            className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <FileText className="w-6 h-6 mb-2 text-primary" />
            <h4 className="font-medium mb-1">New Blog Post</h4>
            <p className="text-sm text-muted-foreground">Write a new article</p>
          </a>
          <a
            href="/admin/news?node=raton-noir-189843"
            className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <Newspaper className="w-6 h-6 mb-2 text-primary" />
            <h4 className="font-medium mb-1">Add News</h4>
            <p className="text-sm text-muted-foreground">Post Sanskrit news</p>
          </a>
          <a
            href="/admin/users?node=raton-noir-189843"
            className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <Users className="w-6 h-6 mb-2 text-primary" />
            <h4 className="font-medium mb-1">Manage Users</h4>
            <p className="text-sm text-muted-foreground">View user activity</p>
          </a>
        </div>
      </div>
    </div>
  );
}
