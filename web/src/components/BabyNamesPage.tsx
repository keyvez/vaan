import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { SEO } from './SEO';
import { Baby, Search, Loader2, Heart } from 'lucide-react';
import { useLikes } from '../lib/use-likes';
import { SignInDialog } from './SignInDialog';

const DEFAULT_BABY_NAMES_API = 'https://vaan-wordlist.keyvez.workers.dev/api/baby-names';
const BABY_NAMES_API_ENDPOINT =
  import.meta.env.VITE_BABY_NAMES_API_ENDPOINT?.trim() || DEFAULT_BABY_NAMES_API;

type BabyName = {
  id: number;
  name: string;
  slug: string;
  gender: 'boy' | 'girl' | 'unisex';
  meaning: string;
  pronunciation: string;
  story?: string;
  first_letter: string;
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function BabyNamesPage() {
  const { t } = useTranslation();
  const { letter: letterParam } = useParams<{ letter?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [letterFilter, setLetterFilter] = useState<string>(
    letterParam && letterParam.length === 1 ? letterParam.toUpperCase() : ''
  );
  const [names, setNames] = useState<BabyName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toggleLike, isLiked, showSignInDialog, setShowSignInDialog } = useLikes();

  // Update letter filter when route param changes
  useEffect(() => {
    if (letterParam && letterParam.length === 1) {
      setLetterFilter(letterParam.toUpperCase());
    } else if (!letterParam) {
      setLetterFilter('');
    }
  }, [letterParam]);

  const fetchNames = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (genderFilter !== 'all') params.set('gender', genderFilter);
      if (letterFilter) params.set('letter', letterFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`${BABY_NAMES_API_ENDPOINT}?${params}`, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch baby names: ${response.status}`);
      }

      const data = await response.json();
      setNames(data.names || []);
    } catch (err) {
      console.error('Unable to fetch baby names', err);
      setError('Unable to fetch baby names. Please try again.');
      setNames([]);
    } finally {
      setLoading(false);
    }
  }, [genderFilter, letterFilter, searchQuery]);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  return (
    <>
      <SEO
        title="Sanskrit Baby Names - Find Meaningful Names | संस्कृत रोज़"
        description="Discover beautiful Sanskrit baby names with deep meanings, pronunciation guides, and cultural stories. Find the perfect name for your baby."
        url="/baby-names"
      />
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
              <Baby className="h-8 w-8" />
            </div>
            <h1 className="mb-4">{t('babyNames.title')}</h1>
            <p className="text-muted-foreground">
              {t('babyNames.subtitle')}
            </p>
          </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('babyNames.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-border"
              disabled={loading}
            />
          </div>

          {/* Gender Filter */}
          <div className="flex justify-center gap-2">
            <Button
              variant={genderFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setGenderFilter('all')}
              className={genderFilter === 'all' ? 'bg-foreground text-background' : 'border-foreground'}
              disabled={loading}
            >
              {t('babyNames.all')}
            </Button>
            <Button
              variant={genderFilter === 'boy' ? 'default' : 'outline'}
              onClick={() => setGenderFilter('boy')}
              className={genderFilter === 'boy' ? 'bg-foreground text-background' : 'border-foreground'}
              disabled={loading}
            >
              {t('babyNames.boy')}
            </Button>
            <Button
              variant={genderFilter === 'girl' ? 'default' : 'outline'}
              onClick={() => setGenderFilter('girl')}
              className={genderFilter === 'girl' ? 'bg-foreground text-background' : 'border-foreground'}
              disabled={loading}
            >
              {t('babyNames.girl')}
            </Button>
          </div>

          {/* Letter Filter */}
          <div className="space-y-2">
            <div className="text-center text-sm text-muted-foreground">
              Browse by first letter
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              <Link to="/baby-names">
                <Button
                  variant={letterFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  className={letterFilter === '' ? 'bg-foreground text-background' : 'border-foreground'}
                  disabled={loading}
                >
                  All
                </Button>
              </Link>
              {LETTERS.map((letter) => (
                <Link key={letter} to={`/baby-names/${letter.toLowerCase()}`}>
                  <Button
                    variant={letterFilter === letter ? 'default' : 'outline'}
                    size="sm"
                    className={letterFilter === letter ? 'bg-foreground text-background' : 'border-foreground'}
                    disabled={loading}
                  >
                    {letter}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading baby names...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchNames} variant="outline" className="border-foreground">
              Try Again
            </Button>
          </div>
        )}

        {/* Names Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {names.map((name) => (
                <Link key={name.id} to={`/baby-names/${name.slug}`}>
                  <Card className="p-6 hover:border-foreground transition-colors cursor-pointer h-full relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleLike(String(name.id));
                      }}
                      className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors z-10"
                      aria-label="Like this name"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isLiked(String(name.id))
                            ? 'fill-red-500 text-red-500'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      />
                    </button>
                    <div className="flex items-start justify-between mb-3 pr-8">
                      <h3>{name.name || name.pronunciation}</h3>
                      <span className="text-xs px-2 py-1 border border-border rounded">
                        {name.gender}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('babyNames.pronunciation')}: </span>
                        <span className="italic">{name.pronunciation}</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground">{t('babyNames.meaning')}: </span>
                        <span>{name.meaning}</span>
                      </div>

                      {name.story && (
                        <p className="text-muted-foreground pt-2 border-t border-border mt-3 line-clamp-2">
                          {name.story}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* No Results */}
            {names.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No names found. Try adjusting your search or filters.
                </p>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      <SignInDialog open={showSignInDialog} onOpenChange={setShowSignInDialog} />
    </>
  );
}
