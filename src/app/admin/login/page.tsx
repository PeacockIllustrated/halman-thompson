"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ht-dark">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-8 backdrop-blur-md"
      >
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold tracking-wide text-white">
            HT Admin
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Enter your password to continue
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-white/30 outline-none transition-colors focus:border-ht-gold/50 focus:ring-1 focus:ring-ht-gold/30"
        />

        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-xl bg-ht-gold px-4 py-3 font-medium text-white shadow-lg shadow-ht-gold/20 transition-all hover:bg-ht-gold/90 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
