import { useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/auth";
import { UserEditDialog } from "./user-edit-dialog";

export function UserCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const logoutHandler = async () => {
    logout();
    navigate("/");
  };

  return (
    <Card className="max-w-[350px]">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user?.username}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex justify-between gap-x-3">
        <UserEditDialog />
        <Button variant="destructive" onClick={logoutHandler}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </CardFooter>
    </Card>
  );
}
