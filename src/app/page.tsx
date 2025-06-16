"use client"
import { useSession, signIn } from "next-auth/react"
import { FormEvent, useState } from "react"
import { redirect } from "next/navigation";
import { useRouter } from "next-nprogress-bar";

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")

  const { status } = useSession();

  if (status === "authenticated") {
    router.push('/dashboard')
  }

  if (status === "loading") return null


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const u = await signIn("username-login", {
        redirect: false,
        email,
        password: pass,
      })

      if (u?.url) {
        router.push("/dashboard")
      } else {
        alert("Credenciais inválidas")
      }

    } catch (e) {
      console.log(e);

    }
  }

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
                {/* <div className="text-sm">
                  <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</a>
                </div> */}
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

        </div>
      </div>
    </main >
  )
}
