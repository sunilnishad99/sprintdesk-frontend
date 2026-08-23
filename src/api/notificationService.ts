import axios from 'axios';
import mockData from '../data/mock-data.json';
import type { AppNotification } from '../types/notification';

// Separate, unauthenticated axios instance — JSONPlaceholder is a public
// mock API unrelated to our DummyJSON auth session, so it must NOT go
// through httpClient's Bearer-token interceptor.
const publicClient = axios.create({ baseURL: 'https://jsonplaceholder.typicode.com' });

interface JsonPlaceholderPost {
  id: number;
  title: string;
  body: string;
}

export const notificationService = {
  // Seed notifications shipped with the mock dataset (Task 04.4: "initial
  // notification data" comes from mock-data.json)
  getInitialNotifications: (): AppNotification[] =>
    mockData.notifications.map((n) => ({
      id: `initial-${n.id}`,
      title: n.title,
      message: n.message,
      type: n.type as AppNotification['type'],
      read: n.read,
      createdAt: n.createdAt,
    })),

  // Polled every interval; new post IDs are treated as new notifications
  fetchLatestPosts: async (): Promise<JsonPlaceholderPost[]> => {
    const { data } = await publicClient.get<JsonPlaceholderPost[]>('/posts', {
      params: { _limit: 5 },
    });
    return data;
  },
};