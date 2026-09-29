'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  FINANCE_PATH,
  PHASE_PATH,
  PHASE_READY_SELECTOR,
  buildTourSteps,
  clearTourPhase,
  readTourPhase,
  waitForElement,
  writeTourPhase,
} from '../lib/tour-steps';

export function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();

  // DashboardShell stays mounted between dashboard pages, so this re-runs on every route change.
  useEffect(() => {
    const phase = readTourPhase();
    if (!phase || pathname !== PHASE_PATH[phase]) return;

    let tour: Driver | null = null;
    let cancelled = false;

    const stop = () => {
      tour?.destroy();
      tour = null;
    };

    const goToFinance = () => {
      writeTourPhase('finance');
      stop();
      router.push(FINANCE_PATH);
    };

    waitForElement(PHASE_READY_SELECTOR[phase], 6000).then((found) => {
      if (cancelled || !found) return;

      clearTourPhase(); // run each phase once, even if they refresh mid-tour

      const steps = buildTourSteps(phase, { goToFinance });
      if (steps.length === 0) return;

      tour = driver({
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
      tour.drive();
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [pathname, router]);

  return null;
}