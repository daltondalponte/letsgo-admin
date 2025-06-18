// src/app/auth/signin/page.tsx

"use client";

import { signIn, useSession } from "next-auth/react";
import { FormEvent, useState } from "react";
import { useRouter } from "next-nprogress-bar"; // Assuming this is the correct import for your router

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState(""); // Using 'pass' as in your original code
  const [error, setError] = useState<string | null>(null);

  const { status } = useSession();

  // Redirect if already authenticated
  if (status === "authenticated") {
    router.push("/dashboard"); // Adjust this to your desired dashboard path
  }

  if (status === "loading") return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      const result = await signIn("credentials", {
        redirect: false, // Do not redirect automatically
        email,
        password: pass, // Use 'pass' as in your original code
      });

      if (result?.error) {
        setError(result.error); // Set error message from NextAuth
      } else if (result?.ok) {
        // Manual redirection after successful login
        // The logic for 'Profissional' and 'Master' users should be handled here
        // based on the 'type' returned in the session/user object after successful login.
        // For now, redirect to dashboard as a generic success.
        router.push("/dashboard"); // Example: redirect to dashboard
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Ocorreu um erro desconhecido.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white">
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6" action="#" method="POST">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">Password</label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  required
                  className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              </div>
            </div>

            <div>
              <button type="submit" className="flex w-full justify-center rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-amber-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Entrar</button>
            </div>
          </form>
          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        </div>
      </div>
    </main>
  );
}


