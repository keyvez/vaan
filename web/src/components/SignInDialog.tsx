import { useAuth } from '../lib/auth-context';
import { Button } from './ui/button';

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  console.log('SignInDialog render', { open });
  const { login } = useAuth();

  const handleSignIn = () => {
    console.log('handleSignIn called');
    login();
    onOpenChange(false);
  };

  if (!open) {
    console.log('Dialog is closed, not rendering');
    return null;
  }

  console.log('Rendering simple dialog overlay');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          color: 'black'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          Sign in to save favorites
        </h2>
        <p style={{ marginBottom: '24px', color: '#666' }}>
          Sign in with your Google account to save your favorite baby names across devices.
        </p>
        <Button onClick={handleSignIn} className="w-full">
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
