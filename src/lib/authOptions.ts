import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

interface UserSession {
    uid: string;
    name: string;
    email: string;
    type: string;
    access_token: string;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                });

                const user = await res.json();

                if (res.ok && user) {
                    return user;
                } else {
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.uid = (user as UserSession).uid;
                token.name = (user as UserSession).name;
                token.email = (user as UserSession).email;
                token.type = (user as UserSession).type;
                token.access_token = (user as UserSession).access_token;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.uid = token.uid as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.type = token.type as string;
                session.access_token = token.access_token as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
        error: "/api/auth/signin/error",
    },
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
};
