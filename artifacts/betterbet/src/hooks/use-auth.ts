import { useState, useEffect } from "react";
import type { User } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthState {
  user: User | null;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedUser = localStorage.getItem("betterbet_user");
    const storedToken = localStorage.getItem("betterbet_token");
    
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: storedToken || null,
    };
  });

  useEffect(() => {
    setAuthTokenGetter(() => authState.token);
  }, [authState.token]);

  const login = (user: User, token: string) => {
    localStorage.setItem("betterbet_user", JSON.stringify(user));
    localStorage.setItem("betterbet_token", token);
    setAuthState({ user, token });
  };

  const logout = () => {
    localStorage.removeItem("betterbet_user");
    localStorage.removeItem("betterbet_token");
    setAuthState({ user: null, token: null });
  };

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.token && !!authState.user,
  };
}
