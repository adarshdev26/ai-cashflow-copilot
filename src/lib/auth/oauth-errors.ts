const GOOGLE_OAUTH_ERRORS: Record<string, string> = {
    Configuration: 'Google sign-in is not configured.',
    AccessDenied: 'Google sign-in was denied.',
    Verification: 'Google did not confirm this email address.',
    OAuthSignin: 'Could not start Google sign-in. Try again.',
    OAuthCallback: 'Google sign-in could not be completed. Try again.',
    OAuthCreateAccount: 'Could not create an account from Google. Try again.',
    OAuthAccountNotLinked: 'This email is already linked to a different Google account.',
    Callback: 'Google sign-in could not be completed. Try again.',
    SignupDisabled: 'New account signups are currently disabled.',
    Inactive: 'Your account has been deactivated. Please contact support.',
    Default: 'Google sign-in failed. Try again.',
};

export function googleOAuthErrorMessage(code: string): string {
    return GOOGLE_OAUTH_ERRORS[code] ?? GOOGLE_OAUTH_ERRORS.Default;
}
