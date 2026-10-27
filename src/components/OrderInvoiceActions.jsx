import { useEffect, useState } from 'react'
import { LuDownload, LuEye, LuX } from 'react-icons/lu'
import { API_BASE_URL } from '../context/api.js'

export default function OrderInvoiceActions({ reference, token }) {
  const [pdfUrl, setPdfUrl] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
  }, [pdfUrl])

  const handleInvoiceAction = async action => {
    setError('')
    setIsLoading(true)
    try {
      let documentUrl = pdfUrl
      if (!documentUrl) {
        const response = await fetch(
          `${API_BASE_URL}/orders/${encodeURIComponent(reference)}/invoice/`,
          { headers: { Authorization: `Token ${token}` } },
        )
        if (!response.ok) {
          let message = `Could not load the invoice (HTTP ${response.status}).`
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const data = await response.json()
            message = data.detail || Object.values(data).flat().join(' ') || message
          }
          throw new Error(message)
        }
        if (!(response.headers.get('content-type') || '').includes('application/pdf')) {
          throw new Error('The server did not return a PDF invoice.')
        }
        const blob = await response.blob()
        if (!blob.size) throw new Error('The generated invoice is empty.')
        documentUrl = URL.createObjectURL(blob)
        setPdfUrl(documentUrl)
      }

      if (action === 'preview') {
        setIsPreviewOpen(true)
      } else {
        const downloadLink = document.createElement('a')
        downloadLink.href = documentUrl
        downloadLink.download = `invoice-${reference}.pdf`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        downloadLink.remove()
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleInvoiceAction('preview')}
          disabled={isLoading}
          className="inline-flex items-center gap-2 border border-peach-mid px-3 py-2 text-sm font-semibold text-brown transition-colors hover:bg-peach-light disabled:cursor-wait disabled:opacity-60"
        >
          <LuEye aria-hidden="true" className="h-4 w-4" />
          Preview invoice
        </button>
        <button
          type="button"
          onClick={() => handleInvoiceAction('download')}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60"
        >
          <LuDownload aria-hidden="true" className="h-4 w-4" />
          Download PDF
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {isPreviewOpen && pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`invoice-preview-${reference}`}
            className="flex h-[92vh] w-full max-w-5xl flex-col bg-white shadow-xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-peach-mid/40 px-4 py-3">
              <h2 id={`invoice-preview-${reference}`} className="font-bold text-brown">
                Invoice {reference}
              </h2>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                aria-label="Close invoice preview"
                className="flex h-9 w-9 items-center justify-center text-brown hover:bg-peach-light"
              >
                <LuX aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>
            <iframe title={`Invoice ${reference} PDF preview`} src={pdfUrl} className="min-h-0 flex-1" />
          </section>
        </div>
      )}
    </>
  )
}
