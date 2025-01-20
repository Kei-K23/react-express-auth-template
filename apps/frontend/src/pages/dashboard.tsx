import { useAuth } from "@/context/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      Dashboard
      <div>
        {user?.username} <br /> {user?.email}
      </div>
    </div>
  );
}
