import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GraduationCap, RotateCw, Check, X } from 'lucide-react';
import { flashcards, quizQuestions } from '../lib/sanskrit-data';

export function LearnPage() {
  const { t } = useTranslation();
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(0);

  const currentFlashcard = flashcards[flashcardIndex];
  const currentQuestion = quizQuestions[quizIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const nextFlashcard = () => {
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

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    if (selectedAnswer === currentQuestion.correct) {
      setScore(score + 1);
    }
    setCompletedQuestions(completedQuestions + 1);
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

  const progress = (completedQuestions / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="mb-4">{t('learn.title')}</h1>
          <p className="text-muted-foreground">
            Interactive exercises to master Sanskrit
          </p>
        </div>

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
