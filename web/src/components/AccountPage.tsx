import { useAuth } from '../lib/auth-context';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Heart, User, Mail, ExternalLink, GraduationCap, BookOpen, Trophy, TrendingUp, Loader2, RotateCw } from 'lucide-react';
import { SEO } from './SEO';
import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://vaan-wordlist.keyvez.workers.dev';

interface UserProgress {
  current_difficulty_level: string;
  total_words_studied: number;
  total_flashcards_reviewed: number;
  total_quizzes_taken: number;
  total_quiz_correct: number;
  quiz_accuracy: number;
}

interface UserStats {
  progress: UserProgress;
  recent_quizzes: Array<{
    correct: number;
    difficulty_level: string;
    attempted_at: string;
    word: string;
  }>;
  words_by_confidence: Array<{
    confidence_level: number;
    count: number;
  }>;
  accuracy_by_difficulty: Array<{
    difficulty_level: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

export function AccountPage() {
  const { user, isAuthenticated } = useAuth();
  const isSupporter = localStorage.getItem('is_sanskrit_supporter') === 'true';
  const supporterSince = localStorage.getItem('supporter_since');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserStats();
    }
  }, [isAuthenticated, user]);

  const fetchUserStats = async () => {
    if (!user) return;

    setLoadingStats(true);
    try {
      const response = await fetch(`${API_BASE}/api/user/stats?userId=${user.id}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-4">Please Sign In</h1>
          <p className="text-muted-foreground">
            You need to be signed in to view your account.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      <SEO
        title="My Account | संस्कृत रोज़"
        description="Manage your संस्कृत रोज़ account and subscriptions"
        url="/account"
      />

      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground rounded-full mb-4">
              <User className="h-8 w-8" />
            </div>
            <h1 className="mb-4">My Account</h1>
            <p className="text-muted-foreground">
              Manage your profile and subscriptions
            </p>
          </div>

          {/* Profile Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-12 w-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                </div>
              </div>

              {isSupporter && (
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="currentColor" />
                    <span className="font-semibold text-orange-900 dark:text-orange-100">
                      Sanskrit Supporter
                    </span>
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Thank you for supporting the revival of Sanskrit!
                    {supporterSince && ` Since ${formatDate(supporterSince)}`}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Learning Progress Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Learning Progress</h2>
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : stats && stats.progress.total_words_studied > 0 ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.progress.total_words_studied}</div>
                    <div className="text-xs text-muted-foreground">Words Studied</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <RotateCw className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.progress.total_flashcards_reviewed}</div>
                    <div className="text-xs text-muted-foreground">Flashcards</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Trophy className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.progress.total_quizzes_taken}</div>
                    <div className="text-xs text-muted-foreground">Quizzes</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.progress.quiz_accuracy}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                </div>

                {/* Current Level */}
                <div className="p-4 border border-border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Current Level</div>
                  <div className="text-lg font-semibold capitalize">{stats.progress.current_difficulty_level}</div>
                </div>

                {/* Accuracy by Difficulty */}
                {stats.accuracy_by_difficulty.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Performance by Level</h3>
                    <div className="space-y-2">
                      {stats.accuracy_by_difficulty.map((acc) => (
                        <div key={acc.difficulty_level} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="capitalize">{acc.difficulty_level}</div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {acc.correct}/{acc.total}
                            </span>
                            <span className="font-semibold">{acc.accuracy}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {stats.recent_quizzes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Recent Quiz Activity</h3>
                    <div className="space-y-2">
                      {stats.recent_quizzes.slice(0, 5).map((quiz, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted rounded text-sm">
                          <span>{quiz.word}</span>
                          <span className={quiz.correct ? 'text-green-600' : 'text-red-600'}>
                            {quiz.correct ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => window.location.href = '/learn'}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  Continue Learning
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  You haven't started learning yet. Begin your Sanskrit journey today!
                </p>
                <Button
                  onClick={() => window.location.href = '/learn'}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  Start Learning
                </Button>
              </div>
            )}
          </Card>

          {/* Subscription Management */}
          {isSupporter && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Subscription Management</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  If you have a recurring donation, you can manage or cancel it anytime through Stripe's customer portal.
                </p>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How to manage your subscription:</h3>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Click the button below to access Stripe's customer portal</li>
                    <li>Sign in using the email associated with your donation ({user.email})</li>
                    <li>You can view, update, or cancel your subscription anytime</li>
                  </ol>
                </div>

                <Button
                  onClick={() => window.open('https://billing.stripe.com/p/login', '_blank')}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Subscription via Stripe
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You'll be redirected to Stripe's secure portal
                </p>
              </div>
            </Card>
          )}

          {!isSupporter && (
            <Card className="p-6 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Support Sanskrit Revival</h2>
              <p className="text-muted-foreground mb-4">
                Help preserve and promote the Sanskrit language by becoming a supporter.
              </p>
              <Button
                onClick={() => window.location.href = '/donate'}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                <Heart className="mr-2 h-4 w-4" />
                Become a Supporter
              </Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
