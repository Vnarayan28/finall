'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthCookie } from '../lib/cookies';

export const useAuth = (redirectUrl = '/login') => {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthCookie();
    if (!token && redirectUrl) {
      router.push(redirectUrl);
    }
  }, [router, redirectUrl]);

  return { isAuthenticated: !!getAuthCookie() };
};