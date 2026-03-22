import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/hooks/use-auth';

const ROLE_PATH: Record<UserRole, string> = {
  patient: '/patients',
  asha: '/asha-workers',
  admin: '/district-admin',
};

export default function RequireAuth({
  children,
  allow,
}: {
  children: JSX.Element;
  allow?: UserRole[];
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking your login...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const role = (user.user_metadata?.role as UserRole | undefined) ?? 'patient';
  if (allow && !allow.includes(role)) {
    return <Navigate to={ROLE_PATH[role]} replace />;
  }

  return children;
}

