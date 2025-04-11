'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      router.push('/auth/login?registered=true');
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
        </div>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-[#333333] bg-[#121212] placeholder-gray-400 text-white focus:outline-none focus:ring-[#E3CF20] focus:border-[#E3CF20] focus:z-10 sm:text-sm h-10"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-[#333333] bg-[#121212] placeholder-gray-400 text-white focus:outline-none focus:ring-[#E3CF20] focus:border-[#E3CF20] focus:z-10 sm:text-sm h-10"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-[#333333] bg-[#121212] placeholder-gray-400 text-white focus:outline-none focus:ring-[#E3CF20] focus:border-[#E3CF20] focus:z-10 sm:text-sm h-10"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-[#121212] bg-[#E3CF20] hover:bg-[#d4c01c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E3CF20] disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className="text-sm text-center">
          Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-[#E3CF20] hover:text-[#d4c01c]"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
