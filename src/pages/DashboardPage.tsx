import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Welcome{user ? `, ${user.firstName}` : ''} 👋
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Dashboard overview will live here (sprint summary widgets).
      </p>
    </div>
  );
}
