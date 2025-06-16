import NextAuth from "next-auth"
import { Establishment } from "./Letsgo";

declare module "next-auth" {

    interface Session {
        user: {
            uid: string;
            name: string;
            email: string;
            document: string;
            type: string;
            stripeAccountId: string;
            isOwnerOfEstablishment: boolean;
            establishment: Establishment | null;
        } 
        access_token: string;
    }

    interface User {
        uid: string;
        name: string;
        email: string;
        document: string;
        type: string;
        stripeAccountId: string;
        isOwnerOfEstablishment: boolean;
        establishment: Establishment | null;
        access_token: string
    }
}