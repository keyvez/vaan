import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { SEO } from './SEO';
import { ArrowRight, BookOpen, MessageSquare, Baby, Calendar, GraduationCap, Heart } from 'lucide-react';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: t('nav.translate'),
      description: "Translate any text to Sanskrit using our powerful translation engine",
      path: '/translate'
    },
    {
      icon: <Baby className="h-8 w-8" />,
      title: t('nav.babyNames'),
      description: "Find the perfect Sanskrit name for your baby with deep meanings",
      path: '/baby-names'
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: t('nav.dailyWord'),
      description: "Learn one Sanskrit word every day with phonetics and cultural context",
      path: '/daily-word'
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: t('nav.learn'),
      description: "Practice with interactive exercises, flashcards, and quizzes",
      path: '/learn'
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: t('nav.aiCompanion'),
      description: "Chat with Sanskrit Saṃvāda, your AI language companion",
      path: '/ai-companion'
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: t('nav.donate'),
      description: "Support the revival and preservation of Sanskrit language",
      path: '/donate'
    }
  ];

  return (
    <>
      <SEO
        title="Vaan - Discover the Beauty of Sanskrit"
        description="Your gateway to ancient Sanskrit wisdom. Learn Sanskrit, find meaningful baby names, practice daily, and explore the language with AI assistance."
        url="/"
      />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('hero.subtitle')}
            </p>
            <Button
              onClick={() => navigate('/learn')}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {t('hero.cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:border-foreground transition-colors cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="border-t border-border py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-6">
            Reviving Ancient Wisdom for Modern Times
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sanskrit is not just a language—it's a gateway to millennia of knowledge, 
            philosophy, and cultural heritage. Our mission is to make Sanskrit accessible 
            to everyone, preserving this ancient treasure for future generations.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/donate')}
            className="border-foreground text-foreground hover:bg-foreground hover:text-background"
          >
            Support Our Mission
          </Button>
        </div>
      </section>
      </div>
    </>
  );
}
