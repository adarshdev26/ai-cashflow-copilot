'use client';

import { type ReactNode, useRef, useState } from 'react';
import { ImageDown } from 'lucide-react';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { exportElementAsPng, slugify } from './chart-download';

export interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  action?: ReactNode;
  children?: ReactNode;
  downloadable?: boolean;
  filename?: string;
  tourId?: string;
  exportTourId?: string;
  onRetry?: () => void;
  ariaLabel?: string;
}

export function ChartCard({
  title,
  description,
  isLoading = false,
  isError = false,
  isEmpty = false,
  emptyMessage = 'No data yet.',
  action,
  children,
  downloadable = true,
  filename,
  tourId,
  exportTourId,
  onRetry,
  ariaLabel,
}: ChartCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const canExport = downloadable && !isLoading && !isError && !isEmpty;

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportElementAsPng(cardRef.current, {
        filename: filename ?? `${slugify(title)}-${new Date().toISOString().slice(0, 10)}`,
      });
    } catch (error) {
      notify.error(getErrorMessage(error, 'Failed to export chart'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      data-tour={tourId}
      role="group"
      aria-label={ariaLabel ?? title}
      className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-base-content">{title}</h3>
          {description && <p className="text-xs text-base-content/60">{description}</p>}
        </div>
        <div className="flex items-center gap-2" data-export-ignore>
          {action}
          {canExport && (
            <button
              type="button"
              data-tour={exportTourId}
              onClick={handleExport}
              disabled={exporting}
              aria-label={`Export ${title} as PNG`}
              title="Export as PNG"
              className="rounded-lg border border-base-300 p-2 text-base-content/60 hover:bg-base-200 hover:text-base-content/80 disabled:opacity-50"
            >
              <ImageDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fixed height: ResponsiveContainer needs a parent with a real height */}
      <div className="h-72">
        {isLoading ? (
          <div className="h-full animate-pulse rounded-lg bg-base-200" aria-hidden="true" />
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-error">
            <span>Couldn&apos;t load this chart.</span>
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn btn-sm btn-outline">
                Retry
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-base-content/60">{emptyMessage}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default ChartCard;
