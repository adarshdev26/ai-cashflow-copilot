'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { googleOAuthErrorMessage } from '@/lib/auth/oauth-errors';
import { notify } from '@/lib/ui/toast';

/** Shows the Auth.js error query (`?error=`) as a banner and a toast once. */
export function useOAuthError(setError: (message: string) => void) {
    const searchParams = useSearchParams();
    const announced = useRef<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('error');
        if (!code || announced.current === code) return;
        announced.current = code;
        const message = googleOAuthErrorMessage(code);
        setError(message);
        notify.error(message);
    }, [searchParams, setError]);
}
