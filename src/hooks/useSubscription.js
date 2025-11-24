import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Custom hook to check and manage user subscription status
 */
export function useSubscription() {
  const { user, isLoaded } = useUser();
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    loading: true,
    hasSubscription: false,
    status: 'none',
    plan: null,
    error: null
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (!isLoaded) return;

      if (!user) {
        setSubscriptionStatus({
          loading: false,
          hasSubscription: false,
          status: 'none',
          plan: null,
          error: null
        });
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/subscription/status/${user.id}`
        );

        if (response.data.success) {
          setSubscriptionStatus({
            loading: false,
            hasSubscription: response.data.hasSubscription,
            status: response.data.subscription?.status || 'none',
            plan: response.data.subscription?.plan || null,
            currentPeriodEnd: response.data.subscription?.currentPeriodEnd,
            cancelAtPeriodEnd: response.data.subscription?.cancelAtPeriodEnd,
            error: null
          });
        } else {
          setSubscriptionStatus({
            loading: false,
            hasSubscription: false,
            status: 'none',
            plan: null,
            error: response.data.message
          });
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
        setSubscriptionStatus({
          loading: false,
          hasSubscription: false,
          status: 'error',
          plan: null,
          error: error.message
        });
      }
    };

    checkSubscription();
  }, [user, isLoaded]);

  const refreshSubscription = async () => {
    if (!user) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/subscription/status/${user.id}`
      );

      if (response.data.success) {
        setSubscriptionStatus({
          loading: false,
          hasSubscription: response.data.hasSubscription,
          status: response.data.subscription?.status || 'none',
          plan: response.data.subscription?.plan || null,
          currentPeriodEnd: response.data.subscription?.currentPeriodEnd,
          cancelAtPeriodEnd: response.data.subscription?.cancelAtPeriodEnd,
          error: null
        });
      }
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  };

  return {
    ...subscriptionStatus,
    refreshSubscription
  };
}

