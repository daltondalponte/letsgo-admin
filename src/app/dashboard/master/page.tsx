import { getServerSession } from "next-auth";
import { authOptions } from "@lib/authOptions";
import { redirect } from "next/navigation";
import { NextAuthProvider } from "@/app/providers";

export default async function MasterPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin");
    }

    return (
        <NextAuthProvider>
            <div className="flex flex-col w-full h-full">
                <h1 className="text-2xl font-bold">Dashboard Master</h1>
                <p>Bem-vindo, {session?.user?.name}!</p>
            </div>
        </NextAuthProvider>
    );
}


