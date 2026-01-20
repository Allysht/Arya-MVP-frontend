import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';

/**
 * Protected Route that requires both authentication AND active subscription
 * Redirects to /auth if not logged in, /pricing if no subscription
 */
function SubscriptionProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: subLoading, hasSubscription } = useSubscription();
  const location = useLocation();

  // Show loading while checking auth or subscription status
  if (authLoading || subLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Logged in but no subscription - redirect to pricing
  if (!hasSubscription) {
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  // Has both auth and subscription - render children
  return children;
}

export default SubscriptionProtectedRoute;
