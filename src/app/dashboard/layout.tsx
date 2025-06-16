import { getServerSession } from "next-auth";
import { authOptions } from "@lib/authOptions";
import { redirect } from "next/navigation";
import DashboardClientLayout from "./DashboardClientLayout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    return (
        <DashboardClientLayout session={session}>
            {children}
        </DashboardClientLayout>
    );
}


