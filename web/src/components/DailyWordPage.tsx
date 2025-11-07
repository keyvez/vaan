import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Calendar, Share2, Download, Facebook, Twitter, Linkedin } from 'lucide-react';
import { dailySanskritWords } from '../lib/sanskrit-data';

export function DailyWordPage() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const word = dailySanskritWords[currentIndex];

  const handleShare = async (platform: string) => {
    const shareUrl = `https://vaan.pages.dev/daily-word`;
    const shareText = `Today's Sanskrit Word: ${word.transliteration} (${word.meaning})`;

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

  const handleDownload = () => {
    // Create a canvas to draw the card
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1080, 1080);

    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1000, 1000);

    // Draw Sanskrit word
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 120px serif';
    ctx.textAlign = 'center';
    ctx.fillText(word.word, 540, 300);

    // Draw transliteration
    ctx.font = '60px serif';
    ctx.fillText(word.transliteration, 540, 400);

    // Draw pronunciation
    ctx.font = 'italic 40px serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(`(${word.pronunciation})`, 540, 480);

    // Draw meaning
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 50px serif';
    ctx.fillText(word.meaning, 540, 600);

    // Draw story (multi-line)
    ctx.font = '32px serif';
    ctx.fillStyle = '#333333';
    const words = word.story.split(' ');
    let line = '';
    let y = 720;
    const maxWidth = 900;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, 540, y);
        line = words[i] + ' ';
        y += 45;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 540, y);

    // Draw footer
    ctx.font = '30px serif';
    ctx.fillStyle = '#999999';
    ctx.fillText('vaan.pages.dev', 540, 1000);

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sanskrit-word-${word.transliteration}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
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

        {/* Word Card */}
        <Card ref={cardRef} className="p-12 mb-8 border-2 border-foreground">
          <div className="text-center space-y-6">
            <div className="text-6xl md:text-7xl mb-4">
              {word.word}
            </div>
            
            <div className="text-3xl">
              {word.transliteration}
            </div>
            
            <div className="text-xl italic text-muted-foreground">
              ({word.pronunciation})
            </div>
            
            <div className="py-6 border-t border-b border-border">
              <div className="text-sm text-muted-foreground mb-2">
                {t('daily.meaning')}
              </div>
              <div className="text-2xl">
                {word.meaning}
              </div>
            </div>
            
            <div className="text-left max-w-2xl mx-auto">
              <div className="text-sm text-muted-foreground mb-2">
                {t('daily.story')}
              </div>
              <p className="text-muted-foreground">
                {word.story}
              </p>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="border-foreground"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {currentIndex + 1} / {dailySanskritWords.length}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((prev) => Math.min(dailySanskritWords.length - 1, prev + 1))}
            disabled={currentIndex === dailySanskritWords.length - 1}
            className="border-foreground"
          >
            Next
          </Button>
        </div>

        {/* Share Options */}
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
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="border-foreground"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="border-foreground"
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="border-foreground"
            >
              <Share2 className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-foreground"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('daily.download')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
