import { useEffect, useState } from 'react'
import { LuRefreshCw } from 'react-icons/lu'
import { apiRequest } from '../context/api.js'

const analyticsTabs = [
  { id: 'sales', label: 'Sales' },
  { id: 'active-users', label: 'Active users' },
  { id: 'new-users', label: 'New users' },
  { id: 'accounting', label: 'Accounting' },
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

function MetricCard({ label, value, note }) {
  return (
    <article className="border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-stone-900">{value}</p>
      {note && <p className="mt-1 text-xs leading-5 text-stone-400">{note}</p>}
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
        const points = data.map((point, index) => `${x(index)},${y(point[line.key])}`).join(' ')
        return (
          <g key={line.key}>
            <polyline points={points} fill="none" stroke={line.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((point, index) => (
              <circle key={point.date} cx={x(index)} cy={y(point[line.key])} r={data.length > 40 ? 1.5 : 3} fill={line.color}>
                <title>{`${formatShortDate(point.date)}: ${line.label} ${valueFormatter(point[line.key])}`}</title>
              </circle>
            ))}
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

function ChartLegend({ entries, valueFor }) {
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {entries.map(entry => (
        <li key={entry.key} className="flex min-w-0 items-center gap-2 text-xs">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="min-w-0 flex-1 truncate text-stone-600">{entry.label}</span>
          <span className="shrink-0 font-semibold text-stone-800">{valueFor(entry.value)}</span>
        </li>
      ))}
    </ul>
  )
}

function DonutChart({ entries, valueKey = 'count', formatter = value => String(value) }) {
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
    <div className="flex flex-col items-center gap-5 py-2 sm:flex-row sm:justify-center sm:gap-8">
      <div
        role="img"
        aria-label={total ? `Chart showing ${formatter(total)} across categories` : 'No data'}
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{ background: total ? `conic-gradient(${stops.join(', ')})` : '#e7e5e4' }}
      >
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-lg font-bold text-stone-900">{formatter(total)}</span>
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
  const statusEntries = sales?.statuses.map(item => ({
    ...item,
    label: statusLabels[item.status],
    color: statusColors[item.status],
  })) || []
  const accountingEntries = accounting?.by_status.map(item => ({
    ...item,
    label: statusLabels[item.status],
    color: statusColors[item.status],
  })) || []

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
              <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard label="Orders placed" value={sales.order_count} note={`${formatShortDate(analytics.period.start)} – ${formatShortDate(analytics.period.end)}`} />
                <MetricCard label="Non-cancelled order value" value={formatCurrency(sales.non_cancelled_order_value)} note="Order requests, not payment-confirmed revenue" />
                <MetricCard label="Confirmed + fulfilled value" value={formatCurrency(sales.confirmed_fulfilled_order_value)} note="Still not proof of payment collected" />
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
                <ChartPanel title="Orders over time" description="Daily submitted order count for the selected period.">
                  <TrendChart data={sales.daily} lines={[{ key: 'orders', label: 'Orders', color: '#b86638' }]} />
                </ChartPanel>
                <ChartPanel title="Orders by status" description="Order count distribution.">
                  <DonutChart entries={statusEntries} formatter={value => String(value)} />
                </ChartPanel>
                <ChartPanel title="Order value trend" description="Daily order request value, including all statuses.">
                  <TrendChart data={sales.daily} lines={[{ key: 'order_value', label: 'Order value', color: '#7c3f20' }]} valueFormatter={value => formatCurrency(value)} />
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
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label={activeTab === 'active-users' ? 'Active customer accounts' : 'New customer accounts'}
                  value={activeTab === 'active-users' ? users.active_users : users.new_users}
                  note={activeTab === 'active-users' ? 'Accounts whose most recent sign-in was in this period' : 'Accounts registered in this period'}
                />
                <MetricCard
                  label={activeTab === 'active-users' ? 'New customer accounts' : 'Active customer accounts'}
                  value={activeTab === 'active-users' ? users.new_users : users.active_users}
                  note={activeTab === 'active-users' ? 'Registered during the selected period' : 'Most recent sign-in was in the selected period'}
                />
              </div>
              <ChartPanel
                title={activeTab === 'active-users' ? 'Active users over time' : 'New users over time'}
                description={activeTab === 'active-users'
                  ? 'Daily count of customer accounts with a recorded most recent login on that date.'
                  : 'Daily customer account registrations.'}
              >
                <TrendChart
                  data={users.daily}
                  lines={activeTab === 'active-users'
                    ? [{ key: 'active_users', label: 'Active accounts', color: '#2563eb' }]
                    : [{ key: 'new_users', label: 'New accounts', color: '#059669' }]}
                />
              </ChartPanel>
              <p className="mt-3 text-xs leading-5 text-stone-500">
                These metrics use registered customer accounts only; staff and anonymous site visitors are not included. Active users are based on each account’s last recorded login, not session or page-view tracking.
              </p>
            </div>
          )}

          {activeTab === 'accounting' && (
            <div id="analytics-panel-accounting" role="tabpanel" aria-labelledby="analytics-tab-accounting">
              <div role="note" className="mb-4 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <strong>Order values only:</strong> this system does not record payment transactions or expenses. Amounts below are order values, not verified collected revenue, balances, or profit.
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Non-cancelled order value" value={formatCurrency(accounting.order_value_non_cancelled)} note="Pending, confirmed, and fulfilled" />
                <MetricCard label="Pending order value" value={formatCurrency(accounting.pending_order_value)} note="Awaiting order confirmation" />
                <MetricCard label="Confirmed order value" value={formatCurrency(accounting.confirmed_order_value)} note="Not payment verified" />
                <MetricCard label="Fulfilled order value" value={formatCurrency(accounting.fulfilled_order_value)} note="Fulfillment does not confirm payment" />
              </div>
              <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <ChartPanel title="Order value by status" description="Distribution of submitted order totals; cancelled orders are shown separately.">
                  <DonutChart entries={accountingEntries} valueKey="order_value" formatter={formatCurrency} />
                </ChartPanel>
                <ChartPanel title="Accounting summary" description="Order requests recorded during the selected period.">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[360px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 text-xs text-stone-500">
                          <th scope="col" className="py-3 font-medium">Order status</th>
                          <th scope="col" className="py-3 text-right font-medium">Orders</th>
                          <th scope="col" className="py-3 text-right font-medium">Order value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {accounting.by_status.map(row => (
                          <tr key={row.status}>
                            <th scope="row" className="py-3 font-medium text-stone-700">{statusLabels[row.status]}</th>
                            <td className="py-3 text-right text-stone-600">{row.count}</td>
                            <td className="py-3 text-right font-semibold text-stone-800">{formatCurrency(row.order_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 border-t border-stone-100 pt-4 text-xs text-stone-500">
                    Cancelled order value: <span className="font-semibold text-stone-700">{formatCurrency(accounting.cancelled_order_value)}</span>
                  </p>
                </ChartPanel>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
