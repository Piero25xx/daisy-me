import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/catalog.functions";

export function Footer() {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await subscribe({ data: { email } });
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="grid grid-cols-1 items-start gap-12 border-t border-border bg-background px-6 py-24 md:grid-cols-3">
      <div>
        <h2 className="mb-6 font-display text-2xl italic">Stay in the fold.</h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Receive exclusive early access to seasonal drops and editorial insights.
        </p>
        <form onSubmit={handleSubmit} className="flex border-b border-foreground/20 pb-2">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            maxLength={255}
            className="w-full border-none bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="label-mono px-2 tracking-tighter">
            {status === "sending" ? "…" : "Join"}
          </button>
        </form>
        <p aria-live="polite" className="label-mono mt-3 text-muted-foreground">
          {status === "done" && "You're on the list."}
          {status === "error" && "Enter a valid email address."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 label-mono text-muted-foreground">
        <div className="flex flex-col gap-4">
          <Link to="/collections/$slug" params={{ slug: "women" }} className="hover:text-foreground">
            Women
          </Link>
          <Link to="/collections/$slug" params={{ slug: "men" }} className="hover:text-foreground">
            Men
          </Link>
          <Link to="/collections/$slug" params={{ slug: "objects" }} className="hover:text-foreground">
            Objects
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          <Link to="/vibe-check" className="hover:text-foreground">
            Vibe Check
          </Link>
          <Link to="/fitting-room" className="hover:text-foreground">
            Fitting Room
          </Link>
        </div>
      </div>

      <div className="md:text-right">
        <div className="select-none font-display text-6xl opacity-5">Daisy</div>
        <p className="label-mono mt-4 text-muted-foreground">© 2026 Daisy Studio. All rights reserved.</p>
      </div>
    </footer>
  );
}
