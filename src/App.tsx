import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "./router/AppRouter";
import { ToastContainer } from "./components/ui/ToastContainer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <ToastContainer />
    </QueryClientProvider>
  );
}
