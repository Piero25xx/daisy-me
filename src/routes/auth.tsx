import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Account — Daisy" },
      { name: "description", content: "Sign in or create a Daisy account to track orders and save your wishlist." },
      { property: "og:title", content: "Account — Daisy" },
      { property: "og:description", content: "Sign in or create a Daisy account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setMessage("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-4xl">{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Track orders, save your wishlist and access early collection drops.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        {mode === "signup" ? (
          <div>
            <label htmlFor="name" className="label-mono mb-2 block text-muted-foreground">
              Full name
            </label>
            <input
              id="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={100}
              required
              className="w-full border-b border-input bg-transparent pb-2 text-sm outline-none focus:border-foreground"
            />
          </div>
        ) : null}
        <div>
          <label htmlFor="email" className="label-mono mb-2 block text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={255}
            required
            className="w-full border-b border-input bg-transparent pb-2 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label htmlFor="password" className="label-mono mb-2 block text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
            className="w-full border-b border-input bg-transparent pb-2 text-sm outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-foreground py-4 text-xs uppercase tracking-[0.2em] text-background disabled:opacity-50"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogle}
        className="mt-4 w-full border border-input py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Continue with Google
      </button>

      <p aria-live="polite" className="label-mono mt-6 text-center text-muted-foreground">
        {message}
      </p>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 w-full text-center text-xs text-muted-foreground underline underline-offset-4"
      >
        {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
