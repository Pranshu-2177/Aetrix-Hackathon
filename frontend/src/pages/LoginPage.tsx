import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth, type UserRole } from '@/hooks/use-auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const rolePath = useMemo(() => ({
    patient: '/patients',
    asha: '/asha-workers',
    admin: '/district-admin',
  }), []);

  const handleRoleSelect = async (role: UserRole) => {
    const currentRole = (user?.user_metadata?.role as UserRole | undefined) ?? null;

    if (!user) {
      navigate(`/auth?role=${role}`);
      return;
    }

    if (currentRole === role) {
      navigate(rolePath[role], { replace: true });
      return;
    }

    await signOut();
    navigate(`/auth?role=${role}`, { replace: true });
  };

  const loginOptions = [
    {
      title: 'Patients & Families',
      description: 'Get AI-driven health triage and support for you and your loved ones.',
      icon: <User className="h-8 w-8 text-teal" />,
      role: 'patient' as UserRole,
      buttonText: 'Login as Patient',
    },
    {
      title: 'ASHA Workers',
      description: 'Access tools for community health workers to triage and report cases.',
      icon: <Stethoscope className="h-8 w-8 text-teal" />,
      role: 'asha' as UserRole,
      buttonText: 'Login as ASHA Worker',
    },
    {
      title: 'District Admins',
      description: 'Monitor health trends and manage healthcare resources in your district.',
      icon: <ShieldCheck className="h-8 w-8 text-teal" />,
      role: 'admin' as UserRole,
      buttonText: 'Login as Admin',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      {/* Logo and Header */}
      <div className="mb-12 flex flex-col items-center gap-4 text-center">
        <img src="/swasthai-logo.svg" alt="SwasthAI" className="h-20 w-auto sm:h-24" />
        <div>
          <p className="mt-2 text-lg text-muted-foreground">
            Rural-first AI Health Triage & Support
          </p>
        </div>
      </div>

      {/* Role Selection */}
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {loginOptions.map((option) => (
          <Card
            key={option.role}
            className="flex flex-col border-border transition-all hover:border-teal/50 hover:shadow-teal/10"
          >
            <CardHeader className="flex flex-col items-center gap-4 pb-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
                {option.icon}
              </div>
              <CardTitle className="text-xl font-bold">{option.title}</CardTitle>
              <CardDescription className="text-center text-sm text-muted-foreground">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col p-6 pt-2">
              <Button
                onClick={() => void handleRoleSelect(option.role)}
                className="w-full rounded-full gradient-cta text-accent-foreground hover:opacity-90"
              >
                {option.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} SwasthAI. Empowering rural healthcare with AI.</p>
      </footer>
    </div>
  );
}
