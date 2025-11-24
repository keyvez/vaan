import { ReactNode, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useAdmin } from '../lib/admin-context';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  // Check if admin mode is activated via query param
  const adminNode = searchParams.get('node');
  const isAdminMode = adminNode === 'raton-noir-189843';

  useEffect(() => {
    // Wait for both auth and admin checks to complete
    if (authLoading || adminLoading) return;

    // If not in admin mode, redirect to home
    if (!isAdminMode) {
      navigate('/');
      return;
    }

    // If not authenticated, user needs to log in
    if (!isAuthenticated || !user) {
      // Show loading or login prompt - for now redirect to home
      navigate('/?admin=login');
      return;
    }

    // If authenticated but not admin, show unauthorized
    if (!isAdmin) {
      navigate('/?admin=unauthorized');
      return;
    }
  }, [isAuthenticated, isAdmin, isAdminMode, authLoading, adminLoading, navigate, user]);

  // Show loading state
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthenticated || !isAdmin || !isAdminMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the admin panel.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
