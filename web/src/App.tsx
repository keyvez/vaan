import { useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import { PreferencesProvider, usePreferences } from './lib/preferences-context';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { TranslatePage } from './components/TranslatePage';
import { BabyNamesPage } from './components/BabyNamesPage';
import { DailyWordPage } from './components/DailyWordPage';
import { LearnPage } from './components/LearnPage';
import { AICompanionPage } from './components/AICompanionPage';
import { DonatePage } from './components/DonatePage';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { font } = usePreferences();
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Apply selected font
    document.documentElement.style.fontFamily = `"${font}", sans-serif`;
    
    // Load Google Font
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [font]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'translate':
        return <TranslatePage />;
      case 'baby-names':
        return <BabyNamesPage />;
      case 'daily-word':
        return <DailyWordPage />;
      case 'learn':
        return <LearnPage />;
      case 'ai-companion':
        return <AICompanionPage />;
      case 'donate':
        return <DonatePage />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Meta tags for social media */}
      <head>
        <title>Vaan - Discover the Beauty of Sanskrit</title>
        <meta name="description" content="Your gateway to ancient Sanskrit wisdom. Learn Sanskrit, find baby names, practice daily, and more." />
        <meta property="og:title" content="Vaan - Sanskrit Learning Platform" />
        <meta property="og:description" content="Discover Sanskrit through interactive learning, AI companion, daily words, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://vaan.pages.dev" />
        <meta property="og:site_name" content="Vaan" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Vaan - Sanskrit Learning Platform" />
        <meta name="twitter:description" content="Discover Sanskrit through interactive learning, AI companion, daily words, and more." />
      </head>

      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main>{renderPage()}</main>
      
      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 border-2 border-foreground flex items-center justify-center">
                  <span className="text-xs">वा</span>
                </div>
                <span className="text-lg">Vaan</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your gateway to ancient Sanskrit wisdom
              </p>
            </div>
            
            <div>
              <h4 className="mb-4">Learn</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => setCurrentPage('translate')} className="hover:text-foreground">
                    Translation
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('baby-names')} className="hover:text-foreground">
                    Baby Names
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('daily-word')} className="hover:text-foreground">
                    Daily Word
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4">Practice</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => setCurrentPage('learn')} className="hover:text-foreground">
                    Exercises
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('ai-companion')} className="hover:text-foreground">
                    AI Companion
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => setCurrentPage('donate')} className="hover:text-foreground">
                    Donate
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 Vaan. Preserving Sanskrit for future generations.</p>
          </div>
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </I18nextProvider>
  );
}
