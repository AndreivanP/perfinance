import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../api/auth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children?: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = Boolean(getAuthToken());
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
