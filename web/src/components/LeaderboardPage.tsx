import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { SEO } from './SEO';
import { Trophy, Heart } from 'lucide-react';
import { useLikes } from '../lib/use-likes';

interface BabyName {
  id: number;
  name: string;
  slug: string;
  gender: string;
  meaning: string;
  pronunciation: string;
  first_letter: string;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function LeaderboardPage() {
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [names, setNames] = useState<BabyName[]>([]);
  const [loading, setLoading] = useState(false);
  const { getLikeCount, isLiked } = useLikes();

  useEffect(() => {
    async function fetchNames() {
      setLoading(true);
      try {
        const response = await fetch(
          `https://vaan-wordlist.keyvez.workers.dev/api/baby-names?letter=${selectedLetter}`
        );
        if (response.ok) {
          const data = await response.json();
          // Sort by like count (for now just show all names)
          setNames(data.names || []);
        }
      } catch (error) {
        console.error('Error fetching names:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNames();
  }, [selectedLetter]);

  // Sort names by like count
  const sortedNames = [...names].sort((a, b) => {
    const likesA = getLikeCount(String(a.id));
    const likesB = getLikeCount(String(b.id));
    return likesB - likesA;
  });

  return (
    <>
      <SEO
        title="Baby Names Leaderboard | संस्कृत रोज़"
        description="Discover the most popular Sanskrit baby names, sorted by letter and community favorites."
        url="/leaderboard"
      />

      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
              <Trophy className="h-8 w-8" />
            </div>
            <h1 className="mb-4">Baby Names Leaderboard</h1>
            <p className="text-muted-foreground">
              Browse popular Sanskrit baby names by first letter
            </p>
          </div>

          {/* Letter Filter */}
          <div className="space-y-2 mb-8">
            <div className="text-center text-sm text-muted-foreground">
              Select a letter
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              {LETTERS.map((letter) => (
                <Button
                  key={letter}
                  variant={selectedLetter === letter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLetter(letter)}
                  className={
                    selectedLetter === letter
                      ? 'bg-foreground text-background'
                      : 'border-foreground'
                  }
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>

          {/* Names List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading names...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedNames.map((name, index) => (
                <Link key={name.id} to={`/baby-names/${name.slug}`}>
                  <Card className="p-6 hover:border-foreground transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl">{name.name || name.pronunciation}</h3>
                          <span className="text-xs px-2 py-1 border border-border rounded">
                            {name.gender}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground italic mb-1">
                          {name.pronunciation}
                        </p>
                        <p className="text-sm">{name.meaning}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Heart
                          className={`h-5 w-5 ${
                            isLiked(String(name.id))
                              ? 'fill-red-500 text-red-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {getLikeCount(String(name.id))}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}

              {sortedNames.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No names found for letter {selectedLetter}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
