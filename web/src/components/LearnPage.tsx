import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GraduationCap, RotateCw, Check, X, User, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

const API_BASE = import.meta.env.VITE_API_URL || 'https://vaan-wordlist.keyvez.workers.dev';

interface LearningWord {
  id: number;
  sanskrit: string;
  transliteration: string;
  improved_translation: string;
  meaning: string;
  example_phrase: string;
  difficulty_level: string;
  quiz_choices: string[];
  story: string;
}

interface Flashcard {
  id: number;
  sanskrit: string;
  transliteration: string;
  meaning: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  sanskrit: string;
  difficulty: string;
}

export function LearnPage() {
  const { t } = useTranslation();
  const { isAuthenticated, login, user } = useAuth();
  const [words, setWords] = useState<LearningWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(0);

  // Fetch learning words on mount and when difficulty changes
  useEffect(() => {
    fetchLearningWords();
  }, [difficulty]);

  // Upsert user on login
  useEffect(() => {
    if (isAuthenticated && user) {
      fetch(`${API_BASE}/api/user/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture
        })
      }).catch(err => console.error('Failed to upsert user:', err));
    }
  }, [isAuthenticated, user]);

  const fetchLearningWords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/learning-words?difficulty=${difficulty}&limit=20`);
      const data = await response.json();
      setWords(data.words || []);
      setFlashcardIndex(0);
      setQuizIndex(0);
      setScore(0);
      setCompletedQuestions(0);
    } catch (error) {
      console.error('Failed to fetch learning words:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert words to flashcards
  const flashcards: Flashcard[] = words.map(word => ({
    id: word.id,
    sanskrit: word.sanskrit,
    transliteration: word.transliteration,
    meaning: word.improved_translation
  }));

  // Convert words to quiz questions
  const quizQuestions: QuizQuestion[] = words.map(word => {
    // Shuffle answer options
    const allOptions = [word.improved_translation, ...word.quiz_choices];
    const shuffled = allOptions.sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.indexOf(word.improved_translation);

    return {
      id: word.id,
      question: `What does '${word.sanskrit}' (${word.transliteration}) mean?`,
      options: shuffled,
      correct: correctIndex,
      sanskrit: word.sanskrit,
      difficulty: word.difficulty_level
    };
  });

  const currentFlashcard = flashcards[flashcardIndex];
  const currentQuestion = quizQuestions[quizIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const trackFlashcardReview = async (wordId: number, confidenceLevel: number) => {
    if (!isAuthenticated || !user) return;

    try {
      await fetch(`${API_BASE}/api/user/flashcard-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          babyNameId: wordId,
          confidenceLevel
        })
      });
    } catch (error) {
      console.error('Failed to track flashcard review:', error);
    }
  };

  const nextFlashcard = () => {
    // Track review if user has seen the card (flipped it)
    if (isFlipped && currentFlashcard) {
      trackFlashcardReview(currentFlashcard.id, 3); // Default confidence level
    }

    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const previousFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const trackQuizAttempt = async (wordId: number, correct: boolean, difficultyLevel: string) => {
    if (!isAuthenticated || !user) return;

    try {
      await fetch(`${API_BASE}/api/user/quiz-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          babyNameId: wordId,
          correct,
          difficultyLevel
        })
      });
    } catch (error) {
      console.error('Failed to track quiz attempt:', error);
    }
  };

  const checkAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correct;
    setShowResult(true);

    if (isCorrect) {
      setScore(score + 1);
    }

    setCompletedQuestions(completedQuestions + 1);

    // Track quiz attempt
    if (currentQuestion) {
      trackQuizAttempt(currentQuestion.id, isCorrect, currentQuestion.difficulty);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      // Reset quiz
      setQuizIndex(0);
      setScore(0);
      setCompletedQuestions(0);
    }
  };

  const progress = quizQuestions.length > 0 ? (completedQuestions / quizQuestions.length) * 100 : 0;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading learning materials...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no words
  if (words.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="h-16 w-16 mx-auto mb-4" />
          <h1 className="mb-4">No Learning Materials Available</h1>
          <p className="text-muted-foreground mb-8">
            We're currently generating learning materials for this difficulty level. Please check back soon!
          </p>
          <Button onClick={() => setDifficulty('beginner')}>Try Beginner Level</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="mb-4">{t('learn.title')}</h1>
          <p className="text-muted-foreground mb-6">
            Interactive exercises to master Sanskrit
          </p>

          {/* Difficulty Selector */}
          <div className="flex justify-center gap-2 mb-4">
            <Button
              variant={difficulty === 'beginner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('beginner')}
              className={difficulty === 'beginner' ? 'bg-foreground text-background' : ''}
            >
              Beginner
            </Button>
            <Button
              variant={difficulty === 'intermediate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('intermediate')}
              className={difficulty === 'intermediate' ? 'bg-foreground text-background' : ''}
            >
              Intermediate
            </Button>
            <Button
              variant={difficulty === 'advanced' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('advanced')}
              className={difficulty === 'advanced' ? 'bg-foreground text-background' : ''}
            >
              Advanced
            </Button>
          </div>
        </div>

        {/* Sign Up Section - Only show if not authenticated */}
        {!isAuthenticated && (
          <Card className="p-6 mb-8 border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Track Your Learning Progress</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Sign up to save your scores, track improvement over time, and get personalized recommendations.
                </p>
              </div>
              <Button
                onClick={login}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white whitespace-nowrap"
              >
                <User className="mr-2 h-4 w-4" />
                Sign Up Free
              </Button>
            </div>
          </Card>
        )}

        <Tabs defaultValue="flashcards" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="flashcards">{t('learn.flashcards')}</TabsTrigger>
            <TabsTrigger value="quiz">{t('learn.quiz')}</TabsTrigger>
          </TabsList>

          {/* Flashcards */}
          <TabsContent value="flashcards">
            <div className="space-y-6">
              {/* Flashcard */}
              <Card
                className="relative h-80 cursor-pointer transition-all duration-500 hover:border-foreground"
                onClick={handleFlip}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                <div className="absolute inset-0 p-8 flex flex-col items-center justify-center">
                  {!isFlipped ? (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">Sanskrit</p>
                      <h2 className="text-5xl mb-4">{currentFlashcard.sanskrit}</h2>
                      <p className="text-xl text-muted-foreground">
                        {currentFlashcard.transliteration}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center" style={{ transform: 'rotateY(180deg)' }}>
                      <p className="text-sm text-muted-foreground mb-4">English Meaning</p>
                      <h2 className="text-3xl">{currentFlashcard.meaning}</h2>
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-4 right-4">
                  <RotateCw className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>

              {/* Controls */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    previousFlashcard();
                  }}
                  className="border-foreground"
                >
                  {t('learn.previous')}
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {flashcardIndex + 1} / {flashcards.length}
                </span>
                
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextFlashcard();
                  }}
                  className="border-foreground"
                >
                  {t('learn.next')}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Click the card to flip
              </p>
            </div>
          </TabsContent>

          {/* Quiz */}
          <TabsContent value="quiz">
            <div className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('learn.progress')}</span>
                  <span>{completedQuestions} / {quizQuestions.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question */}
              <Card className="p-8">
                <h3 className="mb-6">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = index === currentQuestion.correct;
                    const isSelected = index === selectedAnswer;
                    
                    let buttonClass = 'border-foreground';
                    if (showResult && isSelected) {
                      buttonClass = isCorrect ? 'border-green-600 bg-green-50 dark:bg-green-950' : 'border-red-600 bg-red-50 dark:bg-red-950';
                    } else if (showResult && isCorrect) {
                      buttonClass = 'border-green-600 bg-green-50 dark:bg-green-950';
                    } else if (isSelected) {
                      buttonClass = 'bg-foreground text-background';
                    }
                    
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className={`w-full justify-between ${buttonClass}`}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showResult}
                      >
                        <span>{option}</span>
                        {showResult && isCorrect && <Check className="h-5 w-5 text-green-600" />}
                        {showResult && isSelected && !isCorrect && <X className="h-5 w-5 text-red-600" />}
                      </Button>
                    );
                  })}
                </div>

                {/* Result Message */}
                {showResult && (
                  <div className="mt-6 text-center">
                    {selectedAnswer === currentQuestion.correct ? (
                      <p className="text-green-600">Correct! Well done! 🎉</p>
                    ) : (
                      <p className="text-red-600">Not quite. Keep learning! 📚</p>
                    )}
                  </div>
                )}
              </Card>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                {!showResult ? (
                  <Button
                    onClick={checkAnswer}
                    disabled={selectedAnswer === null}
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    {t('learn.checkAnswer')}
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    {quizIndex < quizQuestions.length - 1 ? t('learn.next') : 'Restart Quiz'}
                  </Button>
                )}
              </div>

              {/* Score */}
              {completedQuestions > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  Score: {score} / {completedQuestions}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
