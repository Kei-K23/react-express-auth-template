import constant from "@/constant";
import api from "@/lib/axios";
import { UserWithoutPasswordField as User } from "@react-express-auth-template/types";
import Cookies from "js-cookie";
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
      const refreshToken = Cookies.get(constant.REFRESH_TOKEN_KEY);

      if (refreshToken) {
        try {
          const res = await api.get("/api/auth/getMe");
          setUser(res.data);
        } catch {
          Cookies.remove(constant.ACCESS_TOKEN_KEY);
          Cookies.remove(constant.REFRESH_TOKEN_KEY);
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = (accessToken: string, refreshToken: string, user: User) => {
    Cookies.set(constant.ACCESS_TOKEN_KEY, accessToken, {
      expires: constant.ACCESS_TOKEN_EXPIRE,
    });
    Cookies.set(constant.REFRESH_TOKEN_KEY, refreshToken, {
      expires: constant.REFRESH_TOKEN_EXPIRE,
    });
    setUser(user);
  };

  const logout = async () => {
    const refreshToken = Cookies.get(constant.REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        api.post("/api/auth/logout", { refreshToken });
      } catch {
        Cookies.remove(constant.ACCESS_TOKEN_KEY);
        Cookies.remove(constant.REFRESH_TOKEN_KEY);
        setUser(null);
      }
    } else {
      Cookies.remove(constant.ACCESS_TOKEN_KEY);
      Cookies.remove(constant.REFRESH_TOKEN_KEY);
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
