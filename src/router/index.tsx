import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { AuthPage, ProtectedRoute } from '@/components';
import { 
  Home, 
  Dashboard, 
  ChatPage, 
  MyMindOpPage, 
  SearchPage, 
  NotificationsPage, 
  ProfilePage, 
  NotFound 
} from '@/pages';
import MindopServiceTestPage from '@/pages/MindopServiceTestPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'auth',
        element: (
          <ProtectedRoute requireAuth={false}>
            <AuthPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <ProtectedRoute requireAuth={false}>
            <AuthPage defaultMode="login" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <ProtectedRoute requireAuth={false}>
            <AuthPage defaultMode="signup" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mindop',
        element: (
          <ProtectedRoute>
            <MyMindOpPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'search',
        element: (
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mindop-test',
        element: (
          <ProtectedRoute>
            <MindopServiceTestPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
