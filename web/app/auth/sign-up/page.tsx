'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useServices } from '@/contexts/ServicesContext';

export default function SignUpPage() {
  const router = useRouter();
  const { auth } = useServices();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await auth.getSession();
      if (session) {
        router.push('/');
      }
    };

    checkAuth();
  }, [auth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await auth.signUp(email, password);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2">Check your email</h3>
            <p className="mb-4">
              We sent a confirmation link to <strong>{email}</strong>
            </p>
            <p className="text-sm">
              Click the link in the email to confirm your account, then you can sign in.
            </p>
          </div>
          <div className="text-center">
            <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-700">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Create your account
        </h2>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}