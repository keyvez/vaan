import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Heart, Lock, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';

const CHECKOUT_API = import.meta.env.VITE_CHECKOUT_API_ENDPOINT?.trim() ||
  'https://vaan-wordlist.keyvez.workers.dev/api/create-checkout-session';

export function DonatePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>('one-time');
  const [amount, setAmount] = useState('25');
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if test mode is enabled via URL parameter
  const searchParams = new URLSearchParams(window.location.search);
  const isTestMode = searchParams.has('test') || searchParams.has('sandbox');
  const isSuccess = searchParams.has('success');
  const isCanceled = searchParams.has('canceled');

  const presetAmounts = ['10', '25', '50', '100'];

  // Mark user as supporter when donation is successful
  useEffect(() => {
    if (isSuccess && isAuthenticated) {
      localStorage.setItem('is_sanskrit_supporter', 'true');
      localStorage.setItem('supporter_since', new Date().toISOString());
    }
  }, [isSuccess, isAuthenticated]);

  const handleDonate = async () => {
    const finalAmount = customAmount || amount;
    const amountInCents = parseFloat(finalAmount) * 100;

    if (!amountInCents || amountInCents < 100) {
      toast.error('Please enter a valid amount ($1 minimum)');
      return;
    }

    setLoading(true);

    try {
      // Create Stripe Checkout session
      const response = await fetch(CHECKOUT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
          type: donationType,
          testMode: isTestMode,
          successUrl: `${window.location.origin}/donate?success=true${isTestMode ? '&test=true' : ''}`,
          cancelUrl: `${window.location.origin}/donate?canceled=true${isTestMode ? '&test=true' : ''}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Failed to process donation. Please try again.');
      setLoading(false);
    }
  };

  // Show thank you message if donation was successful
  if (isSuccess) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-green-600 dark:border-green-400 rounded-full mb-6">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Thank You for Your Support!</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your generous contribution helps preserve and promote the Sanskrit language for future generations.
            </p>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-3">You're Now a Sanskrit Supporter! 🙏</h2>
              <p className="text-sm text-muted-foreground">
                Your contribution directly supports:
              </p>
              <ul className="text-left mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Daily Sanskrit word creation and curation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Development of new learning tools and exercises</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>AI companion improvements for better learning</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Keeping संस्कृत रोज़ free for learners worldwide</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
                size="lg"
              >
                Continue Learning
              </Button>
              <Button
                onClick={() => window.location.href = '/donate'}
                variant="outline"
                className="w-full border-foreground"
              >
                Make Another Donation
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="mb-4">{t('donate.title')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('donate.subtitle')}
          </p>
          {isTestMode && (
            <div className="mt-4 inline-block px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-sm font-medium">
              Test Mode Active - Use card: 4242 4242 4242 4242
            </div>
          )}
          {isCanceled && (
            <div className="mt-4 inline-block px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-sm font-medium">
              Donation canceled. No worries - you can try again anytime!
            </div>
          )}
        </div>

        <Card className="p-8 mb-8">
          {/* Donation Type */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant={donationType === 'one-time' ? 'default' : 'outline'}
              onClick={() => setDonationType('one-time')}
              className={donationType === 'one-time' ? 'bg-foreground text-background' : 'border-foreground'}
            >
              {t('donate.oneTime')}
            </Button>
            <Button
              variant={donationType === 'monthly' ? 'default' : 'outline'}
              onClick={() => setDonationType('monthly')}
              className={donationType === 'monthly' ? 'bg-foreground text-background' : 'border-foreground'}
            >
              {t('donate.monthly')}
            </Button>
          </div>

          {/* Preset Amounts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {presetAmounts.map((preset) => (
              <Button
                key={preset}
                variant={amount === preset && !customAmount ? 'default' : 'outline'}
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount('');
                }}
                className={amount === preset && !customAmount ? 'bg-foreground text-background' : 'border-foreground'}
              >
                ${preset}
              </Button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mb-8">
            <label className="block text-sm mb-2">{t('donate.custom')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount('');
                }}
                placeholder="Enter amount"
                className="pl-8 border-border"
              />
            </div>
          </div>

          {/* Donate Button */}
          <Button
            onClick={handleDonate}
            disabled={!amount && !customAmount || loading}
            className="w-full bg-foreground text-background hover:bg-foreground/90"
            size="lg"
          >
            <Heart className="mr-2 h-5 w-5" />
            {loading ? 'Processing...' : `${t('donate.button')} $${customAmount || amount}${donationType === 'monthly' ? '/month' : ''}`}
          </Button>

          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>{t('donate.secure')}</span>
          </div>
        </Card>

        {/* Impact Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl mb-2">$10</div>
            <p className="text-sm text-muted-foreground">
              Supports daily word creation for one month
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl mb-2">$25</div>
            <p className="text-sm text-muted-foreground">
              Helps develop new learning exercises
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl mb-2">$50</div>
            <p className="text-sm text-muted-foreground">
              Funds AI companion improvements
            </p>
          </Card>
        </div>

        {/* Why Donate */}
        <div className="border border-border rounded-lg p-8">
          <h2 className="mb-6 text-center">Why Your Support Matters</h2>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <Check className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h4 className="mb-1">Preserve Ancient Knowledge</h4>
                <p className="text-sm text-muted-foreground">
                  Sanskrit contains thousands of years of wisdom in philosophy, science, and literature that must be preserved for future generations.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h4 className="mb-1">Make Learning Accessible</h4>
                <p className="text-sm text-muted-foreground">
                  Your donations help us keep संस्कृत रोज़ free and accessible to learners worldwide, regardless of their financial situation.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h4 className="mb-1">Support Innovation</h4>
                <p className="text-sm text-muted-foreground">
                  We're building cutting-edge AI tools to make Sanskrit learning more engaging and effective than ever before.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Check className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h4 className="mb-1">Build Community</h4>
                <p className="text-sm text-muted-foreground">
                  Your support helps us create a vibrant community of Sanskrit enthusiasts and scholars around the world.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
