'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  PHASE_PATH,
  PHASE_READY_SELECTOR,
  TOUR_PARAM,
  buildTourSteps,
  parseTourPhase,
  tourHref,
  waitForElement,
} from '../lib/tour-steps';

export function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourParam = searchParams.get(TOUR_PARAM);
  const tourRef = useRef<Driver | null>(null);

  const stop = useCallback(() => {
    tourRef.current?.destroy();
    tourRef.current = null;
  }, []);

  // Start: runs when the URL carries ?tour=1 (or ?tour=finance) on the matching page.
  useEffect(() => {
    const phase = parseTourPhase(tourParam);
    if (!phase || pathname !== PHASE_PATH[phase]) return;

    let cancelled = false;

    waitForElement(PHASE_READY_SELECTOR[phase], 6000).then((found) => {
      if (cancelled) return;

      // Remove ?tour=... so a refresh or back navigation doesn't restart it.
      window.history.replaceState(null, '', pathname);
      if (!found) return;

      const steps = buildTourSteps(phase, {
        goToFinance: () => {
          stop();
          router.push(tourHref('finance'));
        },
      });
      if (steps.length === 0) return;

      stop(); // in case a tour is already open
      const tour = driver({
        steps,
        showProgress: true,
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Finish',
        allowClose: true,
        smoothScroll: true,
        stagePadding: 6,
        stageRadius: 8,
        overlayOpacity: 0.55,
      });
      tourRef.current = tour;
      tour.drive();
    });

    return () => {
      cancelled = true; // only cancels a pending start; a running tour is left alone
    };
  }, [tourParam, pathname, router, stop]);

  // Teardown: when the user leaves the page or the shell unmounts.
  useEffect(() => () => stop(), [pathname, stop]);

  return null;
}