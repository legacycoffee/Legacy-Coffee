import { useEffect, useState } from 'react'
import { LuRefreshCw } from 'react-icons/lu'
import { apiRequest } from '../context/api.js'

const analyticsTabs = [
  { id: 'sales', label: 'Sales' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'active-users', label: 'Active users' },
  { id: 'new-users', label: 'New users' },
]

const statusColors = {
  pending: '#d97706',
  confirmed: '#2563eb',
  fulfilled: '#059669',
  cancelled: '#e11d48',
}

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}

function localDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-UG', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Kampala',
  }).format(new Date(`${value}T12:00:00`))
}

function MetricCard({ label, value, note, className = '', valueClassName = '', shrinkValue = false }) {
  const valueText = String(value)
  const valueFontSize = `${Math.min(24, Math.max(11, 190 / valueText.length))}px`

  return (
    <article className={`min-w-0 overflow-hidden border border-stone-200 bg-white p-2 shadow-sm sm:p-5 ${className}`}>
      <p className="break-words text-[9px] font-medium leading-3 text-stone-500 sm:text-xs sm:leading-normal">{label}</p>
      <p style={shrinkValue ? { fontSize: valueFontSize } : undefined} className={`mt-1 break-words text-xs font-bold leading-tight tracking-tight text-stone-900 sm:mt-2 sm:text-2xl ${valueClassName}`}>{value}</p>
      {note && <p className="mt-1 break-words text-[8px] leading-[10px] text-stone-400 sm:text-xs sm:leading-5">{note}</p>}
    </article>
  )
}

function ChartPanel({ title, description, children }) {
  return (
    <section className="min-w-0 border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function TrendChart({ data, lines, valueFormatter = value => String(value) }) {
  const width = 720
  const height = 250
  const padding = { top: 18, right: 14, bottom: 38, left: 48 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...data.flatMap(point => lines.map(line => Number(point[line.key]) || 0)))
  const x = index => data.length < 2
    ? padding.left + plotWidth / 2
    : padding.left + (index / (data.length - 1)) * plotWidth
  const y = value => padding.top + plotHeight - ((Number(value) || 0) / maxValue) * plotHeight
  const labelIndexes = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])]

  if (!data.length) return <p className="py-12 text-center text-sm text-stone-500">No activity for this period.</p>

  return (
    <svg
      role="img"
      aria-label={lines.map(line => line.label).join(' and ') + ' over time'}
      viewBox={`0 0 ${width} ${height}`}
      className="h-56 w-full overflow-visible"
      preserveAspectRatio="none"
    >
      {[0, 0.5, 1].map(fraction => {
        const gridY = padding.top + plotHeight * fraction
        const value = Math.round(maxValue * (1 - fraction))
        return (
          <g key={fraction}>
            <line x1={padding.left} y1={gridY} x2={width - padding.right} y2={gridY} stroke="#e7e5e4" strokeDasharray="4 5" />
            <text x={padding.left - 8} y={gridY + 4} textAnchor="end" fill="#78716c" fontSize="10">
              {valueFormatter(value)}
            </text>
          </g>
        )
      })}
      {lines.map(line => {
        const lineIndex = lines.indexOf(line)
        const lineOffset = lines.length > 1 ? (lineIndex - (lines.length - 1) / 2) * 3 : 0
        const points = data.map((point, index) => `${x(index)},${y(point[line.key]) + lineOffset}`).join(' ')
        return (
          <g key={line.key}>
            <polyline
              points={points}
              fill="none"
              stroke={line.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>{`${line.label}: ${data.map(point => `${formatShortDate(point.date)} ${valueFormatter(point[line.key])}`).join(', ')}`}</title>
            </polyline>
          </g>
        )
      })}
      {labelIndexes.map(index => (
        <text key={index} x={x(index)} y={height - 10} textAnchor="middle" fill="#78716c" fontSize="10">
          {formatShortDate(data[index].date)}
        </text>
      ))}
    </svg>
  )
}

function ChartLegend({ entries, valueFor, fullWidth = false }) {
  const maxValueLength = Math.max(1, ...entries.map(entry => String(valueFor(entry.value)).length))
  const valueFontSize = `${Math.max(8, Math.min(12, 72 / maxValueLength))}px`

  return (
    <ul className={`mt-4 grid w-full min-w-0 grid-cols-2 gap-px border border-stone-200 bg-stone-200 sm:mt-0 ${fullWidth ? 'sm:grid-cols-3' : 'sm:max-w-xs'}`}>
      {entries.map(entry => (
        <li key={entry.key} className="flex min-w-0 items-start gap-1.5 bg-white p-2.5 text-xs">
          <span aria-hidden="true" className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="flex min-w-0 flex-1 items-baseline justify-between gap-1">
            <span className="min-w-0 truncate font-medium text-stone-600">{entry.label}</span>
            <span style={{ fontSize: valueFontSize }} className="shrink-0 text-right font-semibold leading-tight tabular-nums text-stone-800">{valueFor(entry.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function DonutChart({ entries, valueKey = 'count', formatter = value => String(value), legendBelow = false }) {
  const values = entries.map(entry => Number(entry[valueKey]) || 0)
  const total = values.reduce((sum, value) => sum + value, 0)
  let current = 0
  const stops = entries.map((entry, index) => {
    const start = total ? (current / total) * 100 : 0
    current += values[index]
    const end = total ? (current / total) * 100 : 0
    return `${entry.color} ${start}% ${end}%`
  })

  return (
    <div className={`flex flex-col items-center gap-4 py-2 ${legendBelow ? 'sm:flex-col sm:gap-4' : 'sm:flex-row sm:justify-center sm:gap-8'}`}>
      <div
        role="img"
        aria-label={total ? `Chart showing ${formatter(total)} across categories` : 'No data'}
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{ background: total ? `conic-gradient(${stops.join(', ')})` : '#e7e5e4' }}
      >
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="max-w-full break-all px-1 text-[10px] font-bold leading-tight text-stone-900 sm:text-xs">{formatter(total)}</span>
          <span className="text-[10px] text-stone-500">Total</span>
        </div>
      </div>
      <ChartLegend
        entries={entries.map((entry, index) => ({
          key: entry.status || entry.key,
          label: entry.label || statusLabels[entry.status] || entry.name,
          color: entry.color || statusColors[entry.status],
          value: values[index],
        }))}
        valueFor={formatter}
        fullWidth={legendBelow}
      />
    </div>
  )
}

export default function AnalyticsDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('sales')
  const [start, setStart] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 29)
    return localDateValue(date)
  })
  const [end, setEnd] = useState(() => localDateValue(new Date()))
  const [appliedRange, setAppliedRange] = useState(() => {
    const date = new Date()
    const endDate = localDateValue(date)
    date.setDate(date.getDate() - 29)
    return { start: localDateValue(date), end: endDate }
  })
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    const query = new URLSearchParams(appliedRange)
    apiRequest(`/dashboard/analytics/?${query.toString()}`, { token })
      .then(data => {
        if (isCurrent) setAnalytics(data)
      })
      .catch(requestError => {
        if (isCurrent) setError(requestError.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [token, appliedRange, refreshVersion])

  const applyRange = event => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    setAppliedRange({ start, end })
  }

  const refresh = () => {
    setError('')
    setIsLoading(true)
    setRefreshVersion(version => version + 1)
  }

  const sales = analytics?.sales
  const users = analytics?.users
  const accounting = analytics?.accounting
  const statusEntries = sales?.statuses.flatMap(item => {
    if (item.status !== 'fulfilled') {
      return [{
        ...item,
        key: item.status,
        label: statusLabels[item.status],
        color: statusColors[item.status],
      }]
    }

    const paidCount = Number(sales.paid_order_count) || 0
    return [
      {
        key: 'fulfilled-unpaid',
        label: 'Fulfilled · unpaid',
        color: statusColors.fulfilled,
        count: Math.max(0, Number(item.count) - paidCount),
      },
      {
        key: 'paid',
        label: 'Paid',
        color: '#7c3aed',
        count: paidCount,
      },
    ]
  }) || []
  const accountingEntries = accounting?.by_status.flatMap(item => {
    if (item.status !== 'fulfilled') {
      return [{
        ...item,
        key: item.status,
        label: statusLabels[item.status],
        color: statusColors[item.status],
      }]
    }

    const paidValue = Number(accounting.paid_order_value) || 0
    const fulfilledValue = Number(item.order_value) || 0
    return [
      {
        key: 'fulfilled-unpaid',
        label: 'Fulfilled · unpaid',
        color: statusColors.fulfilled,
        order_value: Math.max(0, fulfilledValue - paidValue),
      },
      {
        key: 'paid',
        label: 'Paid',
        color: '#7c3aed',
        order_value: paidValue,
      },
    ]
  }) || []
  const userTrendLines = activeTab === 'active-users'
    ? [
      { key: 'active_users', label: 'Registered users', color: '#2563eb' },
      { key: 'active_visitors', label: 'Unregistered users', color: '#b86638' },
    ]
    : [
      { key: 'new_users', label: 'Registered users', color: '#059669' },
      { key: 'new_visitors', label: 'Unregistered users', color: '#b86638' },
    ]

  return (
    <section aria-labelledby="analytics-heading">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a75a31]">Business intelligence</p>
          <h1 id="analytics-heading" className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Analytics</h1>
          <p className="mt-1.5 text-sm text-stone-500">Sales activity, customer accounts, and order-value reporting.</p>
        </div>
        <form onSubmit={applyRange} className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-stone-600">
            From
            <input type="date" required value={start} max={end} onChange={event => setStart(event.target.value)} className="mt-1 block min-h-10 border border-stone-200 bg-white px-2 text-sm text-stone-800" />
          </label>
          <label className="text-xs font-medium text-stone-600">
            To
            <input type="date" required value={end} min={start} onChange={event => setEnd(event.target.value)} className="mt-1 block min-h-10 border border-stone-200 bg-white px-2 text-sm text-stone-800" />
          </label>
          <button type="submit" className="min-h-10 bg-[#593a27] px-4 text-xs font-semibold text-white transition hover:bg-[#40291d]">
            Apply
          </button>
          <button type="button" aria-label="Refresh analytics" onClick={refresh} className="flex h-10 w-10 items-center justify-center border border-stone-200 bg-white text-stone-700 hover:bg-stone-50">
            <LuRefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      <div className="mb-5 overflow-x-auto border-b border-stone-200">
        <div role="tablist" aria-label="Analytics reports" className="flex min-w-max gap-1">
          {analyticsTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              id={`analytics-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`analytics-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-[#a75a31] text-[#784126]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {isLoading && !analytics && <p role="status" className="mb-5 border border-stone-200 bg-white p-4 text-sm text-stone-500">Loading analytics…</p>}
      {!error && analytics && (
        <>
          {activeTab === 'sales' && (
            <div id="analytics-panel-sales" role="tabpanel" aria-labelledby="analytics-tab-sales">
              <div className="mb-4 grid grid-cols-2 gap-1 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
                <MetricCard className="min-w-0" shrinkValue valueClassName="tabular-nums whitespace-nowrap" label="Orders placed" value={sales.order_count} note={`${formatShortDate(analytics.period.start)} – ${formatShortDate(analytics.period.end)}`} />
                <MetricCard className="min-w-0" shrinkValue valueClassName="tabular-nums whitespace-nowrap" label="Non-cancelled order value" value={formatCurrency(sales.non_cancelled_order_value)} note="Order requests, not payment-confirmed revenue" />
                <MetricCard className="min-w-0" shrinkValue valueClassName="tabular-nums whitespace-nowrap" label="Confirmed + fulfilled value" value={formatCurrency(sales.confirmed_fulfilled_order_value)} note="Still not proof of payment collected" />
                <MetricCard className="min-w-0" shrinkValue valueClassName="tabular-nums whitespace-nowrap" label="Paid order value" value={formatCurrency(sales.paid_order_value)} note={`${sales.paid_order_count} fulfilled orders marked paid by staff`} />
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
                <ChartPanel title="Orders over time" description="Daily submitted order count for the selected period.">
                  <TrendChart data={sales.daily} lines={[{ key: 'orders', label: 'Orders', color: '#b86638' }]} />
                </ChartPanel>
                <ChartPanel title="Orders by status and payment" description="Paid orders are split from fulfilled unpaid orders so every order is counted once.">
                  <DonutChart entries={statusEntries} formatter={value => String(value)} />
                </ChartPanel>
                <ChartPanel title="Order value trend" description="Daily order request value, including all statuses.">
                  <TrendChart
                    data={sales.daily}
                    lines={[
                      { key: 'order_value', label: 'Order value', color: '#7c3f20' },
                      { key: 'paid_order_value', label: 'Paid order value', color: '#7c3aed' },
                    ]}
                    valueFormatter={value => formatCurrency(value)}
                  />
                </ChartPanel>
                <ChartPanel title="Top products" description="Product line value across non-cancelled orders.">
                  {sales.products.length ? (
                    <ul className="space-y-4 py-2">
                      {sales.products.map(product => {
                        const maxValue = Math.max(1, ...sales.products.map(item => Number(item.order_value) || 0))
                        const width = Math.max(2, ((Number(product.order_value) || 0) / maxValue) * 100)
                        return (
                          <li key={product.product_name}>
                            <div className="mb-1 flex justify-between gap-3 text-xs">
                              <span className="truncate font-medium text-stone-700">{product.product_name}</span>
                              <span className="shrink-0 text-stone-500">{formatCurrency(product.order_value)}</span>
                            </div>
                            <div className="h-2 bg-stone-100">
                              <div className="h-full bg-[#b86638]" style={{ width: `${width}%` }} />
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : <p className="py-12 text-center text-sm text-stone-500">No product sales in this period.</p>}
                </ChartPanel>
              </div>
            </div>
          )}

          {(activeTab === 'active-users' || activeTab === 'new-users') && (
            <div id={`analytics-panel-${activeTab}`} role="tabpanel" aria-labelledby={`analytics-tab-${activeTab}`}>
              <div className="mb-4 grid grid-cols-3 gap-1 sm:gap-3">
                <MetricCard
                  className="min-w-0"
                  label={activeTab === 'active-users' ? 'Active registered accounts' : 'New registered accounts'}
                  value={activeTab === 'active-users' ? users.active_users : users.new_users}
                  note={activeTab === 'active-users' ? 'Registered or signed in during this period' : 'Registered in this period'}
                />
                <MetricCard
                  className="min-w-0"
                  label={activeTab === 'active-users' ? 'Active unregistered visitors' : 'New unregistered visitors'}
                  value={activeTab === 'active-users' ? users.active_visitors : users.new_visitors}
                  note={activeTab === 'active-users'
                    ? 'Consented browser IDs observed in this period'
                    : 'First-time browser IDs after analytics consent'}
                />
                {activeTab === 'active-users' ? (
                  <MetricCard
                    className="min-w-0"
                    label="Total active users"
                    value={users.active_users + users.active_visitors}
                    note="Registered accounts and unregistered visitors"
                  />
                ) : (
                  <MetricCard
                    className="min-w-0"
                    label="Active registered accounts"
                    value={users.active_users}
                    note="Most recent sign-in was in this period"
                  />
                )}
              </div>
              <ChartPanel
                title={activeTab === 'active-users' ? 'Registered and unregistered active users over time' : 'Registered accounts and unregistered visitors over time'}
                description={activeTab === 'active-users'
                  ? 'Daily registered accounts created or signed in, and consented unregistered visitor browser IDs seen during the selected period.'
                  : 'Daily new customer registrations compared with first-time unregistered browser visitors who opted in to analytics.'}
              >
                <TrendChart
                  data={users.daily}
                  lines={userTrendLines}
                />
                <ul aria-label="Chart color key" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-stone-100 pt-3">
                  {userTrendLines.map(line => (
                    <li key={line.key} className="flex items-center gap-2 text-xs text-stone-600">
                      <span aria-hidden="true" className="h-1 w-5 rounded-full" style={{ backgroundColor: line.color }} />
                      <span>{line.label}</span>
                    </li>
                  ))}
                </ul>
              </ChartPanel>
              <p className="mt-3 text-xs leading-5 text-stone-500">
                Active registered users include customer accounts created or signed in during the selected period. Active unregistered visitors are consented browser IDs seen during the period; browser IDs observed while signed in are excluded.
              </p>
            </div>
          )}

          {activeTab === 'accounting' && (
            <div id="analytics-panel-accounting" role="tabpanel" aria-labelledby="analytics-tab-accounting">
              <div role="note" className="mb-4 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <strong>Order values only:</strong> paid totals include fulfilled orders manually marked as paid by staff. This system does not record payment transactions or expenses, so amounts are not a full ledger or profit report.
              </div>
              <div className="mb-4 grid grid-cols-2 gap-1 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5">
                <MetricCard className="min-w-0" shrinkValue valueClassName="tabular-nums whitespace-nowrap" label="Pending order value" value={formatCurrency(accounting.pending_order_value)} note="Awaiting order confirmation" />
                <MetricCard className="min-w-0" shrinkValue valueClassName="tabular-nums whitespace-nowrap" label="Confirmed order value" value={formatCurrency(accounting.confirmed_order_value)} note="Not payment verified" />
                <MetricCard className="min-w-0" shrinkValue valueClassName="tabular-nums whitespace-nowrap" label="Fulfilled order value" value={formatCurrency(accounting.fulfilled_order_value)} note="Fulfillment does not confirm payment" />
                <MetricCard className="min-w-0" shrinkValue valueClassName="tabular-nums whitespace-nowrap" label="Paid order value" value={formatCurrency(accounting.paid_order_value)} note={`${accounting.paid_order_count} fulfilled orders marked paid by staff`} />
              </div>
              <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <ChartPanel title="Order value by status and payment" description="Paid orders are split from fulfilled unpaid orders so each order value is counted only once.">
                  <DonutChart entries={accountingEntries} valueKey="order_value" formatter={formatCurrency} legendBelow />
                </ChartPanel>
                <ChartPanel title="Accounting summary" description="Order requests recorded during the selected period.">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[360px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-[#7c3f20] text-xs text-white">
                          <th scope="col" className="border border-[#6a351b] px-3 py-3 font-semibold">Order status</th>
                          <th scope="col" className="border border-[#6a351b] px-3 py-3 text-right font-semibold">Orders</th>
                          <th scope="col" className="border border-[#6a351b] px-3 py-3 text-right font-semibold">Order value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounting.by_status.map(row => (
                          <tr key={row.status} className="odd:bg-white even:bg-stone-50/50">
                            <th scope="row" className="border border-stone-200 px-3 py-3 font-medium text-stone-700">{statusLabels[row.status]}</th>
                            <td className="border border-stone-200 px-3 py-3 text-right text-stone-600">{row.count}</td>
                            <td className="border border-stone-200 px-3 py-3 text-right font-semibold text-stone-800">{formatCurrency(row.order_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    Paid orders: <strong>{accounting.paid_order_count}</strong> · Paid order value: <strong>{formatCurrency(accounting.paid_order_value)}</strong>. Paid orders are included in the fulfilled status totals above.
                  </p>
                  <div className="mt-4 grid grid-cols-2 border border-stone-200 bg-stone-200 text-xs sm:max-w-xs">
                    <span className="bg-stone-50 px-3 py-2 font-medium text-stone-600">Cancelled order value</span>
                    <span className="break-all bg-white px-3 py-2 text-right font-semibold text-stone-800">{formatCurrency(accounting.cancelled_order_value)}</span>
                  </div>
                </ChartPanel>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
