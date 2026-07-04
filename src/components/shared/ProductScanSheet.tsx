import { AlertTriangle, CheckCircle2, Keyboard, Loader2, QrCode, ScanLine, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Html5Qrcode } from 'html5-qrcode'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useResolveScannedProducts } from '@/hooks/useProducts'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { ResolvedScanItem, ScanResolveStatus } from '@/types/product'

interface ProductScanSheetProps {
  open: boolean
  selectedProductIds: Set<string>
  onOpenChange: (open: boolean) => void
  onResolvedItems: (items: ResolvedScanItem[]) => void
}

type ScannerState = 'idle' | 'starting' | 'scanning' | 'resolving' | 'permission-denied' | 'unsupported' | 'network-error'

type ScanFeedbackTone = 'neutral' | 'success' | 'warning' | 'error'

interface ScanLogEntry {
  id: string
  key: string
  label: string
  message: string
}

interface ScanFeedback {
  tone: ScanFeedbackTone
  label: string
  message: string
}

const SCAN_COOLDOWN_MS = 1500
const BATCH_INTERVAL_MS = 250
const MAX_LOG_ITEMS = 8

const statusLabels: Record<ScanResolveStatus, string> = {
  RESOLVED: 'Added',
  INVALID_PAYLOAD: 'Invalid',
  NOT_FOUND: 'Not found',
  INACTIVE: 'Inactive',
  OUT_OF_STOCK: 'Out of stock',
}

const scannerStateCopy: Record<ScannerState, string> = {
  idle: 'Open scanner to begin.',
  starting: 'Starting camera...',
  scanning: 'Scanning',
  resolving: 'Resolving scanned SKUs...',
  'permission-denied': 'Camera permission was denied. Use manual SKU entry below.',
  unsupported: 'Camera scanning is unavailable on this device or connection. Use manual SKU entry below.',
  'network-error': 'Network issue while resolving scans. Retry or enter SKU manually.',
}

function getFeedbackTone(tone: ScanFeedbackTone) {
  if (tone === 'success') {
    return 'border-brand-600/30 bg-brand-50 text-brand-700'
  }

  if (tone === 'warning') {
    return 'border-warning bg-pending-bg text-pending-text'
  }

  if (tone === 'error') {
    return 'border-error/30 bg-error/5 text-error'
  }

  return 'border-border bg-background text-text-secondary'
}

function getFeedbackIcon(tone: ScanFeedbackTone) {
  if (tone === 'success') {
    return <CheckCircle2 className="size-3.5" />
  }

  if (tone === 'error') {
    return <XCircle className="size-3.5" />
  }

  return <ScanLine className="size-3.5" />
}

const normalizeScanKey = (code: string) => code.trim().toUpperCase()

export function ProductScanSheet({ open, selectedProductIds, onOpenChange, onResolvedItems }: ProductScanSheetProps) {
  const scannerElementId = useMemo(() => `product-scan-reader-${Math.random().toString(36).slice(2)}`, [])
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const queuedCodesRef = useRef<string[]>([])
  const isResolvingRef = useRef(false)
  const lastScannedAtRef = useRef(new Map<string, number>())
  const [scannerState, setScannerState] = useState<ScannerState>('idle')
  const [manualSku, setManualSku] = useState('')
  const [bulkSkus, setBulkSkus] = useState('')
  const [failedBatch, setFailedBatch] = useState<string[] | null>(null)
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([])
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback>({
    tone: 'neutral',
    label: 'Ready to scan',
    message: 'Newly added products will appear in the scan log.',
  })
  const resolveScansMutation = useResolveScannedProducts()

  const appendAddedLogEntries = useCallback((entries: ScanLogEntry[]) => {
    if (entries.length === 0) {
      return
    }

    setScanLog((currentLog) => {
      const existingKeys = new Set(currentLog.map((entry) => entry.key))
      const newEntries = entries.filter((entry) => !existingKeys.has(entry.key))

      return [...newEntries, ...currentLog].slice(0, MAX_LOG_ITEMS)
    })
  }, [])

  const enqueueCode = useCallback((code: string, options?: { bypassCooldown?: boolean }) => {
    const trimmedCode = code.trim()
    const scanKey = normalizeScanKey(trimmedCode)

    if (!scanKey) {
      return
    }

    const now = Date.now()
    const lastSeenAt = lastScannedAtRef.current.get(scanKey) ?? 0

    if (!options?.bypassCooldown && now - lastSeenAt < SCAN_COOLDOWN_MS) {
      return
    }

    lastScannedAtRef.current.set(scanKey, now)
    queuedCodesRef.current.push(trimmedCode)
    setScannerState((currentState) => (currentState === 'network-error' ? 'resolving' : currentState))
  }, [])

  const resolveCodes = useCallback(
    async (codes: string[]) => {
      if (codes.length === 0) {
        return
      }

      isResolvingRef.current = true
      setScannerState('resolving')
      setFailedBatch(null)

      try {
        const response = await resolveScansMutation.mutateAsync({ codes, mode: 'sku' })
        const resolvedItems = response.items.filter((item) => item.status === 'RESOLVED' && item.product)
        const duplicateItems = resolvedItems.filter((item) => item.product && selectedProductIds.has(item.product.id))
        const addedItems = resolvedItems.filter((item) => item.product && !selectedProductIds.has(item.product.id))
        const issueItems = response.items.filter((item) => item.status !== 'RESOLVED')
        const addedEntries = addedItems.map<ScanLogEntry>((item) => ({
          id: `${Date.now()}-${item.input}-added`,
          key: `product:${item.product?.id ?? normalizeScanKey(item.input)}`,
          label: item.sku ?? item.input,
          message: item.product?.name ?? 'Product added.',
        }))

        appendAddedLogEntries(addedEntries)
        onResolvedItems(response.items)

        const firstIssue = issueItems[0]
        const firstDuplicate = duplicateItems[0]

        if (firstIssue) {
          const tone = firstIssue.status === 'INACTIVE' || firstIssue.status === 'OUT_OF_STOCK' ? 'warning' : 'error'
          const extraIssues = issueItems.length > 1 ? ` (+${issueItems.length - 1} more issue${issueItems.length === 2 ? '' : 's'})` : ''
          setScanFeedback({
            tone,
            label: statusLabels[firstIssue.status],
            message: `${firstIssue.sku ?? firstIssue.input}: ${firstIssue.message ?? statusLabels[firstIssue.status]}${extraIssues}`,
          })
        } else if (firstDuplicate?.product) {
          setScanFeedback({
            tone: 'warning',
            label: 'Duplicate scan',
            message: `${firstDuplicate.product.name} is already in the request tray.`,
          })
        } else if (addedItems.length > 0) {
          setScanFeedback({
            tone: 'success',
            label: addedItems.length === 1 ? 'Product added' : `${addedItems.length} products added`,
            message: addedItems.length === 1 ? (addedItems[0]?.product?.name ?? 'Product added to the tray.') : 'Added products are listed below.',
          })
        }

        setScannerState('scanning')
      } catch (error) {
        const message = getErrorMessage(error, { context: 'load' })
        setFailedBatch(codes)
        setScannerState('network-error')
        setScanFeedback({
          tone: 'error',
          label: 'Network error',
          message,
        })
      } finally {
        isResolvingRef.current = false
      }
    },
    [appendAddedLogEntries, onResolvedItems, resolveScansMutation, selectedProductIds],
  )

  const flushQueuedCodes = useCallback(() => {
    if (isResolvingRef.current || queuedCodesRef.current.length === 0) {
      return
    }

    const nextBatch = queuedCodesRef.current.splice(0, 100)
    void resolveCodes(nextBatch)
  }, [resolveCodes])

  useEffect(() => {
    if (!open) {
      return
    }

    const intervalId = window.setInterval(flushQueuedCodes, BATCH_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [flushQueuedCodes, open])

  useEffect(() => {
    if (!open) {
      queuedCodesRef.current = []
      setScannerState('idle')
      setScanFeedback({
        tone: 'neutral',
        label: 'Ready to scan',
        message: 'Newly added products will appear in the scan log.',
      })

      return
    }

    setScanFeedback({
      tone: 'neutral',
      label: 'Scanning',
      message: 'Point the camera at a product QR code.',
    })

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setScannerState('unsupported')
      return
    }

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!window.isSecureContext && !isLocalhost) {
      setScannerState('unsupported')
      return
    }

    let cancelled = false
    setScannerState('starting')

    void import('html5-qrcode')
      .then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
        if (cancelled) {
          return
        }

        const scanner = new Html5Qrcode(scannerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        })
        scannerRef.current = scanner

        return scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
          (decodedText) => enqueueCode(decodedText),
          () => undefined,
        )
      })
      .then(() => {
        if (!cancelled) {
          setScannerState('scanning')
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
        setScannerState(message.includes('permission') || message.includes('notallowed') ? 'permission-denied' : 'unsupported')
      })

    return () => {
      cancelled = true
      const currentScanner = scannerRef.current
      scannerRef.current = null

      if (!currentScanner) {
        return
      }

      const stopPromise = currentScanner.isScanning ? currentScanner.stop() : Promise.resolve()
      void stopPromise
        .catch(() => undefined)
        .then(() => currentScanner.clear())
        .catch(() => undefined)
    }
  }, [enqueueCode, open, scannerElementId])

  const submitManualSkus = () => {
    const codes = [manualSku, ...bulkSkus.split(/[\n,]+/)].map((code) => code.trim()).filter(Boolean)

    if (codes.length === 0) {
      return
    }

    codes.forEach((code) => enqueueCode(code, { bypassCooldown: true }))
    setManualSku('')
    setBulkSkus('')
    flushQueuedCodes()
  }

  const retryFailedBatch = () => {
    if (!failedBatch) {
      return
    }

    void resolveCodes(failedBatch)
  }

  const stateTone: ScanFeedbackTone =
    scannerState === 'scanning' || scannerState === 'network-error'
      ? scanFeedback.tone
      : scannerState === 'permission-denied' || scannerState === 'unsupported'
        ? 'warning'
        : 'neutral'
  const stateLabel = scannerState === 'scanning' || scannerState === 'network-error' ? scanFeedback.label : scannerStateCopy[scannerState]
  const stateMessage = scannerState === 'scanning' || scannerState === 'network-error' ? scanFeedback.message : scannerStateCopy[scannerState]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[96dvh] min-h-[88dvh] flex-col overflow-hidden rounded-t-2xl p-0 sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2 xl:inset-y-6 xl:left-auto xl:right-6 xl:h-auto xl:min-h-0 xl:w-[420px] xl:max-w-none xl:translate-x-0 xl:rounded-2xl xl:border">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <QrCode className="size-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle>Scan product QR</SheetTitle>
              <SheetDescription>Scan SKUs now, choose the project before submitting.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Camera</p>
                <p className="text-xs text-text-secondary">QR codes should contain the product SKU.</p>
              </div>
              <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium', getFeedbackTone(stateTone))}>
                {scannerState === 'starting' || scannerState === 'resolving' ? <Loader2 className="size-3.5 animate-spin" /> : getFeedbackIcon(stateTone)}
                {stateLabel}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-black">
              <div id={scannerElementId} className="min-h-[280px] w-full [&_video]:min-h-[280px] [&_video]:object-cover" />
            </div>

            <div className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm', getFeedbackTone(stateTone))} role={stateTone === 'error' ? 'alert' : 'status'}>
              <span className="mt-0.5 shrink-0">{scannerState === 'starting' || scannerState === 'resolving' ? <Loader2 className="size-3.5 animate-spin" /> : getFeedbackIcon(stateTone)}</span>
              <div className="min-w-0">
                <p className="font-medium">{stateLabel}</p>
                <p className="text-xs opacity-90">{stateMessage}</p>
              </div>
            </div>

            {scannerState === 'permission-denied' || scannerState === 'unsupported' ? (
              <p className="rounded-lg border border-warning bg-pending-bg px-3 py-2 text-sm text-pending-text" role="alert">
                {scannerStateCopy[scannerState]} If you are on mobile, confirm camera access and use HTTPS.
              </p>
            ) : null}

            {scannerState === 'network-error' && failedBatch ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                <span>Could not resolve the last batch.</span>
                <Button type="button" variant="secondary" size="sm" onClick={retryFailedBatch}>
                  Retry
                </Button>
              </div>
            ) : null}
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <Keyboard className="size-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary">Manual SKU fallback</h3>
            </div>
            <div className="flex gap-2">
              <Input
                value={manualSku}
                onChange={(event) => setManualSku(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    submitManualSkus()
                  }
                }}
                placeholder="Enter or scan SKU"
                aria-label="Manual SKU"
              />
              <Button type="button" onClick={submitManualSkus} disabled={!manualSku.trim() && !bulkSkus.trim()}>
                Resolve
              </Button>
            </div>
            <textarea
              value={bulkSkus}
              onChange={(event) => setBulkSkus(event.target.value)}
              className="min-h-20 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              placeholder="Optional: paste multiple SKUs, one per line"
              aria-label="Paste multiple SKUs"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-text-primary">Scan log</h3>
              <span className="text-xs text-text-secondary">Latest {scanLog.length}</span>
            </div>
            {scanLog.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-text-secondary">
                Scanned products and warnings will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {scanLog.map((entry) => (
                  <article key={entry.id} className="rounded-lg border border-brand-600/30 bg-brand-50 px-3 py-2 text-sm text-brand-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex min-w-0 items-center gap-2 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        <span className="truncate">{entry.label}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium">Added</span>
                    </div>
                    <p className="mt-1 text-xs opacity-90">{entry.message}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <SheetFooter className="border-t border-border px-5 py-4">
          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            Done scanning
          </Button>
          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-text-secondary sm:mb-0 sm:mr-auto">
            <AlertTriangle className="size-3.5" />
            Submit remains disabled until a project is selected.
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
