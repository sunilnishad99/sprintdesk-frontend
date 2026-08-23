import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../features/auth/useAuth';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  // Prevent authenticated users from seeing /login
  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string })?.from ?? '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { username, password },
      { onSuccess: () => navigate('/dashboard', { replace: true }) },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Sign in to SprintDesk</h1>
        <p className="mb-6 text-sm text-gray-500">
          Use a DummyJSON test account, e.g. <code>emilys</code> / <code>emilyspass</code>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {login.isError && (
            <p role="alert" className="text-sm text-red-600">
              Invalid username or password. Please try again.
            </p>
          )}

          <Button type="submit" isLoading={login.isPending} className="mt-2 w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
