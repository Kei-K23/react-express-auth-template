import { useAuth } from "@/context/auth";
import { Loader } from "lucide-react";
import { Navigate, useLocation } from "react-router";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protect route from unauthorized user
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center">
        <Loader className="animate-spin size-10 text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={"/login"} state={{ from: location }} replace />;
  }

  if (user) {
    if (location.pathname === "/login" || location.pathname === "/register") {
      return <Navigate to={"/"} state={{ from: location }} replace />;
    } else {
      // Protected routes
      return <>{children}</>;
    }
  }
}
