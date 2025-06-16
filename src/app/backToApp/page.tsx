"use client"


export default async function Dashboard() {

    //This route is a helper for native app go to back with deep-link
    return (
        <main className="flex w-full min-h-screen flex-col bg-white items-center justify-center">
            <a href="letsgoapp://">Voltar para o APP</a>
        </main>
    )
}