import { NextAuthOptions } from "next-auth";
import CredentialProviders from "next-auth/providers/credentials"


export const authOptions: NextAuthOptions = {
    // Configure one or more authentication providers
    providers: [
        CredentialProviders({
            name: "Credentials"
                credentials: {
                email: { label: "Email", type: "text"},
                password: { label: "Password", type: "password" }
            },
        })
    ],
}