import 'server-only';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { signInWithGoogleAccount, type GoogleSignInFailure } from '@/lib/auth/google-account';

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const googleProvider =
    googleClientId && googleClientSecret
        ? Google({ clientId: googleClientId, clientSecret: googleClientSecret })
        : null;

const FAILURE_REDIRECT: Record<GoogleSignInFailure, string> = {
    invalid: '/login?error=Callback',
    unverified: '/login?error=Verification',
    inactive: '/login?error=Inactive',
    signup_disabled: '/login?error=SignupDisabled',
    conflict: '/login?error=OAuthAccountNotLinked',
};

export const { handlers } = NextAuth({
    // Fall back to the app JWT secret so a missing AUTH_SECRET does not crash local setup.
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    trustHost: true,
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    providers: googleProvider ? [googleProvider] : [],
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider !== 'google') return true;
            try {
                const result = await signInWithGoogleAccount(profile, account);
                if (result === true) return true;
                return FAILURE_REDIRECT[result];
            } catch (error) {
                console.error('Google sign-in error:', error);
                return FAILURE_REDIRECT.invalid;
            }
        },
    },
});
