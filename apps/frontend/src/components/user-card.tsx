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
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/context/auth";
import { UserEditDialog } from "./user-edit-dialog";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import useConfirmDialog from "@/hooks/use-confirm-dialog";
import { toast } from "sonner";

export function UserCard() {
  const [ConfirmDialog, confirm] = useConfirmDialog(
    "Are you sure?",
    "This process cannot be undo."
  );
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/api/auth/deleteMe");
    },
    onSuccess: () => {
      logout();
      navigate("/login");
      toast.success("User account deleted successful");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const logoutHandler = async () => {
    logout();
    navigate("/login");
    toast.success("Logout successful");
  };

  return (
    <>
      <ConfirmDialog />
      <Card className="max-w-[400px]">
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
          <UserEditDialog disabled={deleteMutation.isPending} />
          <Button
            disabled={deleteMutation.isPending}
            variant="destructive"
            onClick={async () => {
              const ok = await confirm();
              if (!ok) {
                return;
              }
              deleteMutation.mutate();
            }}
          >
            <User className="h-4 w-4" />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            variant="destructive"
            onClick={logoutHandler}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
