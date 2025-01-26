import constant from "@/constant";
import api from "@/lib/axios";
import { UserWithoutPasswordField as User } from "@react-express-auth-template/types";
import Cookies from "js-cookie";
import { createContext, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);

  // Fetch the user details if a refresh token is present
  const { isLoading } = useQuery<User>(
    ["authUser"],
    async () => {
      const refreshToken = Cookies.get(constant.REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error("No refresh token found");

      const res = await api.get("/api/auth/getMe");
      setUser(res.data);
      return res.data;
    },
    {
      retry: false,
      onError: () => {
        Cookies.remove(constant.ACCESS_TOKEN_KEY);
        Cookies.remove(constant.REFRESH_TOKEN_KEY);
        setUser(null);
      },
    }
  );

  const login = (accessToken: string, refreshToken: string, user: User) => {
    Cookies.set(constant.ACCESS_TOKEN_KEY, accessToken, {
      expires: constant.ACCESS_TOKEN_EXPIRE,
    });
    Cookies.set(constant.REFRESH_TOKEN_KEY, refreshToken, {
      expires: constant.REFRESH_TOKEN_EXPIRE,
    });
    setUser(user);
    queryClient.setQueryData(["authUser"], user);
  };

  const logoutMutation = useMutation(
    async () => {
      const refreshToken = Cookies.get(constant.REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await api.post("/api/auth/logout", { refreshToken });
      }
      Cookies.remove(constant.ACCESS_TOKEN_KEY);
      Cookies.remove(constant.REFRESH_TOKEN_KEY);
    },
    {
      onSuccess: () => {
        setUser(null);
        queryClient.removeQueries({ queryKey: ["authUser"] });
      },
      onError: () => {
        setUser(null);
        queryClient.removeQueries(["authUser"]);
      },
    }
  );

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
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
