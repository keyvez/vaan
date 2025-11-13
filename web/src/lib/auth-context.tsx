import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

console.log('Google Client ID loaded:', GOOGLE_CLIENT_ID ? 'Yes' : 'No', GOOGLE_CLIENT_ID);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('vaan_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('vaan_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          const userData: User = {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          };

          setUser(userData);
          localStorage.setItem('vaan_user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vaan_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Client ID not configured. Authentication will not work.');
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isAuthenticated: false,
          login: () => console.error('Google Client ID not configured'),
          logout: () => {},
          isLoading: false,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
