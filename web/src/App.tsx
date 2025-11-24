import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import { PreferencesProvider, usePreferences } from './lib/preferences-context';
import { AuthProvider } from './lib/auth-context';
import { AdminProvider } from './lib/admin-context';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { TranslatePage } from './components/TranslatePage';
import { BabyNamesPage } from './components/BabyNamesPage';
import { BabyNameDetailPage } from './components/BabyNameDetailPage';
import { BabyNamesRouter } from './components/BabyNamesRouter';
import { LeaderboardPage } from './components/LeaderboardPage';
import { DailyWordPage } from './components/DailyWordPage';
import { LearnPage } from './components/LearnPage';
import { AICompanionPage } from './components/AICompanionPage';
import { DonatePage } from './components/DonatePage';
import { AccountPage } from './components/AccountPage';
import { VideosPage } from './components/VideosPage';
import { BlogPage } from './components/BlogPage';
import { NewsPage } from './components/NewsPage';
import { Toaster } from './components/ui/sonner';
import { AdminGuard } from './components/AdminGuard';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminVideos } from './components/admin/AdminVideos';
import { AdminBlog } from './components/admin/AdminBlog';
import { AdminNews } from './components/admin/AdminNews';
import {
  AdminLexicon,
  AdminBabyNames,
  AdminDailyWords,
  AdminUsers,
  AdminTranslations
} from './components/admin/AdminPlaceholderPages';

function AppContent() {
  const { font } = usePreferences();

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

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <AdminGuard>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="lexicon" element={<AdminLexicon />} />
                  <Route path="baby-names" element={<AdminBabyNames />} />
                  <Route path="daily-words" element={<AdminDailyWords />} />
                  <Route path="videos" element={<AdminVideos />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="news" element={<AdminNews />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="translations" element={<AdminTranslations />} />
                  <Route path="*" element={<AdminDashboard />} />
                </Routes>
              </AdminLayout>
            </AdminGuard>
          } />

          {/* Public Routes */}
          <Route path="*" element={
            <>
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/translate" element={<TranslatePage />} />
                  <Route path="/baby-names" element={<BabyNamesPage />} />
                  <Route path="/baby-names/:letter" element={<BabyNamesRouter />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/daily-word" element={<DailyWordPage />} />
                  <Route path="/learn" element={<LearnPage />} />
                  <Route path="/ai-companion" element={<AICompanionPage />} />
                  <Route path="/videos" element={<VideosPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/donate" element={<DonatePage />} />
                  <Route path="/account" element={<AccountPage />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>

        {/* Footer */}
        <footer className="border-t border-border mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 border-2 border-foreground flex items-center justify-center">
                    <span className="text-xs">सं</span>
                  </div>
                  <span className="text-lg">संस्कृत रोज़</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your gateway to ancient Sanskrit wisdom
                </p>
              </div>

              <div>
                <h4 className="mb-4">Learn</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link to="/translate" className="hover:text-foreground">
                      Translation
                    </Link>
                  </li>
                  <li>
                    <Link to="/baby-names" className="hover:text-foreground">
                      Baby Names
                    </Link>
                  </li>
                  <li>
                    <Link to="/daily-word" className="hover:text-foreground">
                      Daily Word
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4">Practice</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link to="/learn" className="hover:text-foreground">
                      Exercises
                    </Link>
                  </li>
                  <li>
                    <Link to="/ai-companion" className="hover:text-foreground">
                      AI Companion
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link to="/donate" className="hover:text-foreground">
                      Donate
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
              <p>© 2025 संस्कृत रोज़. Preserving Sanskrit for future generations.</p>
            </div>
          </div>
        </footer>

        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <AdminProvider>
            <PreferencesProvider>
              <AppContent />
            </PreferencesProvider>
          </AdminProvider>
        </AuthProvider>
      </I18nextProvider>
    </HelmetProvider>
  );
}
