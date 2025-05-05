import { useAuthContext } from '..//components/auth-context';

const useAuth = () => {
  const { token, login, logout, getDecodedToken } = useAuthContext();

  const getUserId = () => {
    if (!token) return null;
    const decoded = getDecodedToken(token);
    return decoded?.sub || null;
  };

  return { token, login, logout, getUserId };
};

export default useAuth;
