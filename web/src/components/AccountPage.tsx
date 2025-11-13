import { useAuth } from '../lib/auth-context';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Heart, User, Mail, ExternalLink } from 'lucide-react';
import { SEO } from './SEO';

export function AccountPage() {
  const { user, isAuthenticated } = useAuth();
  const isSupporter = localStorage.getItem('is_sanskrit_supporter') === 'true';
  const supporterSince = localStorage.getItem('supporter_since');

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-4">Please Sign In</h1>
          <p className="text-muted-foreground">
            You need to be signed in to view your account.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      <SEO
        title="My Account | संस्कृत रोज़"
        description="Manage your संस्कृत रोज़ account and subscriptions"
        url="/account"
      />

      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground rounded-full mb-4">
              <User className="h-8 w-8" />
            </div>
            <h1 className="mb-4">My Account</h1>
            <p className="text-muted-foreground">
              Manage your profile and subscriptions
            </p>
          </div>

          {/* Profile Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-12 w-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                </div>
              </div>

              {isSupporter && (
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="currentColor" />
                    <span className="font-semibold text-orange-900 dark:text-orange-100">
                      Sanskrit Supporter
                    </span>
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Thank you for supporting the revival of Sanskrit!
                    {supporterSince && ` Since ${formatDate(supporterSince)}`}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Subscription Management */}
          {isSupporter && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Subscription Management</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  If you have a recurring donation, you can manage or cancel it anytime through Stripe's customer portal.
                </p>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How to manage your subscription:</h3>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Click the button below to access Stripe's customer portal</li>
                    <li>Sign in using the email associated with your donation ({user.email})</li>
                    <li>You can view, update, or cancel your subscription anytime</li>
                  </ol>
                </div>

                <Button
                  onClick={() => window.open('https://billing.stripe.com/p/login', '_blank')}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Subscription via Stripe
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You'll be redirected to Stripe's secure portal
                </p>
              </div>
            </Card>
          )}

          {!isSupporter && (
            <Card className="p-6 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Support Sanskrit Revival</h2>
              <p className="text-muted-foreground mb-4">
                Help preserve and promote the Sanskrit language by becoming a supporter.
              </p>
              <Button
                onClick={() => window.location.href = '/donate'}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                <Heart className="mr-2 h-4 w-4" />
                Become a Supporter
              </Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
