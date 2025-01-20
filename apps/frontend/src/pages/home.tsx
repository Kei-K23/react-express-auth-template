import { UserCard } from "@/components/user-card";

export default function HomePage() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-start pt-20">
      <h1 className="mb-2 text-xl">React + Express Auth Template</h1>
      <p className="mb-16 max-w-xl text-center text-muted-foreground">
        A modern, type-safe authentication system template (JWT access token and
        refresh token) built with React, Express, and TypeScript using a
        monorepo structure with pnpm workspace.
      </p>
      <UserCard />
    </div>
  );
}
