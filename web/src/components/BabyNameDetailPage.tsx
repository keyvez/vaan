import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Copy, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { SEO } from './SEO';
import { toast } from 'sonner';

interface BabyName {
  id: number;
  name: string;
  slug: string;
  gender: string;
  meaning: string;
  pronunciation: string;
  story?: string;
  reasoning?: string;
  first_letter: string;
}

export function BabyNameDetailPage() {
  const { letter: slug } = useParams<{ letter: string }>();
  const [name, setName] = useState<BabyName | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchName() {
      try {
        const response = await fetch(
          `https://vaan-wordlist.keyvez.workers.dev/api/baby-names/${slug}`
        );
        if (response.ok) {
          const data = await response.json();
          setName(data);
        } else {
          console.error('Failed to fetch baby name');
        }
      } catch (error) {
        console.error('Error fetching baby name:', error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchName();
    }
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    const displayName = name?.name || name?.pronunciation || slug?.replace(/-/g, ' ') || '';
    const shareData = {
      title: `${displayName} - Sanskrit Baby Name`,
      text: `${displayName} (${name?.pronunciation}) - ${name?.meaning}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!name) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl mb-4">Baby name not found</h1>
        <Link to="/baby-names">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Baby Names
          </Button>
        </Link>
      </div>
    );
  }

  // Use pronunciation as fallback if name is empty
  const displayName = name.name || name.pronunciation || slug?.replace(/-/g, ' ') || '';

  const ogImageUrl = `https://vaan-og-images.keyvez.workers.dev/baby-name/${slug}?` +
    `name=${encodeURIComponent(displayName)}&` +
    `pronunciation=${encodeURIComponent(name.pronunciation)}&` +
    `meaning=${encodeURIComponent(name.meaning)}&` +
    `story=${encodeURIComponent(name.story || '')}&` +
    `gender=${encodeURIComponent(name.gender)}`;

  return (
    <>
      <SEO
        title={`${displayName} - Sanskrit Baby Name | संस्कृत रोज़`}
        description={`${displayName} (${name.pronunciation}) - ${name.meaning}. Discover the meaning and cultural significance of this beautiful Sanskrit name.`}
        image={ogImageUrl}
        url={`/baby-names/${slug}`}
        type="article"
      />

      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link to="/baby-names" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all names
          </Link>

          {/* Main Card */}
          <Card className="p-8">
            {/* Header with Share Button */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-5xl font-bold">{displayName}</h1>
                  <span
                    className={`px-4 py-1 rounded-full text-sm ${
                      name.gender === 'boy'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : name.gender === 'girl'
                        ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}
                  >
                    {name.gender}
                  </span>
                </div>
                <p className="text-2xl text-muted-foreground">{name.pronunciation}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="default" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Meaning */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Meaning</h2>
              <p className="text-lg">{name.meaning}</p>
            </div>

            {/* Story/Cultural Context */}
            {name.story && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Cultural Significance</h2>
                <p className="text-lg leading-relaxed">{name.story}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
              <div>
                <h3 className="font-semibold mb-2">Pronunciation Guide</h3>
                <p className="text-muted-foreground">{name.pronunciation}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">First Letter</h3>
                <p className="text-muted-foreground">{name.first_letter}</p>
              </div>
            </div>
          </Card>

          {/* Related Names */}
          <div className="mt-8 text-center">
            <Link to={`/baby-names?letter=${name.first_letter}`}>
              <Button variant="outline">
                View more names starting with {name.first_letter}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
