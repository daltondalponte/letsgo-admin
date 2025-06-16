import { ListEvents } from "@/components/Event";
import { authOptions } from "@/lib/authOptions";
import { Event } from "@/types/Letsgo";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Index() {

    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    const url = session?.user.type === "PROFESSIONAL" && session?.user.isOwnerOfEstablishment ? `${process.env.API_URL}/event/find-many-by-user/${session.user.establishment?.id}` :
        `${process.env.API_URL}/events-manager/find-many-by-user`

    let events = await fetch(url, {
        cache: 'no-store',
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${session?.access_token}`
        }
    })
        .then(res => res.json())
        .then(res => res?.events ?? res as Event[])
        .catch(error => {
            console.error(error)
            return [] as Event[]
        })

    return (
        <main className="flex w-screen h-full overflow-auto flex-col items-center justify-start p-24 bg-white">
            <ListEvents events={events} />
        </main>
    )
}