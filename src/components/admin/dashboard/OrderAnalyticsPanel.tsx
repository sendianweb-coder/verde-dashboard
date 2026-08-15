import { Chart } from '@tanstack/react-charts'
import { barY, defineChart, lineY } from '@tanstack/charts'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Button } from '@/components/ui/button'
import { useAdminOrderAnalytics } from '@/hooks/useAdmin'
import { getErrorMessage } from '@/lib/errors'
import type { AdminOrderAnalyticsPeriod } from '@/types/admin'

const money = new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR' })
const PERIODS: Array<{ key: AdminOrderAnalyticsPeriod; label: string }> = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

export function OrderAnalyticsPanel() {
  const [period, setPeriod] = useState<AdminOrderAnalyticsPeriod>('month')
  const analytics = useAdminOrderAnalytics({ period })
  const data = analytics.data
  const revenueChart = useMemo(() => data && defineChart({ marks: [lineY(data.revenueSeries, { x: 'date', y: 'netRevenue', points: true, stroke: '#16a34a' })], x: { scale: () => scalePoint<string>().padding(0.2) }, y: { scale: scaleLinear, nice: true, grid: true }, tooltip }), [data])
  const orderChart = useMemo(() => data && defineChart({ marks: [barY(data.revenueSeries, { x: 'date', y: 'orderCount', fill: '#16a34a' })], x: { scale: () => scaleBand().padding(0.2) }, y: { scale: scaleLinear, nice: true, grid: true }, tooltip }), [data])
  const productChart = useMemo(() => data && data.topProducts.length > 0
    ? defineChart({ marks: [barY(data.topProducts, { x: 'name', y: 'netRevenue', fill: '#15803d' })], x: { scale: () => scaleBand().padding(0.2) }, y: { scale: scaleLinear, nice: true, grid: true }, tooltip })
    : null, [data])

  return <div className="space-y-5">
    {analytics.isLoading ? <PageSkeleton /> : analytics.isError || !data || !revenueChart || !orderChart ? (
      <EmptyState title="Unable to load order analytics" description={getErrorMessage(analytics.error, { context: 'load' })} />
    ) : <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ['Net revenue', money.format(data.totals.netRevenue)],
        ['Orders', String(data.totals.orderCount)],
        ['Average order value', money.format(data.totals.averageOrderValue)],
        ['Best seller', data.topProducts[0] ? `${data.topProducts[0].name} (${data.topProducts[0].quantity})` : 'No sales'],
      ].map(([label, value]) => <article key={label} className="rounded-xl border border-border bg-surface-raised p-5"><p className="text-sm text-text-secondary">{label}</p><p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p></article>)}</div>
      {data.totals.unpricedInternalRequestCount > 0 ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{data.totals.unpricedInternalRequestCount} legacy internal {data.totals.unpricedInternalRequestCount === 1 ? 'request has' : 'requests have'} no saved pickup price and {data.totals.unpricedInternalRequestCount === 1 ? 'is' : 'are'} excluded from revenue.</p> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Revenue trend</h2>
            <div className="flex flex-wrap gap-2" aria-label="Analytics period">
              {PERIODS.map(({ key, label }) => (
                <Button
                  key={key}
                  type="button"
                  variant={period === key ? 'default' : 'secondary'}
                  size="sm"
                  aria-pressed={period === key}
                  onClick={() => setPeriod(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Chart definition={revenueChart} height={300} ariaLabel={`${period} net revenue trend`} />
        </section>
        <section className="rounded-xl border border-border bg-surface-raised p-5"><h2 className="font-semibold">Order volume</h2><Chart definition={orderChart} height={300} ariaLabel={`${period} order volume`} /></section>
      </div>
      <section className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="font-semibold">Top products by net revenue</h2>
        {productChart ? <Chart definition={productChart} height={320} ariaLabel={`${period} top products by net revenue`} /> : <EmptyState title="No product sales" description="No non-cancelled order items were sold during this period." />}
      </section>
    </>}
  </div>
}
