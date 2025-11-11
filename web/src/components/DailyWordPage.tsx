import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { SEO } from './SEO';
import { Calendar, Share2, Download, Facebook, Twitter, Linkedin, Loader2 } from 'lucide-react';
import { toPng, getFontEmbedCSS } from 'html-to-image';

const DEFAULT_WORD_API_ENDPOINT = 'https://vaan-wordlist.keyvez.workers.dev/api/word-of-day';
const WORD_API_ENDPOINT =
  import.meta.env.VITE_WORD_API_ENDPOINT?.trim() || DEFAULT_WORD_API_ENDPOINT;

type DailyWord = {
  id: number;
  word: string;
  transliteration?: string | null;
  primaryMeaning: string;
  meanings: string[];
  partOfSpeech?: string | null;
  hindiMeaning?: string | null;
  tags?: string[];
};

export function DailyWordPage() {
  const { t } = useTranslation();
  const [word, setWord] = useState<DailyWord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchWord = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(WORD_API_ENDPOINT, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch word: ${response.status}`);
      }
      const payload = await response.json();
      const normalized = normalizePayload(payload);
      setWord(normalized);
    } catch (err) {
      console.error('Unable to fetch word of the day', err);
      setError('Unable to fetch the word of the day. Please try again.');
      setWord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  const additionalMeanings = useMemo(() => {
    if (!word) return [];
    return word.meanings.filter(
      (meaning) => meaning && meaning.toLowerCase() !== word.primaryMeaning.toLowerCase()
    );
  }, [word]);

  const disabledInteractions = loading || !word;

  const handleShare = async (platform: string) => {
    if (!word) return;

    const shareUrl = `https://vaan.pages.dev/daily-word`;
    const shareText = `Today's Sanskrit Word: ${word.word} (${word.primaryMeaning})`;

    const urls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleDownload = async () => {
    if (!word || !cardRef.current) return;

    try {
      await document.fonts.ready;
      const node = cardRef.current;
      const backgroundColor = window.getComputedStyle(node).backgroundColor || '#ffffff';
      const fontEmbedCSS = await getFontEmbedCSS(node);

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: Math.max(2, window.devicePixelRatio || 1),
        fontEmbedCSS,
        style: {
          backgroundColor,
          width: `${node.offsetWidth}px`
        }
      });

      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `sanskrit-word-${word.word}.png`;
      anchor.click();
    } catch (exportError) {
      console.error('Failed to download card preview', exportError);
      setError('Unable to download the card. Please try again.');
    }
  };

  const ogImageUrl = word
    ? `https://vaan-og-images.keyvez.workers.dev/word/${word.id}?` +
      `sanskrit=${encodeURIComponent(word.word)}&` +
      `transliteration=${encodeURIComponent(word.transliteration || '')}&` +
      `meaning=${encodeURIComponent(word.primaryMeaning)}`
    : 'https://vaan-og-images.keyvez.workers.dev/word/0?sanskrit=Sanskrit&transliteration=sanskrit&meaning=Ancient%20language';
  const pageTitle = word
    ? `${word.word} - Daily Sanskrit Word | Vaan`
    : 'Daily Sanskrit Word | Vaan';
  const pageDescription = word
    ? `${word.word} (${word.transliteration || word.word}) - ${word.primaryMeaning}. Learn a new Sanskrit word every day.`
    : 'Learn a new Sanskrit word every day with pronunciation, meaning, and cultural context.';

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        image={ogImageUrl}
        url="/daily-word"
      />
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h1 className="mb-4">{t('daily.title')}</h1>
            <p className="text-muted-foreground">
              One Sanskrit word a day - Learn, Share, Inspire
            </p>
          </div>

        <Card ref={cardRef} className="p-12 mb-8 border-2 border-foreground min-h-[420px]">
          <div className="text-center space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-muted-foreground text-sm">Fetching a fresh Sanskrit word...</p>
              </div>
            )}

            {!loading && word && (
              <>
                <div className="text-6xl md:text-7xl mb-4 break-words">
                  {word.word}
                </div>

                {word.transliteration && (
                  <div className="text-3xl break-words">
                    {word.transliteration}
                  </div>
                )}

                {word.partOfSpeech && (
                  <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                    {word.partOfSpeech}
                  </div>
                )}

                <div className="py-6 border-t border-b border-border">
                  <div className="text-sm text-muted-foreground mb-2">
                    {t('daily.meaning')}
                  </div>
                  <div className="text-2xl">
                    {word.primaryMeaning}
                  </div>
                </div>

                {additionalMeanings.length > 0 && (
                  <div className="text-left max-w-2xl mx-auto">
                    <div className="text-sm text-muted-foreground mb-2">
                      Additional meanings
                    </div>
                    <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                      {additionalMeanings.map((meaning) => (
                        <li key={meaning}>{meaning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {word.hindiMeaning && (
                  <div className="text-sm text-muted-foreground">
                    Hindi: <span className="text-foreground">{word.hindiMeaning}</span>
                  </div>
                )}
              </>
            )}

            {!loading && !word && (
              <div className="text-muted-foreground text-sm">
                {error ?? 'No word available right now.'}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col items-center gap-4 mb-8 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={fetchWord}
            className="border-foreground"
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Get another word'}
          </Button>
          <span className="text-xs text-muted-foreground text-center">
            {word ? 'Selection logged in Cloudflare D1 to avoid repeats' : 'Waiting for next selection'}
          </span>
        </div>

        <div className="space-y-4">
          <h3 className="text-center text-sm text-muted-foreground">
            {t('daily.shareOn')}
          </h3>

          <div className="flex justify-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="border-foreground"
              disabled={disabledInteractions}
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="border-foreground"
              disabled={disabledInteractions}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="border-foreground"
              disabled={disabledInteractions}
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="border-foreground"
              disabled={disabledInteractions}
            >
              <Share2 className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-foreground"
              disabled={disabledInteractions}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Card
            </Button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

function normalizePayload(payload: any): DailyWord {
  const rawMeanings = extractMeaningList(payload);
  const primaryMeaning =
    payload?.primaryMeaning ??
    payload?.primary_meaning ??
    rawMeanings[0] ??
    '';

  return {
    id: payload.id,
    word: payload.sanskrit,
    transliteration: payload.transliteration,
    primaryMeaning,
    meanings: rawMeanings.length ? rawMeanings : primaryMeaning ? [primaryMeaning] : [],
    partOfSpeech: payload.partOfSpeech ?? payload.part_of_speech ?? null,
    hindiMeaning: payload.hindiMeaning ?? payload.hindi_meaning ?? null,
    tags: Array.isArray(payload.tags) ? payload.tags : []
  };
}

function extractMeaningList(payload: any): string[] {
  const candidates = [payload?.meanings, payload?.english_meanings];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(Boolean);
    }
  }
  if (typeof payload?.english_meanings === 'string') {
    return payload.english_meanings
      .split(/[,;]+/)
      .map((item: string) => item.trim())
      .filter(Boolean);
  }
  return [];
}
