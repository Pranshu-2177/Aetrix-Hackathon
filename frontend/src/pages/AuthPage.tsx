import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useAuth, type UserRole } from '@/hooks/use-auth';
import { fetchProfile, upsertProfile } from '@/lib/dashboardService';

const ROLE_TITLES: Record<UserRole, string> = {
  patient: 'Patients & Families',
  asha: 'ASHA Workers',
  admin: 'District Health Leads',
};

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, setRole, signOut, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ error?: string; info?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const role = (searchParams.get('role') as UserRole | null) ?? null;
  const rolePath = useMemo(() => ({
    patient: '/patients',
    asha: '/asha-workers',
    admin: '/district-admin',
  }), []);

  const syncProfileRecord = async (currentUser: User, currentRole: UserRole) => {
    try {
      const existing = await fetchProfile(currentUser.id);
      if (existing) {
        if (existing.email === (currentUser.email ?? null) && existing.role === currentRole) {
          return null;
        }

        await upsertProfile({
          ...existing,
          email: currentUser.email ?? existing.email,
          role: currentRole,
        });
        return null;
      }

      await upsertProfile({
        id: currentUser.id,
        email: currentUser.email ?? null,
        role: currentRole,
        full_name: null,
        phone: null,
        village: null,
        block: null,
        district: null,
        households_covered: null,
      });
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not prepare your dashboard profile.';
      if (message.toLowerCase().includes('profiles')) {
        return 'Supabase profiles table is missing. Run the SQL file in supabase/migrations/002_create_profiles_and_case_reports.sql.';
      }
      return message;
    }
  };

  useEffect(() => {
    if (!role) {
      navigate('/', { replace: true });
      return;
    }
    if (!loading && user && !submitting) {
      const userRole = (user.user_metadata?.role as UserRole | undefined) ?? role;
      navigate(rolePath[userRole], { replace: true });
    }
  }, [role, user, loading, navigate, rolePath, submitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) {
      setStatus({ error: 'Please select a role first.' });
      return;
    }
    if (!isConfigured) {
      setStatus({ error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' });
      return;
    }
    setSubmitting(true);
    setStatus({});

    if (mode === 'signin') {
      const result = await signIn(email.trim(), password);
      if (result.error) {
        setStatus({ error: result.error });
      } else {
        const { data } = await supabase!.auth.getUser();
        const signedInUser = data.user;
        const existingRole = signedInUser?.user_metadata?.role as UserRole | undefined;
        if (existingRole && existingRole !== role) {
          await signOut();
          setStatus({ error: `This account is registered as ${ROLE_TITLES[existingRole]}. Please use that login.` });
        } else if (!existingRole) {
          const roleResult = await setRole(role);
          if (roleResult.error) {
            setStatus({ error: roleResult.error });
          } else {
            const profileError = signedInUser ? await syncProfileRecord(signedInUser, role) : null;
            if (profileError) {
              setStatus({ error: profileError });
            } else {
              navigate(rolePath[role], { replace: true });
            }
          }
        } else {
          const profileError = signedInUser ? await syncProfileRecord(signedInUser, existingRole) : null;
          if (profileError) {
            setStatus({ error: profileError });
          } else {
            navigate(rolePath[existingRole], { replace: true });
          }
        }
      }
    } else {
      const result = await signUp(email.trim(), password, role);
      if (result.error) {
        setStatus({ error: result.error });
      } else if (result.needsEmailConfirmation) {
        setStatus({ error: 'This Supabase project still requires email confirmation before login. Turn off Confirm email in Supabase Authentication > Providers > Email.' });
      } else {
        const { data } = await supabase!.auth.getSession();
        if (data.session?.user) {
          const roleResult = await setRole(role);
          if (roleResult.error) {
            setStatus({ error: roleResult.error });
          } else {
            const profileError = await syncProfileRecord(data.session.user, role);
            if (profileError) {
              setStatus({ error: profileError });
            } else {
              navigate(rolePath[role], { replace: true });
            }
          }
        } else {
          setStatus({ info: 'Account created. You can sign in now.' });
        }
      }
    }

    setSubmitting(false);
  };

  if (!role) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-cta shadow-teal">
          <Shield className="h-8 w-8 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Swasth<span className="text-teal">AI</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Secure sign in for {ROLE_TITLES[role]}</p>
        </div>
      </div>

      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-teal/5">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected role</p>
            <p className="text-lg font-semibold text-foreground">{ROLE_TITLES[role]}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'signin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('signin')}
            >
              Sign in
            </Button>
            <Button
              type="button"
              variant={mode === 'signup' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('signup')}
            >
              Create account
            </Button>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {status.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {status.error}
            </div>
          )}
          {status.info && (
            <div className="rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal-700">
              {status.info}
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-full gradient-cta text-accent-foreground hover:opacity-90"
            disabled={submitting}
          >
            {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => navigate('/')}
        >
          Back to role selection
        </Button>
      </div>
    </div>
  );
}
