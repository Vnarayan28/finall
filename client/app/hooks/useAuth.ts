'use client';

import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../components/auth-context';


export const useAuth = (redirectUrl = '/login') => {
  const { token, login, logout, getDecodedToken } = useContext(AuthContext);
  const router = useRouter();
  const getUserId = async () => {
    const decodedToken = token ? await getDecodedToken(token) : null;
    if (decodedToken && decodedToken.user) {
      return decodedToken.user.id;
    }
    return null
  };

  useEffect(() => {
    if (!token && redirectUrl) {
      router.push(redirectUrl);
    }
  }, [redirectUrl, router, token]);
  return { isAuthenticated: !!token, login, logout, getUserId };
};
