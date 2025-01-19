import constant from "@/constant";
import api from "@/lib/axios";
import { getCookie, removeCookie, setCookie } from "@/lib/cookie";
import { UserWithoutPasswordField as User } from "@react-express-auth-template/types";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const accessToken = getCookie(constant.ACCESS_TOKEN_KEY);
      const refreshToken = getCookie(constant.REFRESH_TOKEN_KEY);

      if (accessToken && refreshToken) {
        try {
          const res = await api.get("/api/auth/getMe");
          setUser(res.data);
        } catch {
          removeCookie(constant.ACCESS_TOKEN_KEY);
          removeCookie(constant.REFRESH_TOKEN_KEY);
          setUser(null);
        }
      }
      setLoading(false);
    })();
  });

  const login = (accessToken: string, refreshToken: string, user: User) => {
    setCookie(constant.ACCESS_TOKEN_KEY, accessToken, 15);
    setCookie(constant.REFRESH_TOKEN_KEY, refreshToken, 43200);
    setUser(user);
  };

  const logout = async () => {
    const refreshToken = getCookie(constant.REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        api.post("/api/auth/logout", { refreshToken });
      } catch {
        removeCookie(constant.ACCESS_TOKEN_KEY);
        removeCookie(constant.REFRESH_TOKEN_KEY);
        setUser(null);
      }
    } else {
      removeCookie(constant.ACCESS_TOKEN_KEY);
      removeCookie(constant.REFRESH_TOKEN_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be within an AuthProvider");
  }
  return context;
}
