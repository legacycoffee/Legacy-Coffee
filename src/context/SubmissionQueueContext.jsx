import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { SubmissionQueueContext } from './submissionQueueContext.js'
import { apiRequest } from './api.js'
import { useAuth } from './useAuth.js'
import { useCart } from './useCart.js'

const QUEUE_STORAGE_KEY = 'legacy-coffee-pending-submissions-v1'
const RETRY_DELAY_MS = 15_000
const MAX_RETRY_DELAY_MS = 5 * 60_000
const REQUEST_TIMEOUT_MS = 120_000

function readQueue() {
  try {
    const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!storedQueue) return []

    const queue = JSON.parse(storedQueue)
    if (!Array.isArray(queue)) return []

    return queue
      .filter(entry => (
        entry
        && typeof entry.id === 'string'
        && ['order', 'newsletter'].includes(entry.type)
        && entry.payload
      ))
      .map(entry => entry.status === 'sending'
        ? {
            ...entry,
            status: 'queued',
            displayOrder: entry.displayOrder
              ? { ...entry.displayOrder, submissionStatus: 'queued' }
              : entry.displayOrder,
          }
        : entry)
  } catch (error) {
    console.warn('Pending submissions could not be read from this browser.', error)
    return []
  }
}

function writeQueue(queue) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch {
    throw new Error('Your request could not be saved on this device. Check browser storage and try again.')
  }
}

function getRetryDelay(attempts) {
  return Math.min(
    MAX_RETRY_DELAY_MS,
    RETRY_DELAY_MS * (2 ** Math.min(Math.max(attempts - 1, 0), 5)),
  )
}

function isRetryable(error) {
  return !error.status
    || error.status === 408
    || error.status === 425
    || error.status === 429
    || error.status >= 500
}

function createReceivedOrder(entry, result) {
  const customer = {
    name: result.customer_name,
    business_name: result.business_name,
    email: result.customer_email,
    phone: result.customer_phone,
    address: result.delivery_address,
    city: result.delivery_city,
    notes: result.delivery_notes,
  }

  return {
    ...entry.displayOrder,
    id: result.reference,
    public_id: result.public_id,
    submissionId: entry.id,
    submissionStatus: 'received',
    status: result.status,
    customer,
    total: Number(result.total),
    createdAt: result.created_at || entry.displayOrder.createdAt,
    items: result.order_items.map((orderItem, index) => ({
      ...entry.displayOrder.items[index],
      name: orderItem.product_name,
      weight: orderItem.weight,
      price: Number(orderItem.unit_price),
      quantity: orderItem.quantity,
      is_wholesale: orderItem.is_wholesale,
    })),
  }
}

export function SubmissionQueueProvider({ children }) {
  const { token, user } = useAuth()
  const userId = user?.id
  const { saveOrder } = useCart()
  const [queue, setQueue] = useState(readQueue)
  const [notice, setNotice] = useState(null)
  const queueRef = useRef(queue)
  const isSyncingRef = useRef(false)

  const commitQueue = useCallback(nextQueue => {
    writeQueue(nextQueue)
    queueRef.current = nextQueue
    setQueue(nextQueue)
  }, [])

  const updateEntry = useCallback((id, updates) => {
    commitQueue(queueRef.current.map(entry => (
      entry.id === id ? { ...entry, ...updates } : entry
    )))
  }, [commitQueue])

  const notify = useCallback((message, type = 'success') => {
    const noticeId = crypto.randomUUID()
    setNotice({ id: noticeId, message, type })
    window.setTimeout(() => {
      setNotice(current => current?.id === noticeId ? null : current)
    }, 10_000)
  }, [])

  const enqueueOrder = useCallback(({ payload, displayOrder }) => {
    if (!token || !userId) {
      throw new Error('Sign in again before placing your order.')
    }

    const id = crypto.randomUUID()
    const queuedOrder = {
      ...displayOrder,
      id: null,
      public_id: null,
      submissionId: id,
      submissionStatus: 'queued',
      status: 'pending',
    }
    const entry = {
      id,
      type: 'order',
      userId,
      status: 'queued',
      attempts: 0,
      nextAttemptAt: 0,
      payload: { ...payload, submission_id: id },
      displayOrder: queuedOrder,
    }

    commitQueue([...queueRef.current, entry])
    saveOrder(queuedOrder)
    return queuedOrder
  }, [commitQueue, saveOrder, token, userId])

  const enqueueNewsletterSubscription = useCallback(email => {
    const normalizedEmail = email.trim().toLowerCase()
    const existing = queueRef.current.find(entry => (
      entry.type === 'newsletter'
      && entry.payload.email === normalizedEmail
      && entry.status !== 'failed'
    ))
    if (existing) return existing.id

    const entry = {
      id: crypto.randomUUID(),
      type: 'newsletter',
      status: 'queued',
      attempts: 0,
      nextAttemptAt: 0,
      payload: { email: normalizedEmail },
    }
    commitQueue([...queueRef.current, entry])
    return entry.id
  }, [commitQueue])

  const retrySubmission = useCallback(id => {
    const entry = queueRef.current.find(item => item.id === id)
    if (!entry || entry.status !== 'failed') return false

    const queuedOrder = entry.type === 'order'
      ? {
          ...entry.displayOrder,
          submissionStatus: 'queued',
          failureMessage: '',
        }
      : null
    updateEntry(id, {
      status: 'queued',
      attempts: 0,
      nextAttemptAt: 0,
      failureMessage: '',
      ...(queuedOrder ? { displayOrder: queuedOrder } : {}),
    })
    if (queuedOrder) {
      saveOrder(queuedOrder)
    }
    return true
  }, [saveOrder, updateEntry])

  const flushQueue = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return
    isSyncingRef.current = true

    try {
      const eligibleEntries = queueRef.current.filter(entry => (
        entry.status === 'queued'
        && entry.nextAttemptAt <= Date.now()
        && (
          entry.type === 'newsletter'
          || (token && userId && entry.userId === userId)
        )
      ))

      for (const entry of eligibleEntries) {
        const sendingOrder = entry.type === 'order'
          ? { ...entry.displayOrder, submissionStatus: 'sending' }
          : null
        updateEntry(entry.id, {
          status: 'sending',
          ...(sendingOrder ? { displayOrder: sendingOrder } : {}),
        })
        if (sendingOrder) saveOrder(sendingOrder)

        const controller = new AbortController()
        const timeoutId = window.setTimeout(
          () => controller.abort(),
          REQUEST_TIMEOUT_MS,
        )

        try {
          const result = entry.type === 'order'
            ? await apiRequest('/orders/', {
                method: 'POST',
                token,
                body: entry.payload,
                signal: controller.signal,
              })
            : await apiRequest('/newsletter/subscribe/', {
                method: 'POST',
                body: entry.payload,
                signal: controller.signal,
              })

          if (entry.type === 'order') {
            saveOrder(createReceivedOrder(entry, result))
            notify(`Order ${result.reference} has been received and is awaiting confirmation.`)
          } else {
            notify('Your newsletter subscription has been received.')
          }
          commitQueue(queueRef.current.filter(item => item.id !== entry.id))
        } catch (error) {
          if (isRetryable(error)) {
            const attempts = (entry.attempts || 0) + 1
            const queuedOrder = entry.type === 'order'
              ? { ...entry.displayOrder, submissionStatus: 'queued' }
              : null
            updateEntry(entry.id, {
              status: 'queued',
              attempts,
              nextAttemptAt: Date.now() + getRetryDelay(attempts),
              lastError: error.message,
              ...(queuedOrder ? { displayOrder: queuedOrder } : {}),
            })
            if (queuedOrder) saveOrder(queuedOrder)
            if (attempts === 1) {
              notify(
                entry.type === 'order'
                  ? 'Your order is still pending on this device. We’ll retry when the server is ready.'
                  : 'Your subscription is still pending on this device. We’ll retry when the server is ready.',
                'pending',
              )
            }
          } else {
            const failureMessage = error.message || 'The server rejected this request.'
            const failedOrder = entry.type === 'order'
              ? {
                  ...entry.displayOrder,
                  submissionStatus: 'failed',
                  failureMessage,
                }
              : null
            if (failedOrder) {
              updateEntry(entry.id, {
                status: 'failed',
                failureMessage,
                displayOrder: failedOrder,
              })
              saveOrder(failedOrder)
            } else {
              commitQueue(queueRef.current.filter(item => item.id !== entry.id))
            }
            notify(
              entry.type === 'order'
                ? `Your order could not be submitted: ${failureMessage}`
                : `Your newsletter subscription could not be saved: ${failureMessage}`,
              'error',
            )
          }
        } finally {
          window.clearTimeout(timeoutId)
        }
      }
    } finally {
      isSyncingRef.current = false
    }
  }, [commitQueue, notify, saveOrder, token, updateEntry, userId])

  useEffect(() => {
    const handleOnline = () => { void flushQueue() }
    const handleStorage = event => {
      if (event.key !== QUEUE_STORAGE_KEY) return
      const updatedQueue = readQueue()
      queueRef.current = updatedQueue
      setQueue(updatedQueue)
    }
    const intervalId = window.setInterval(() => { void flushQueue() }, 10_000)

    window.addEventListener('online', handleOnline)
    window.addEventListener('storage', handleStorage)
    void flushQueue()

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('storage', handleStorage)
    }
  }, [flushQueue])

  useEffect(() => {
    void flushQueue()
  }, [flushQueue, queue])

  return (
    <SubmissionQueueContext.Provider value={{
      enqueueOrder,
      enqueueNewsletterSubscription,
      retrySubmission,
    }}>
      {children}
      {notice && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          aria-live={notice.type === 'error' ? 'assertive' : 'polite'}
          className="fixed bottom-4 right-4 z-[200] flex max-w-sm items-start gap-3 border border-stone-200 bg-white p-4 text-sm text-stone-800 shadow-xl"
        >
          <p className="flex-1">{notice.message}</p>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
            className="font-semibold text-stone-500 hover:text-stone-900"
          >
            ×
          </button>
        </div>
      )}
    </SubmissionQueueContext.Provider>
  )
}
