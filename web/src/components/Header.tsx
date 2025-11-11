import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { usePreferences, AVAILABLE_FONTS } from '../lib/preferences-context';
import { Moon, Sun, Menu, Settings } from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

export function Header() {
  const { t } = useTranslation();
  const { theme, setTheme, font, setFont, language, setLanguage } = usePreferences();
  const location = useLocation();

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/translate', label: t('nav.translate') },
    { path: '/baby-names', label: t('nav.babyNames') },
    { path: '/daily-word', label: t('nav.dailyWord') },
    { path: '/learn', label: t('nav.learn') },
    { path: '/ai-companion', label: t('nav.aiCompanion') },
    { path: '/donate', label: t('nav.donate') },
  ];

  return (
    <header className="border-b border-border sticky top-0 bg-background z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 hover:opacity-70 transition-opacity"
          >
            <div className="w-8 h-8 border-2 border-foreground flex items-center justify-center">
              <span className="text-xs">वा</span>
            </div>
            <span className="text-lg">Vaan</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 transition-colors ${
                    isActive
                      ? 'text-foreground border-b-2 border-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h3 className="text-sm">{t('settings.title')}</h3>
                  
                  {/* Language Selector */}
                  <div className="space-y-2">
                    <label className="text-sm">{t('settings.language')}</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Selector */}
                  <div className="space-y-2">
                    <label className="text-sm">{t('settings.font')}</label>
                    <Select value={font} onValueChange={setFont}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {AVAILABLE_FONTS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `text-left px-4 py-2 transition-colors ${
                          isActive
                            ? 'text-foreground border-l-2 border-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
