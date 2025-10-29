'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '@/contexts/ServicesContext';
import type { UserProfile, Subscription } from '@audiolearn/shared';

export default function ProfilePage() {
  const router = useRouter();
  const { auth, user: userService, subscription: subscriptionService } = useServices();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { session } = await auth.getSession();
      if (!session) {
        router.push('/auth/sign-in');
        return;
      }

      try {
        const [profileData, subscriptionData] = await Promise.all([
          userService.getUserProfile(),
          subscriptionService.getCurrentSubscription().catch(() => null),
        ]);

        setProfile(profileData);
        setSubscription(subscriptionData);
      } catch (err) {
        setError('failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [auth, userService, subscriptionService, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error || 'failed to load profile'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="max-w-2xl space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{profile.email}</span>
            </div>
            <div>
              <span className="text-gray-600">User ID:</span>
              <span className="ml-2 font-mono text-sm">{profile.user_id}</span>
            </div>
          </div>
        </div>

        {/* Plan Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Current Plan</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Plan:</span>
              <span className={`ml-2 font-bold ${profile.plan === 'premium' ? 'text-blue-600' : 'text-gray-600'}`}>
                {profile.plan.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Paragraph translations today:</span>
              <span className="ml-2 font-medium">
                {profile.usage.used} / {profile.usage.limit === -1 ? '∞' : profile.usage.limit}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        {subscription && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Subscription Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 font-medium ${
                  subscription.status === 'active' ? 'text-green-600' :
                  subscription.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {subscription.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Start Date:</span>
                <span className="ml-2">{new Date(subscription.startDate).toLocaleDateString()}</span>
              </div>
              {subscription.endDate && (
                <div>
                  <span className="text-gray-600">End Date:</span>
                  <span className="ml-2">{new Date(subscription.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Home
          </button>
          {profile.plan === 'free' && (
            <button
              onClick={() => router.push('/plans')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
}