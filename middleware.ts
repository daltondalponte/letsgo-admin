export { default } from "next-auth/middleware"

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - auth/signin (Auth page)
         * - api/auth (API auth)
         * - images
         */
        '/((?!auth/|backToApp/|api/auth|img|app/:v*/:path*).*)'
    ],
}