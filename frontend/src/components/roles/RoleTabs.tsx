import { Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function RoleTabs() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl gradient-cta"
            onClick={() => navigate('/')}
          >
            <Shield className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">SwasthAI</p>
            <p className="text-xs text-muted-foreground">Rural-first AI Health Triage</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="rounded-full text-muted-foreground transition hover:bg-teal/10 hover:text-teal"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
