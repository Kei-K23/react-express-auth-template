import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation, Link } from "react-router";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/auth";
import { LoginInput } from "@react-express-auth-template/types";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email().trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .max(18, "Password should not exceed 18 characters"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: LoginInput) =>
      api.post("/api/auth/login", data).then((res) => res.data),
    onSuccess: (data) => {
      auth.login(data.accessToken, data.refreshToken, data.user);
      const from = location.state?.from?.pathname || "/";
      navigate(from);
      toast.success("Login successful");
    },
  });

  function onSubmit(data: LoginInput) {
    mutation.mutate(data);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-sm">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold">Sign in to your account</h2>
          <p className="text-muted-foreground">Enter your credentials below</p>
        </div>
        {mutation.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {mutation.error instanceof Error
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (mutation.error as any)?.response?.data?.message
                  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (mutation.error as any)?.response?.data?.message
                  : mutation.error.message
                : "An error occurred"}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>

        <div className="text-sm text-center">
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
