import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Languages, Loader2 } from 'lucide-react';

export function TranslatePage() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://free-translate-go-api.onrender.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          to: 'sa'
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslatedText(data.translatedText || data.text || 'Translation unavailable');
    } catch (err) {
      setError('Translation service unavailable. Please try again later.');
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
            <Languages className="h-8 w-8" />
          </div>
          <h1 className="mb-4">{t('translate.title')}</h1>
          <p className="text-muted-foreground">
            Translate any text to Sanskrit instantly
          </p>
        </div>

        <div className="space-y-6">
          {/* Input Section */}
          <Card className="p-6">
            <label className="block mb-2 text-sm">
              Enter text in English
            </label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('translate.placeholder')}
              className="min-h-32 resize-none border-border"
            />
          </Card>

          {/* Translate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleTranslate}
              disabled={!inputText.trim() || loading}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  {t('translate.button')}
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 border-destructive">
              <p className="text-sm text-destructive">{error}</p>
            </Card>
          )}

          {/* Output Section */}
          {translatedText && !error && (
            <Card className="p-6">
              <label className="block mb-2 text-sm">
                {t('translate.result')}
              </label>
              <div className="p-4 bg-secondary/30 rounded-md border border-border min-h-32">
                <p className="text-lg">{translatedText}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 p-6 border border-border rounded-lg">
          <h3 className="mb-4">About Sanskrit Translation</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Sanskrit is one of the oldest languages in the world, with a rich literary 
              tradition spanning over 3,500 years.
            </p>
            <p>
              Our translation engine uses modern AI to help you express contemporary 
              thoughts in this ancient language, preserving its grammatical elegance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
