import Table from "@/components/Table";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function Dashboard() {

    const session = await getServerSession(authOptions);

    let users = await fetch(`${process.env.API_URL}/user/find/professionals`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${session?.access_token}`
        }
    }).then(res => res.json()).then(users => users)


    if (!session) {
        redirect("/");
    }

    return (
        <main className="flex w-full flex-col items-center justify-start p-24 bg-white">
            <Table data={users} />
        </main>
    )
}