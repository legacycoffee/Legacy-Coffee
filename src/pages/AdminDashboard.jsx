import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  LuAlignCenter,
  LuAlignJustify,
  LuAlignLeft,
  LuAlignRight,
  LuBold,
  LuCaseSensitive,
  LuChevronRight,
  LuCrop,
  LuEraser,
  LuHighlighter,
  LuImage,
  LuItalic,
  LuLink,
  LuList,
  LuListOrdered,
  LuRedo,
  LuSend,
  LuStrikethrough,
  LuStore,
  LuTrash2,
  LuTriangleAlert,
  LuUnderline,
  LuUndo,
} from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import { prepareNewsletterImage } from '../utils/prepareNewsletterImage.js'
import AnalyticsDashboard from '../components/AnalyticsDashboard.jsx'
import NewsletterImageEditor from '../components/NewsletterImageEditor.jsx'

const sections = [
  { id: 'Overview', label: 'Overview' },
  { id: 'Analytics', label: 'Analytics' },
  { id: 'Orders', label: 'Order page' },
  { id: 'Products', label: 'Products' },
  { id: 'Requests', label: 'Requests' },
  { id: 'Users', label: 'Users' },
  { id: 'Subscribers', label: 'Subscribers' },
  { id: 'Newsletter', label: 'Newsletter' },
  { id: 'Settings', label: 'Settings' },
]

const newsletterCommonColors = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark gray', value: '#444444' },
  { name: 'Brown', value: '#5c3a1e' },
  { name: 'Red', value: '#d32f2f' },
  { name: 'Orange', value: '#f58537' },
  { name: 'Yellow', value: '#fbc02d' },
  { name: 'Green', value: '#388e3c' },
  { name: 'Blue', value: '#1976d2' },
  { name: 'Purple', value: '#7b1fa2' },
  { name: 'White', value: '#ffffff' },
]

const newsletterMoreColors = [
  '#ffffff', '#f2f2f2', '#d9d9d9', '#bfbfbf', '#a6a6a6', '#808080', '#595959', '#404040', '#262626', '#000000',
  '#fce4d6', '#f4b183', '#ed7d31', '#c65911', '#843c0c', '#fff2cc', '#ffe699', '#ffd966', '#bf9000', '#7f6000',
  '#d9ead3', '#b6d7a8', '#93c47d', '#6aa84f', '#38761d', '#d0e0e3', '#a2c4c9', '#76a5af', '#45818e', '#134f5c',
  '#deebf7', '#bdd7ee', '#9dc3e6', '#5b9bd5', '#2f75b5', '#203864', '#e4dfec', '#ccc1da', '#a78cc2', '#7030a0',
  '#f4cccc', '#ea9999', '#e06666', '#cc0000', '#990000', '#ead1dc', '#d5a6bd', '#c27ba0', '#a64d79', '#741b47',
  '#fff5f5', '#ffd6d6', '#ffadad', '#ff8585', '#f55', '#d93636', '#a61e1e', '#701010',
  '#fff0e6', '#ffd8bf', '#ffb085', '#ff8c42', '#e66b16', '#c75000', '#943900', '#662500',
  '#fff7cc', '#ffec99', '#ffdf66', '#ffd43b', '#f0b800', '#cc9400', '#997000', '#664b00',
  '#ebfbee', '#c3fae8', '#96f2d7', '#63e6be', '#38d9a9', '#20a878', '#087f5b', '#05543d',
  '#e6fcf5', '#c5f6fa', '#99e9f2', '#66d9e8', '#3bc9db', '#1098ad', '#0b7285', '#064c59',
  '#e7f5ff', '#c5f6fa', '#a5d8ff', '#74c0fc', '#4dabf7', '#228be6', '#1864ab', '#104477',
  '#f3f0ff', '#e5dbff', '#d0bfff', '#b197fc', '#9775fa', '#7950f2', '#5f3dc4', '#452c91',
  '#f8f0fc', '#f3d9fa', '#eebefa', '#e599f7', '#da77f2', '#be4bdb', '#862e9c', '#5f1f70',
  '#fff0f6', '#ffdeeb', '#fcc2d7', '#faa2c1', '#f783ac', '#e64980', '#a61e4d', '#70143a',
  '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#868e96', '#495057', '#212529',
]

const emptyProduct = {
  slug: '',
  name: '',
  coffee_type: 'arabica',
  weight: '',
  price: '',
  wholesale_price: '',
  description: '',
  details: '',
  tasting_notes: '',
  roast: '',
  image: '',
  image_alt: '',
  is_active: true,
}

const orderStatusActions = {
  pending: [
    { status: 'confirmed', label: 'Confirm order' },
    { status: 'cancelled', label: 'Cancel order', destructive: true },
  ],
  confirmed: [
    { status: 'fulfilled', label: 'Mark fulfilled' },
    { status: 'cancelled', label: 'Cancel order', destructive: true },
    { status: 'pending', label: 'Reopen order' },
  ],
  fulfilled: [],
  cancelled: [{ status: 'pending', label: 'Reopen order' }],
}

const paymentMethodLabels = {
  mobile_money: 'Mobile Money',
  bank: 'Bank',
  cash: 'Cash',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Kampala',
  }).format(new Date(value))
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function StatusBadge({ children }) {
  const status = children.toLowerCase()
  const color = status === 'pending' || status === 'new'
    ? 'bg-amber-50 text-amber-800 ring-amber-200'
    : status === 'confirmed' || status === 'in progress'
      ? 'bg-blue-50 text-blue-800 ring-blue-200'
      : status === 'fulfilled' || status === 'resolved'
        ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
        : status === 'cancelled'
          ? 'bg-rose-50 text-rose-800 ring-rose-200'
          : 'bg-stone-100 text-stone-700 ring-stone-200'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${color}`}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center sm:px-5 sm:py-12">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">{description}</p>}
    </div>
  )
}

function SavingButton({ isSaving, savingLabel, children, className, ...props }) {
  return (
    <button disabled={isSaving} className={`${className} disabled:cursor-wait disabled:opacity-60`} {...props}>
      {isSaving && (
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]"
        />
      )}
      {isSaving ? savingLabel : children}
    </button>
  )
}

function NewsletterColorPalette({
  label,
  icon: Icon,
  colors,
  expandedColors,
  isExpanded,
  onToggle,
  onSelect,
  disabled,
  defaultColor,
  showActiveColor = false,
}) {
  const [showMoreColors, setShowMoreColors] = useState(false)
  const [selectedColor, setSelectedColor] = useState(defaultColor)
  const paletteRef = useRef(null)

  useEffect(() => {
    if (!isExpanded) return undefined

    const closeOnOutsideClick = event => {
      if (!paletteRef.current?.contains(event.target)) onToggle()
    }
    const closeOnEscape = event => {
      if (event.key === 'Escape') onToggle()
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isExpanded, onToggle])

  const selectColor = color => {
    setSelectedColor(color)
    onSelect(color)
    onToggle()
  }

  return (
    <div ref={paletteRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isExpanded}
        aria-haspopup="dialog"
        aria-label={label}
        onMouseDown={event => event.preventDefault()}
        onClick={onToggle}
        className="flex h-9 items-center justify-center gap-1 border border-transparent px-1.5 text-stone-700 transition hover:border-stone-200 hover:bg-white hover:text-[#8b4a2b] disabled:opacity-50"
      >
        <span className="relative inline-flex h-5 w-5 items-center justify-center">
          <Icon aria-hidden="true" className="h-4 w-4" />
          {showActiveColor && (
            <span aria-hidden="true" className="absolute bottom-0 h-0.5 w-3 rounded-sm" style={{ backgroundColor: selectedColor }} />
          )}
        </span>
        <span className="text-[11px] font-medium">{label}</span>
        <LuChevronRight
          aria-hidden="true"
          className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>
      {isExpanded && (
        <section
          role="dialog"
          aria-label={`${label} colors`}
          className="absolute left-0 top-full z-[70] mt-1.5 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-stone-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between border-b border-stone-100 pb-2">
            <h2 className="text-xs font-semibold text-stone-800">{label}</h2>
            <span className="font-mono text-[10px] uppercase text-stone-400">{selectedColor}</span>
          </div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Theme colors</p>
          <div role="group" aria-label={`Theme ${label.toLowerCase()} colors`} className="grid grid-cols-10 justify-items-center gap-1">
            {colors.map(color => (
              <button
                key={color.value}
                type="button"
                disabled={disabled}
                title={color.name}
                aria-label={`${label} ${color.name}`}
                onMouseDown={event => event.preventDefault()}
                onClick={() => selectColor(color.value)}
                className="h-5 w-5 rounded-sm border border-stone-300 transition hover:scale-110 hover:ring-2 hover:ring-[#b86638] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b86638] disabled:opacity-50"
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
          <div className="relative mt-2 border-t border-stone-100 pt-1.5">
            <button
              type="button"
              aria-expanded={showMoreColors}
              aria-haspopup="listbox"
              onMouseDown={event => event.preventDefault()}
              onClick={() => setShowMoreColors(current => !current)}
              className="flex min-h-8 w-full items-center justify-between rounded px-1.5 text-left text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              More colors
              <LuChevronRight aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${showMoreColors ? 'rotate-90' : ''}`} />
            </button>
            {showMoreColors && (
              <div
                role="group"
                aria-label={`More ${label.toLowerCase()} colors`}
                className="mt-1 grid max-h-36 grid-cols-10 justify-items-center gap-1 overflow-y-auto rounded border border-stone-200 bg-stone-50 p-2"
              >
                {expandedColors.map((value, index) => (
                  <button
                    key={`${value}-${index}`}
                    type="button"
                    disabled={disabled}
                    title={value}
                    aria-label={`${label} ${value}`}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => selectColor(value)}
                    className="h-4 w-4 rounded-[2px] border border-stone-300 transition hover:scale-125 hover:ring-2 hover:ring-[#b86638] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b86638] disabled:opacity-50"
                    style={{ backgroundColor: value }}
                  />
                ))}
              </div>
            )}
          </div>
          <label className="mt-1 flex min-h-9 cursor-pointer items-center justify-between border-t border-stone-100 pt-2 text-xs font-medium text-stone-700">
            More colors…
            <input
              type="color"
              aria-label={`Custom ${label.toLowerCase()} color`}
              disabled={disabled}
              onMouseDown={event => event.preventDefault()}
              onChange={event => selectColor(event.target.value)}
              className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </section>
      )}
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a75a31]">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-stone-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SearchBox({ value, onChange, label }) {
  return (
    <label className="block w-full min-w-0 sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={label}
        className="w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
      />
    </label>
  )
}

function getCaretRangeAtPoint(x, y) {
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y)
  const caret = document.caretPositionFromPoint?.(x, y)
  if (!caret) return null
  const range = document.createRange()
  range.setStart(caret.offsetNode, caret.offset)
  range.collapse(true)
  return range
}

function getNewsletterDropRange(editor, x, y) {
  const caretRange = getCaretRangeAtPoint(x, y)
  if (caretRange && editor.contains(caretRange.commonAncestorContainer)) return caretRange

  const target = document.elementFromPoint(x, y)
  if (!target || !editor.contains(target)) return null

  const textBlock = target.closest('p, h1, h2, h3, h4, h5, h6, blockquote, li')
  if (textBlock && editor.contains(textBlock)) {
    const range = document.createRange()
    range.selectNodeContents(textBlock)
    range.collapse(y >= textBlock.getBoundingClientRect().top + textBlock.getBoundingClientRect().height / 2)
    return range
  }

  const children = [...editor.children]
  const nearestChild = children.reduce((nearest, child) => {
    const bounds = child.getBoundingClientRect()
    const distance = y < bounds.top ? bounds.top - y : y > bounds.bottom ? y - bounds.bottom : 0
    return !nearest || distance < nearest.distance ? { child, bounds, distance } : nearest
  }, null)
  const range = document.createRange()
  if (nearestChild) {
    range.setStartBefore(nearestChild.child)
    if (y >= nearestChild.bounds.top + nearestChild.bounds.height / 2) {
      range.setStartAfter(nearestChild.child)
    }
  } else {
    range.selectNodeContents(editor)
    range.collapse(false)
  }
  range.collapse(true)
  return range
}

function placeNewsletterImage(editor, image, range) {
  if (!range || !editor.contains(range.commonAncestorContainer)) {
    range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
  }
  range.deleteContents()
  range.insertNode(image)

  const textBlock = image.closest('p, h1, h2, h3, h4, h5, h6, blockquote, li')
  if (!textBlock || textBlock === editor) return null

  const trailingRange = document.createRange()
  trailingRange.selectNodeContents(textBlock)
  trailingRange.setStartAfter(image)
  const followingParagraph = document.createElement('p')
  followingParagraph.append(trailingRange.extractContents())
  if (textBlock.tagName === 'LI') {
    textBlock.append(followingParagraph)
  } else {
    textBlock.insertAdjacentElement('afterend', followingParagraph)
  }
  return followingParagraph
}

function normalizeStyleValue(property, value) {
  const element = document.createElement('span')
  element.style[property] = value
  return element.style[property]
}

function selectionHasStyle(editor, range, property, value) {
  const expected = normalizeStyleValue(property, value)
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
  let selectedText = false
  let allMatch = true
  let textNode = walker.nextNode()

  while (textNode) {
    if (range.intersectsNode(textNode) && textNode.textContent) {
      selectedText = true
      const actual = window.getComputedStyle(textNode.parentElement)[property]
      if (normalizeStyleValue(property, actual) !== expected) allMatch = false
    }
    textNode = walker.nextNode()
  }

  return selectedText && allMatch
}

function NewsletterEditor({ value, onChange, onImageUpload, isUploading, readOnly }) {
  const editorRef = useRef(null)
  const selectedImageRef = useRef(null)
  const editorSelectionRef = useRef(null)
  const draggedImageRef = useRef(null)
  const selectImageRef = useRef(null)
  const publishEditorHtmlRef = useRef(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageAlt, setImageAlt] = useState('')
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [imageError, setImageError] = useState('')
  const [expandedColorPalette, setExpandedColorPalette] = useState('')
  const [linkModal, setLinkModal] = useState(null)
  const [activeFormatting, setActiveFormatting] = useState({})
  const activeFormattingUpdateRef = useRef(null)

  const getEditorHtml = () => {
    if (!editorRef.current) return ''
    const copy = editorRef.current.cloneNode(true)
    copy.querySelectorAll('[data-newsletter-image-selected]').forEach(image => {
      image.removeAttribute('data-newsletter-image-selected')
    })
    copy.querySelectorAll('img').forEach(image => {
      image.removeAttribute('draggable')
    })
    return copy.innerHTML
  }

  const publishEditorHtml = () => {
    if (editorRef.current) onChange(getEditorHtml())
  }

  const updateActiveFormatting = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0) : editorSelectionRef.current
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return

    const textNodes = []
    if (range.collapsed) {
      const container = range.startContainer
      const element = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement
      if (element) textNodes.push(element)
    } else {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node) {
        if (range.intersectsNode(node) && node.textContent) textNodes.push(node.parentElement)
        node = walker.nextNode()
      }
    }

    const allMatch = predicate => textNodes.length > 0 && textNodes.every(predicate)
    const hasStyle = (element, expected) => {
      if (!element) return false
      const style = window.getComputedStyle(element)
      return expected(style, element)
    }
    const hasHighlight = element => {
      let current = element
      while (current && current !== editor) {
        const { backgroundColor } = window.getComputedStyle(current)
        if (backgroundColor !== 'transparent'
          && backgroundColor !== 'rgba(0, 0, 0, 0)'
          && backgroundColor !== 'rgb(255, 255, 255)') return true
        current = current.parentElement
      }
      return false
    }

    const activeBlock = textNodes[0]?.closest('p, h1, h2, h3, blockquote, li, div') || editor
    const textAlign = window.getComputedStyle(activeBlock).textAlign
    setActiveFormatting({
      bold: allMatch(element => hasStyle(element, style => Number.parseInt(style.fontWeight, 10) >= 600)),
      italic: allMatch(element => hasStyle(element, style => style.fontStyle === 'italic')),
      underline: allMatch(element => hasStyle(element, style => style.textDecorationLine.includes('underline'))),
      strikeThrough: allMatch(element => hasStyle(element, style => style.textDecorationLine.includes('line-through'))),
      highlight: allMatch(hasHighlight),
      insertUnorderedList: Boolean(textNodes[0]?.closest('ul')),
      insertOrderedList: Boolean(textNodes[0]?.closest('ol')),
      justifyLeft: textAlign === 'left' || textAlign === 'start',
      justifyCenter: textAlign === 'center',
      justifyRight: textAlign === 'right' || textAlign === 'end',
      justifyFull: textAlign === 'justify',
    })
  }
  const captureEditorSelection = () => {
    const selection = window.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null
    if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
      editorSelectionRef.current = range.cloneRange()
      updateActiveFormatting()
    }
  }

  useEffect(() => {
    activeFormattingUpdateRef.current = updateActiveFormatting
    const handleSelectionChange = () => activeFormattingUpdateRef.current?.()
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      activeFormattingUpdateRef.current = null
    }
  }, [])

  const restoreEditorSelection = () => {
    const editor = editorRef.current
    const range = editorSelectionRef.current?.cloneRange()
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return null

    editor.focus()
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    return range
  }

  const applyInlineStyle = (property, value, command) => {
    const editor = editorRef.current
    const range = restoreEditorSelection()
    if (!editor || !range) return

    if (range.collapsed) {
      document.execCommand(command, false, value)
      captureEditorSelection()
      publishEditorHtml()
      return
    }

    const shouldClear = selectionHasStyle(editor, range, property, value)
    const content = range.extractContents()
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT)
    const selectedTextNodes = []
    let textNode = walker.nextNode()
    while (textNode) {
      if (textNode.textContent) selectedTextNodes.push(textNode)
      textNode = walker.nextNode()
    }

    selectedTextNodes.forEach(node => {
      const wrapper = document.createElement('span')
      wrapper.style[property] = shouldClear
      ? property === 'backgroundColor' ? '#ffffff' : property === 'color' ? '#5c3a1e' : 'inherit'
      : value
      wrapper.append(node.cloneNode())
      node.replaceWith(wrapper)
    })

    const firstNode = content.firstChild
    const lastNode = content.lastChild
    range.insertNode(content)
    if (firstNode && lastNode) {
      range.setStartBefore(firstNode)
      range.setEndAfter(lastNode)
    }

    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    editorSelectionRef.current = range.cloneRange()
    updateActiveFormatting()
    publishEditorHtml()
  }

  const applyBlockStyle = tagName => {
    const range = restoreEditorSelection()
    if (!range) return

    const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer
      : range.startContainer.parentElement
    const currentBlock = startElement?.closest('p, h1, h2, h3, blockquote, li')
    const nextBlock = currentBlock?.tagName.toLowerCase() === tagName ? 'p' : tagName
    document.execCommand('formatBlock', false, nextBlock)
    captureEditorSelection()
    publishEditorHtml()
  }

  useEffect(() => {
    const handlePointerMove = event => {
      const drag = draggedImageRef.current
      if (!drag || drag.pointerId !== event.pointerId) return

      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
      if (!drag.preview && distance < 5) return

      if (!drag.preview) {
        const preview = drag.image.cloneNode(false)
        const bounds = drag.image.getBoundingClientRect()
        preview.removeAttribute('data-newsletter-image-selected')
        preview.style.position = 'fixed'
        preview.style.zIndex = '9999'
        preview.style.pointerEvents = 'none'
        preview.style.opacity = '0.8'
        preview.style.width = `${bounds.width}px`
        preview.style.height = `${bounds.height}px`
        preview.style.maxWidth = 'none'
        preview.style.margin = '0'
        preview.style.left = `${event.clientX + 12}px`
        preview.style.top = `${event.clientY + 12}px`
        document.body.append(preview)
        drag.preview = preview
        drag.image.style.opacity = '0.35'
      } else {
        drag.preview.style.left = `${event.clientX + 12}px`
        drag.preview.style.top = `${event.clientY + 12}px`
      }
      event.preventDefault()
    }

    const finishPointerDrag = (event, shouldDrop) => {
      const drag = draggedImageRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      draggedImageRef.current = null
      drag.preview?.remove()
      drag.image.style.removeProperty('opacity')

      if (!drag.preview || !shouldDrop) return
      const editor = editorRef.current
      if (!editor) return

      let range = getNewsletterDropRange(editor, event.clientX, event.clientY)
      if (!range) return
      if (drag.image.contains(range.startContainer)) {
        const bounds = drag.image.getBoundingClientRect()
        range = document.createRange()
        if (event.clientY < bounds.top + bounds.height / 2) {
          range.setStartBefore(drag.image)
        } else {
          range.setStartAfter(drag.image)
        }
        range.collapse(true)
      }

      drag.image.remove()
      placeNewsletterImage(editor, drag.image, range)
      const caret = document.createRange()
      caret.setStartAfter(drag.image)
      caret.collapse(true)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(caret)
      editorSelectionRef.current = caret.cloneRange()
      editor.focus()
      selectImageRef.current?.({ target: drag.image })
      publishEditorHtmlRef.current?.()
    }

    const handlePointerUp = event => finishPointerDrag(event, true)
    const handlePointerCancel = event => finishPointerDrag(event, false)
    document.addEventListener('pointermove', handlePointerMove, { passive: false })
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', handlePointerCancel)
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('pointercancel', handlePointerCancel)
      draggedImageRef.current?.preview?.remove()
      draggedImageRef.current?.image.style.removeProperty('opacity')
      draggedImageRef.current = null
    }
  }, [readOnly])

  const selectImage = event => {
    const target = event.target
    if (!(target instanceof HTMLImageElement) || !editorRef.current?.contains(target)) {
      selectedImageRef.current?.removeAttribute('data-newsletter-image-selected')
      selectedImageRef.current = null
      setSelectedImage(null)
      setImageAlt('')
      return
    }
    selectedImageRef.current?.removeAttribute('data-newsletter-image-selected')
    target.setAttribute('data-newsletter-image-selected', 'true')
    target.draggable = false
    selectedImageRef.current = target
    const editorStyle = window.getComputedStyle(editorRef.current)
    const editorWidth = editorRef.current.clientWidth
      - Number.parseFloat(editorStyle.paddingLeft)
      - Number.parseFloat(editorStyle.paddingRight)
    const computedStyle = window.getComputedStyle(target)
    const align = computedStyle.marginLeft === 'auto' && computedStyle.marginRight === 'auto'
      ? 'center'
      : computedStyle.marginLeft === 'auto'
        ? 'right'
        : 'left'
    const textFlow = ['left', 'right'].includes(computedStyle.float) ? computedStyle.float : 'none'
    const bounds = target.getBoundingClientRect()
    const naturalHeight = target.naturalWidth
      ? bounds.width * target.naturalHeight / target.naturalWidth
      : bounds.height
    const explicitHeight = Number.parseFloat(target.style.height)
    const heightLimit = Math.max(60, Math.round(naturalHeight))
    setSelectedImage({
      alt: target.alt || '',
      src: target.src,
      width: Math.min(100, Math.max(10, Math.round(bounds.width / editorWidth * 100))),
      height: Math.max(60, Math.round(Number.isFinite(explicitHeight) ? explicitHeight : naturalHeight)),
      heightLimit,
      heightAdjusted: Number.isFinite(explicitHeight) && target.style.height !== 'auto',
      align,
      textFlow,
    })
    setImageAlt(target.alt || '')
    setImageError('')
  }

  useEffect(() => {
    selectImageRef.current = selectImage
    publishEditorHtmlRef.current = publishEditorHtml
  })

  useEffect(() => {
    if (editorRef.current && getEditorHtml() !== value) {
      selectedImageRef.current = null
      setSelectedImage(null)
      editorRef.current.innerHTML = value
    }
  }, [value])

  const insertImage = async (event, asRecommendation = false) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const editor = editorRef.current
    if (!editor) return
    let insertionRange = editorSelectionRef.current?.cloneRange() || null
    if (!insertionRange || !editor.contains(insertionRange.commonAncestorContainer)) {
      const currentSelection = window.getSelection()
      const currentRange = currentSelection?.rangeCount ? currentSelection.getRangeAt(0) : null
      insertionRange = currentRange && editor.contains(currentRange.commonAncestorContainer)
        ? currentRange.cloneRange()
        : document.createRange()
      if (!currentRange || !editor.contains(currentRange.commonAncestorContainer)) {
        insertionRange.selectNodeContents(editor)
        insertionRange.collapse(false)
      }
    }

    try {
      const imageUrl = await onImageUpload(file)
      if (!editor.isConnected) return
      if (!editor.contains(insertionRange.commonAncestorContainer)) {
        insertionRange = document.createRange()
        insertionRange.selectNodeContents(editor)
        insertionRange.collapse(false)
      }

      const image = document.createElement('img')
      image.alt = ''
      image.draggable = false
      image.style.cssText = 'display:block;width:100%;max-width:100%;height:auto;margin:16px 0'
      image.addEventListener('load', () => {
        if (selectedImageRef.current === image) selectImage({ target: image })
      }, { once: true })
      image.src = imageUrl
      let followingParagraph = placeNewsletterImage(editor, image, insertionRange)
      if (!followingParagraph) {
        followingParagraph = document.createElement('p')
        image.insertAdjacentElement('afterend', followingParagraph)
      }

      let caretParagraph = followingParagraph
      if (asRecommendation) {
        const imageBlock = image.closest('p, h1, h2, h3, h4, h5, h6, blockquote, li')
        const recommendation = document.createElement('div')
        recommendation.className = 'newsletter-recommendation'
        recommendation.append(image)

        const title = document.createElement('h3')
        title.className = 'newsletter-recommendation-title'
        recommendation.append(title)

        const description = document.createElement('p')
        description.className = 'newsletter-recommendation-description'
        recommendation.append(description)

        caretParagraph = document.createElement('p')
        caretParagraph.className = 'newsletter-recommendation-continuation'
        recommendation.append(caretParagraph)

        if (imageBlock) {
          imageBlock.insertAdjacentElement('afterend', recommendation)
          if (!imageBlock.textContent.trim() && imageBlock.children.length === 0) imageBlock.remove()
        } else {
          image.insertAdjacentElement('afterend', recommendation)
        }
      }

      const caret = document.createRange()
      caret.setStart(caretParagraph, 0)
      caret.collapse(true)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(caret)
      editorSelectionRef.current = caret.cloneRange()
      editor.focus()
      selectImage({ target: image })
      publishEditorHtml()
    } catch (error) {
      setImageError(error.message)
    }
  }

  const beginImageDrag = event => {
    const image = event.target instanceof HTMLImageElement ? event.target : null
    if (!image || readOnly || event.button !== 0 || !editorRef.current?.contains(image)) return
    event.preventDefault()
    selectImage({ target: image })
    draggedImageRef.current = {
      image,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      preview: null,
    }
  }

  const handleToolbarClick = event => {
    const button = event.target instanceof Element
      ? event.target.closest('button[data-command], button[data-action]')
      : null
    if (!button) return

    if (button.dataset.action === 'highlight') {
      applyInlineStyle('backgroundColor', '#fff1a8', 'hiliteColor')
    } else if (button.dataset.action === 'link') {
      const range = editorSelectionRef.current?.cloneRange()
      if (!range || !editorRef.current?.contains(range.commonAncestorContainer)) {
        setLinkModal({ url: '', text: '', error: '' })
        return
      }

      const selectedText = range.toString()
      const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer.parentElement
      const existingLink = startElement?.closest('a')
      setLinkModal({
        url: existingLink?.getAttribute('href') || '',
        text: selectedText || existingLink?.textContent || '',
        error: '',
      })
    } else if (button.dataset.action === 'clear-formatting') {
      restoreEditorSelection()
      document.execCommand('removeFormat')
      captureEditorSelection()
      publishEditorHtml()
    } else if (button.dataset.command === 'formatBlock') {
      applyBlockStyle(button.dataset.argument)
    } else {
      restoreEditorSelection()
      document.execCommand(button.dataset.command, false, button.dataset.argument || null)
      captureEditorSelection()
      publishEditorHtml()
    }
  }

  const applyNewsletterLink = event => {
    event.preventDefault()
    const urlInput = linkModal?.url.trim()
    if (!urlInput) {
      setLinkModal(current => ({ ...current, error: 'Enter a web address or email link.' }))
      return
    }

    const href = /^[\w.-]+\.[a-z]{2,}(?:[/:?#][^\s]*)?$/i.test(urlInput)
      ? `https://${urlInput}`
      : urlInput
    let parsedUrl
    try {
      parsedUrl = new URL(href)
    } catch {
      setLinkModal(current => ({ ...current, error: 'Enter a valid web address or email link.' }))
      return
    }
    if (!['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
      setLinkModal(current => ({ ...current, error: 'Links must use https, http, or mailto.' }))
      return
    }

    const range = restoreEditorSelection()
    const editor = editorRef.current
    if (!range || !editor) {
      setLinkModal(current => ({ ...current, error: 'Select text in the newsletter before adding a link.' }))
      return
    }

    const enteredText = linkModal.text.trim()
    if (!range.collapsed && enteredText && enteredText !== range.toString()) {
      range.deleteContents()
      const textNode = document.createTextNode(enteredText)
      range.insertNode(textNode)
      range.selectNodeContents(textNode)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }

    const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer
      : range.startContainer.parentElement
    const existingLink = startElement?.closest('a')
    if (existingLink && editor.contains(existingLink)) {
      existingLink.href = href
      existingLink.target = '_blank'
      existingLink.rel = 'noopener noreferrer'
    } else if (range.collapsed) {
      const text = linkModal.text.trim() || href
      const anchor = document.createElement('a')
      anchor.href = href
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.textContent = text
      range.insertNode(anchor)
      range.setStartAfter(anchor)
      range.collapse(true)
    } else {
      document.execCommand('createLink', false, href)
      const selection = window.getSelection()
      const selectedRange = selection?.rangeCount ? selection.getRangeAt(0) : range
      const anchor = (selectedRange.startContainer.nodeType === Node.ELEMENT_NODE
        ? selectedRange.startContainer
        : selectedRange.startContainer.parentElement)?.closest('a')
      if (anchor && editor.contains(anchor)) {
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer'
      }
    }

    const selection = window.getSelection()
    if (selection?.rangeCount) editorSelectionRef.current = selection.getRangeAt(0).cloneRange()
    else editorSelectionRef.current = range.cloneRange()
    setLinkModal(null)
    captureEditorSelection()
    publishEditorHtml()
  }

  const saveImageEdits = async (file, dimensions) => {
    const imageUrl = await onImageUpload(file)
    const image = selectedImageRef.current
    if (!image?.isConnected) throw new Error('The selected image is no longer in the newsletter.')
    const previousStyle = window.getComputedStyle(image)
    const updatedImage = document.createElement('img')
    updatedImage.src = imageUrl
    updatedImage.alt = image.alt
    updatedImage.setAttribute('width', String(dimensions.width))
    updatedImage.setAttribute('height', String(dimensions.height))
    updatedImage.setAttribute('data-newsletter-image-selected', 'true')
    updatedImage.draggable = false
    updatedImage.style.display = 'block'
    updatedImage.style.width = `${selectedImage?.width || 100}%`
    updatedImage.style.maxWidth = '100%'
    updatedImage.style.height = 'auto'
    updatedImage.style.aspectRatio = `${dimensions.width} / ${dimensions.height}`
    updatedImage.style.objectFit = 'fill'
    updatedImage.style.margin = previousStyle.margin
    updatedImage.style.float = previousStyle.float
    const replacementHeightLimit = Math.max(60, Math.round(
      selectedImage?.width
        ? editorRef.current.clientWidth * selectedImage.width / 100 * dimensions.height / dimensions.width
        : dimensions.height,
    ))
    const replacementHeight = selectedImage?.heightAdjusted
      ? Math.min(selectedImage.height, replacementHeightLimit)
      : replacementHeightLimit
    if (selectedImage?.heightAdjusted) {
      updatedImage.style.height = `${replacementHeight}px`
      updatedImage.style.objectFit = 'cover'
    }
    image.replaceWith(updatedImage)
    selectedImageRef.current = updatedImage
    setSelectedImage(current => current ? {
      ...current,
      src: imageUrl,
      ratio: dimensions.width / dimensions.height,
      height: replacementHeight,
      heightLimit: replacementHeightLimit,
      heightAdjusted: current.heightAdjusted,
    } : current)
    publishEditorHtml()
  }

  const updateImageWidth = width => {
    const image = selectedImageRef.current
    if (!image) return
    const maxWidth = selectedImage?.textFlow === 'none' ? 100 : 75
    const nextWidth = Math.min(width, maxWidth)
    image.style.width = `${nextWidth}%`
    image.style.maxWidth = '100%'
    if (!selectedImage?.heightAdjusted) image.style.height = 'auto'
    setSelectedImage(current => current ? { ...current, width: nextWidth } : current)
    publishEditorHtml()
  }

  const updateImageHeight = height => {
    const image = selectedImageRef.current
    if (!image) return
    image.style.height = `${height}px`
    image.style.objectFit = 'cover'
    setSelectedImage(current => current ? {
      ...current,
      height,
      heightAdjusted: true,
    } : current)
    publishEditorHtml()
  }

  const resetImageHeight = () => {
    const image = selectedImageRef.current
    if (!image) return
    image.style.height = 'auto'
    image.style.removeProperty('object-fit')
    setSelectedImage(current => current ? {
      ...current,
      height: current.heightLimit,
      heightAdjusted: false,
    } : current)
    publishEditorHtml()
  }

  const alignSelectedImage = align => {
    const image = selectedImageRef.current
    if (!image) return
    image.style.float = 'none'
    image.style.margin = align === 'center'
      ? '16px auto'
      : align === 'right'
        ? '16px 0 16px auto'
        : '16px auto 16px 0'
    setSelectedImage(current => current ? { ...current, align, textFlow: 'none' } : current)
    publishEditorHtml()
  }

  const setImageTextFlow = textFlow => {
    const image = selectedImageRef.current
    if (!image) return
    const width = Math.min(selectedImage?.width || 45, 75)
    image.style.float = textFlow
    image.style.width = textFlow === 'none' ? `${selectedImage?.width || width}%` : `${width}%`
    image.style.maxWidth = '100%'
    image.style.height = 'auto'
    image.style.margin = textFlow === 'left'
      ? '4px 16px 12px 0'
      : textFlow === 'right'
        ? '4px 0 12px 16px'
        : '16px 0'
    setSelectedImage(current => current ? {
      ...current,
      textFlow,
      width: textFlow === 'none' ? current.width : width,
      align: textFlow === 'right' ? 'right' : 'left',
    } : current)
    publishEditorHtml()
  }

  const deleteSelectedImage = () => {
    selectedImageRef.current?.remove()
    selectedImageRef.current = null
    setSelectedImage(null)
    setIsImageEditorOpen(false)
    publishEditorHtml()
  }

  const handleEditorClick = event => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
    if (anchor && editorRef.current?.contains(anchor)) {
      let destination
      try {
        destination = new URL(anchor.href)
      } catch {
        return
      }

      if (['http:', 'https:'].includes(destination.protocol)) {
        event.preventDefault()
        window.open(destination.href, '_blank', 'noopener,noreferrer')
        return
      }
      if (destination.protocol === 'mailto:') {
        event.preventDefault()
        window.location.assign(destination.href)
        return
      }
    }

    selectImage(event)
  }

  const tools = [
    { label: 'Bold', icon: LuBold, command: 'bold' },
    { label: 'Italic', icon: LuItalic, command: 'italic' },
    { label: 'Underline', icon: LuUnderline, command: 'underline' },
    { label: 'Highlight', text: 'H', action: 'highlight' },
    { label: 'Strikethrough', icon: LuStrikethrough, command: 'strikeThrough' },
    { label: 'Bulleted list', icon: LuList, command: 'insertUnorderedList' },
    { label: 'Numbered list', icon: LuListOrdered, command: 'insertOrderedList' },
    { label: 'Align left', icon: LuAlignLeft, command: 'justifyLeft' },
    { label: 'Center', icon: LuAlignCenter, command: 'justifyCenter' },
    { label: 'Align right', icon: LuAlignRight, command: 'justifyRight' },
    { label: 'Justify', icon: LuAlignJustify, command: 'justifyFull' },
    { label: 'Link', icon: LuLink, action: 'link' },
    { label: 'Undo', icon: LuUndo, command: 'undo' },
    { label: 'Redo', icon: LuRedo, command: 'redo' },
  ]

  return (
    <div className="border border-stone-200 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-stone-200 bg-stone-50 p-2" aria-label="Newsletter formatting tools" onClick={handleToolbarClick}>
        <select
          aria-label="Text style"
          defaultValue=""
          disabled={readOnly}
          onMouseDown={captureEditorSelection}
          onChange={event => {
            if (event.target.value) applyBlockStyle(event.target.value)
            event.target.value = ''
          }}
          className="h-9 max-w-36 border border-stone-200 bg-white px-2 text-xs text-stone-700 outline-none focus:border-[#b86638]"
        >
          <option value="" disabled>Text style</option>
          <option value="p">Paragraph</option>
          <option value="h1">Title</option>
          <option value="h2">Heading 1</option>
          <option value="h3">Heading 2</option>
          <option value="blockquote">Quote</option>
        </select>
        <NewsletterColorPalette
          label="Text color"
          icon={LuCaseSensitive}
          colors={newsletterCommonColors}
          expandedColors={newsletterMoreColors}
          isExpanded={expandedColorPalette === 'text'}
          onToggle={() => setExpandedColorPalette(current => current === 'text' ? '' : 'text')}
          onSelect={color => applyInlineStyle('color', color, 'foreColor')}
          disabled={readOnly}
          defaultColor="#5c3a1e"
          showActiveColor
        />
        <NewsletterColorPalette
          label="Highlight"
          icon={LuHighlighter}
          colors={[
            { name: 'Light yellow', value: '#fff1a8' },
            { name: 'Light orange', value: '#fce4d6' },
            { name: 'Light red', value: '#f4cccc' },
            { name: 'Light green', value: '#d9ead3' },
            { name: 'Light blue', value: '#cfe2f3' },
            { name: 'Light purple', value: '#d9d2e9' },
            { name: 'White', value: '#ffffff' },
          ]}
          expandedColors={newsletterMoreColors}
          isExpanded={expandedColorPalette === 'highlight'}
          onToggle={() => setExpandedColorPalette(current => current === 'highlight' ? '' : 'highlight')}
          onSelect={color => applyInlineStyle('backgroundColor', color, 'hiliteColor')}
          disabled={readOnly}
          defaultColor="#fff1a8"
        />
        {tools.map(({ label, icon: Icon, text, command, argument, action }) => {
          const isToggle = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'].includes(command)
            || action === 'highlight'
          const isActive = Boolean(activeFormatting[command || action])
          return (
            <button
              key={label}
              type="button"
              disabled={readOnly}
              title={label}
              aria-label={label}
              aria-pressed={isToggle ? isActive : undefined}
              data-command={command}
              data-argument={argument}
              data-action={action}
              onMouseDown={event => event.preventDefault()}
              className={`flex h-9 min-w-9 items-center justify-center gap-1 border px-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-[#b86638] ${
                isActive
                  ? 'border-[#b86638] bg-orange-100 text-[#8b4a2b] shadow-inner'
                  : 'border-transparent text-stone-700 hover:border-stone-200 hover:bg-white hover:text-[#8b4a2b]'
              }`}
            >
              {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : text}
            </button>
          )
        })}
        <button
          type="button"
          disabled={readOnly}
          title="Clear text formatting"
          aria-label="Clear text formatting"
          data-action="clear-formatting"
          onMouseDown={event => event.preventDefault()}
          className="flex h-9 min-w-9 items-center justify-center border border-transparent px-2 text-sm text-stone-700 transition hover:border-stone-200 hover:bg-white hover:text-[#8b4a2b]"
        >
          <LuEraser aria-hidden="true" className="h-4 w-4" />
        </button>
        <label
          onMouseDown={event => event.preventDefault()}
          className={`flex h-9 min-w-9 items-center justify-center gap-1 border border-transparent px-2 text-sm font-semibold text-stone-700 transition hover:border-stone-200 hover:bg-white hover:text-[#8b4a2b] focus-within:outline-2 focus-within:outline-[#b86638] ${isUploading || readOnly ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        >
          <LuImage aria-hidden="true" className="h-4 w-4" />
          <span className="hidden text-xs sm:inline">{isUploading ? 'Preparing & uploading…' : 'Image'}</span>
          <input aria-label="Add image" disabled={isUploading || readOnly} type="file" accept="image/jpeg,image/png,image/webp" onChange={insertImage} className="sr-only" />
        </label>
        <label
          title="Add a full-width recommendation image with editable title and description"
          onMouseDown={event => event.preventDefault()}
          className={`flex h-9 items-center justify-center gap-1 border border-transparent px-2 text-sm font-semibold text-stone-700 transition hover:border-stone-200 hover:bg-white hover:text-[#8b4a2b] ${isUploading || readOnly ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        >
          <LuImage aria-hidden="true" className="h-4 w-4" />
          <span className="text-xs">Recommendation</span>
          <input
            aria-label="Add recommendation"
            disabled={isUploading || readOnly}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={event => insertImage(event, true)}
            className="sr-only"
          />
        </label>
      </div>
      {selectedImage && !readOnly && (
        <div className="flex flex-wrap items-end gap-3 border-b border-stone-200 bg-orange-50/60 px-3 py-3">
          <div className="flex min-w-48 flex-1 items-center gap-2">
            <label htmlFor="newsletter-image-width" className="shrink-0 text-xs font-semibold text-stone-600">Image width</label>
            <input
              id="newsletter-image-width"
              aria-label="Image width"
              type="range"
              min="10"
              max={selectedImage.textFlow === 'none' ? 100 : 75}
              step="1"
              value={selectedImage.width}
              onChange={event => updateImageWidth(Number(event.target.value))}
              className="w-full accent-[#c77a4b]"
            />
            <span className="w-10 text-right text-xs tabular-nums text-stone-500">{selectedImage.width}%</span>
          </div>
          <div className="flex min-w-48 flex-1 items-center gap-2">
            <label htmlFor="newsletter-image-height" className="shrink-0 text-xs font-semibold text-stone-600">Image height</label>
            <input
              id="newsletter-image-height"
              aria-label="Image height"
              type="range"
              min={Math.min(60, selectedImage.heightLimit)}
              max={selectedImage.heightLimit}
              step="1"
              value={Math.min(selectedImage.height, selectedImage.heightLimit)}
              onChange={event => updateImageHeight(Number(event.target.value))}
              className="w-full accent-[#c77a4b]"
            />
            <span className="w-12 text-right text-xs tabular-nums text-stone-500">{Math.round(selectedImage.height)}px</span>
            {selectedImage.heightAdjusted && (
              <button
                type="button"
                title="Restore the image's natural height"
                aria-label="Fit image height"
                onMouseDown={event => event.preventDefault()}
                onClick={resetImageHeight}
                className="shrink-0 px-2 py-1 text-xs font-semibold text-[#8b4a2b] hover:bg-white"
              >
                Fit
              </button>
            )}
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="Image alignment">
            {[
              { align: 'left', label: 'Align image left', Icon: LuAlignLeft },
              { align: 'center', label: 'Center image', Icon: LuAlignCenter },
              { align: 'right', label: 'Align image right', Icon: LuAlignRight },
            ].map(({ align, label, Icon }) => (
              <button
                key={align}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={selectedImage.align === align}
                onMouseDown={event => event.preventDefault()}
                onClick={() => alignSelectedImage(align)}
                className={`flex h-9 w-9 items-center justify-center border ${selectedImage.align === align ? 'border-[#f58537] bg-white text-[#8b4a2b]' : 'border-transparent text-stone-700 hover:bg-white'}`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="Text wrapping">
            {[
              { flow: 'none', label: 'No text wrap', text: 'No wrap' },
              { flow: 'left', label: 'Place image left and wrap text beside it', text: 'Wrap left' },
              { flow: 'right', label: 'Place image right and wrap text beside it', text: 'Wrap right' },
            ].map(({ flow, label, text }) => (
              <button
                key={flow}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={selectedImage.textFlow === flow}
                onMouseDown={event => event.preventDefault()}
                onClick={() => setImageTextFlow(flow)}
                className={`flex h-9 items-center justify-center border px-2 text-[11px] font-medium ${selectedImage.textFlow === flow ? 'border-[#f58537] bg-white text-[#8b4a2b]' : 'border-transparent text-stone-700 hover:bg-white'}`}
              >
                {text}
              </button>
            ))}
          </div>
          <label className="min-w-40 flex-1 text-xs font-semibold text-stone-600">
            Image description
            <input
              value={imageAlt}
              onChange={event => {
                setImageAlt(event.target.value)
                if (selectedImageRef.current) selectedImageRef.current.alt = event.target.value
                publishEditorHtml()
              }}
              maxLength={250}
              placeholder="Describe this image"
              className="mt-1 block min-h-9 w-full border border-stone-300 px-2.5 text-sm font-normal text-stone-800 outline-none focus:border-[#c77a4b]"
            />
          </label>
          <button type="button" title="Open full image editor" aria-label="Open full image editor" onMouseDown={event => event.preventDefault()} onClick={() => { setImageError(''); setIsImageEditorOpen(true) }} className="flex h-9 items-center justify-center gap-1.5 bg-[#f58537] px-3 text-xs font-semibold text-white hover:bg-[#d96b25]">
            <LuCrop aria-hidden="true" className="h-4 w-4" />
            <span>More tools</span>
          </button>
          <button type="button" title="Remove image" aria-label="Remove image" onMouseDown={event => event.preventDefault()} onClick={() => {
            deleteSelectedImage()
          }} className="flex h-9 w-9 items-center justify-center text-red-700 hover:bg-red-50">
            <LuTrash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
      {imageError && <p role="alert" className="border-b border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{imageError}</p>}
      {linkModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-950/35 p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setLinkModal(null)
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') setLinkModal(null)
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-link-title"
            onSubmit={applyNewsletterLink}
            className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id="newsletter-link-title" className="text-base font-semibold text-stone-900">
                  {linkModal.url ? 'Edit link' : 'Add link'}
                </h2>
                <p className="mt-1 text-xs text-stone-500">Add a web address or an email link.</p>
              </div>
              <button
                type="button"
                aria-label="Close link dialog"
                onClick={() => setLinkModal(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                ×
              </button>
            </div>
            <label className="block text-xs font-semibold text-stone-700">
              Text to display
              <input
                autoFocus
                value={linkModal.text}
                onChange={event => setLinkModal(current => ({ ...current, text: event.target.value, error: '' }))}
                placeholder="Link text"
                maxLength={500}
                className="mt-1.5 min-h-10 w-full rounded border border-stone-300 px-3 text-sm font-normal text-stone-800 outline-none transition focus:border-[#b86638] focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="mt-3 block text-xs font-semibold text-stone-700">
              Link address
              <input
                type="text"
                inputMode="url"
                value={linkModal.url}
                onChange={event => setLinkModal(current => ({ ...current, url: event.target.value, error: '' }))}
                placeholder="https://example.com"
                aria-invalid={Boolean(linkModal.error)}
                aria-describedby={linkModal.error ? 'newsletter-link-error' : undefined}
                className="mt-1.5 min-h-10 w-full rounded border border-stone-300 px-3 text-sm font-normal text-stone-800 outline-none transition focus:border-[#b86638] focus:ring-2 focus:ring-orange-100"
              />
            </label>
            {linkModal.error && (
              <p id="newsletter-link-error" role="alert" className="mt-2 text-xs font-medium text-red-700">
                {linkModal.error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkModal(null)}
                className="min-h-9 rounded border border-stone-300 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-9 rounded bg-[#8b4a2b] px-4 text-xs font-semibold text-white hover:bg-[#70432d]"
              >
                {linkModal.url ? 'Update link' : 'Insert link'}
              </button>
            </div>
          </form>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        role="textbox"
        aria-label="Newsletter content"
        aria-multiline="true"
        onClick={handleEditorClick}
        onPointerDown={beginImageDrag}
        onDragStart={event => event.preventDefault()}
        onMouseUp={captureEditorSelection}
        onKeyUp={captureEditorSelection}
        onInput={() => {
          captureEditorSelection()
          publishEditorHtml()
        }}
        className={`newsletter-editor min-h-72 px-4 py-4 text-sm leading-7 text-stone-800 outline-none sm:min-h-96 sm:px-6 ${readOnly ? 'bg-stone-50' : 'focus:ring-2 focus:ring-inset focus:ring-orange-100'}`}
        data-placeholder="Write your newsletter here. Select text to format it, or add an image with the toolbar."
      />
      {isImageEditorOpen && selectedImage && (
        <NewsletterImageEditor
          src={selectedImage.src}
          onClose={() => setIsImageEditorOpen(false)}
          onSave={saveImageEdits}
          onDelete={deleteSelectedImage}
          isSaving={isUploading}
        />
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const { token, isAuthenticated, user, signIn, signOut, clearAuth, updateUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSection = searchParams.get('tab')
  const activeTab = sections.some(section => section.id === requestedSection) ? requestedSection : 'Overview'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [dataError, setDataError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [inquiryUpdates, setInquiryUpdates] = useState({})
  const [usersPage, setUsersPage] = useState(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [requestSearch, setRequestSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userPageNumber, setUserPageNumber] = useState(1)
  const [usersPageKey, setUsersPageKey] = useState('')
  const [usersError, setUsersError] = useState('')
  const [subscribersPage, setSubscribersPage] = useState(null)
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [subscriberPageNumber, setSubscriberPageNumber] = useState(1)
  const [subscribersPageKey, setSubscribersPageKey] = useState('')
  const [subscribersError, setSubscribersError] = useState('')
  const [newsletters, setNewsletters] = useState([])
  const [newsletterError, setNewsletterError] = useState('')
  const [newsletterNotice, setNewsletterNotice] = useState('')
  const [deletingNewsletterId, setDeletingNewsletterId] = useState(null)
  const [pendingNewsletterDelete, setPendingNewsletterDelete] = useState(null)
  const [newsletterDeleteError, setNewsletterDeleteError] = useState('')
  const [newsletterSubject, setNewsletterSubject] = useState('')
  const newsletterSubjectInputRef = useRef(null)
  const newsletterExitSubjectInputRef = useRef(null)
  const [newsletterHtml, setNewsletterHtml] = useState('')
  const [newsletterId, setNewsletterId] = useState(null)
  const [newsletterStatus, setNewsletterStatus] = useState('draft')
  const [newsletterSavedSnapshot, setNewsletterSavedSnapshot] = useState({ subject: '', html: '' })
  const [newsletterRecoveryCheckedKey, setNewsletterRecoveryCheckedKey] = useState('')
  const [isNewsletterEditorOpen, setIsNewsletterEditorOpen] = useState(false)
  const [newsletterLoadedToken, setNewsletterLoadedToken] = useState(null)
  const isNewsletterLoading = Boolean(token && activeTab === 'Newsletter' && newsletterLoadedToken !== token)
  const newsletterLocalStorageKey = user?.id ? `legacycoffee:newsletter-draft:${user.id}` : ''
  const hasUnsavedNewsletterChanges = isNewsletterEditorOpen
    && newsletterStatus === 'draft'
    && (
      newsletterSubject !== newsletterSavedSnapshot.subject
      || newsletterHtml !== newsletterSavedSnapshot.html
    )
  const [isNewsletterSaving, setIsNewsletterSaving] = useState(false)
  const [isNewsletterSending, setIsNewsletterSending] = useState(false)
  const [isNewsletterImageUploading, setIsNewsletterImageUploading] = useState(false)
  const [showNewsletterSendConfirmation, setShowNewsletterSendConfirmation] = useState(false)
  const [showNewsletterExitConfirmation, setShowNewsletterExitConfirmation] = useState(false)
  const [pendingNewsletterExitSection, setPendingNewsletterExitSection] = useState(null)
  const [orderStatusUpdates, setOrderStatusUpdates] = useState({})
  const [orderCancellation, setOrderCancellation] = useState(null)
  const [paymentConfirmationOrder, setPaymentConfirmationOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [expandedOrders, setExpandedOrders] = useState({})
  const [productsPage, setProductsPage] = useState(null)
  const [productPageNumber, setProductPageNumber] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [productError, setProductError] = useState('')
  const [productSuccess, setProductSuccess] = useState('')
  const [productStatusNotice, setProductStatusNotice] = useState('')
  const [productPendingUnpublish, setProductPendingUnpublish] = useState(null)
  const [isProductStatusSaving, setIsProductStatusSaving] = useState(false)
  const [productsPageKey, setProductsPageKey] = useState('')
  const [isProductSaving, setIsProductSaving] = useState(false)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [productImageFile, setProductImageFile] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [isProductEditorOpen, setIsProductEditorOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState('')
  const [accountForm, setAccountForm] = useState({ first_name: '', last_name: '' })
  const [isAccountEditing, setIsAccountEditing] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [isAccountSaving, setIsAccountSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [isPasswordEditing, setIsPasswordEditing] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [admins, setAdmins] = useState([])
  const [adminsError, setAdminsError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' })
  const [isNewAdminEditing, setIsNewAdminEditing] = useState(false)
  const [isAdminSaving, setIsAdminSaving] = useState(false)
  const [deletingAdminId, setDeletingAdminId] = useState(null)

  useEffect(() => {
    if (!isSidebarOpen) return undefined

    const handleKeyDown = event => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  useEffect(() => {
    if (!token) return undefined

    let isCurrent = true
    Promise.all([
      apiRequest('/dashboard/', { token }),
      apiRequest('/dashboard/orders/', { token }),
      apiRequest('/dashboard/inquiries/', { token }),
    ])
      .then(([nextSummary, orderPage, inquiryPage]) => {
        if (!isCurrent) return
        setSummary(nextSummary)
        setOrders(orderPage.results)
        setInquiries(inquiryPage.results)
        setDataError('')
      })
      .catch(error => {
        if (isCurrent) setDataError(error.message)
      })

    return () => {
      isCurrent = false
    }
  }, [token])

  useEffect(() => {
    if (!token || activeTab !== 'Users') return undefined

    let isCurrent = true
    setUsersError('')
    const search = userSearch.trim()
    const query = new URLSearchParams({ page: String(userPageNumber) })
    if (search) query.set('search', search)
    const requestKey = `${userPageNumber}:${userSearch}`

    apiRequest(`/dashboard/users/?${query.toString()}`, { token })
      .then(data => {
        if (isCurrent) {
          setUsersPage(data)
          setUsersPageKey(requestKey)
        }
      })
      .catch(error => {
        if (isCurrent) setUsersError(error.message)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, token, userSearch, userPageNumber])

  useEffect(() => {
    if (!token || activeTab !== 'Subscribers') return undefined

    let isCurrent = true
    const query = new URLSearchParams({ page: String(subscriberPageNumber) })
    if (subscriberSearch.trim()) query.set('search', subscriberSearch.trim())
    const requestKey = `${subscriberPageNumber}:${subscriberSearch}`

    apiRequest(`/dashboard/subscribers/?${query.toString()}`, { token })
      .then(data => {
        if (isCurrent) {
          setSubscribersPage(data)
          setSubscribersPageKey(requestKey)
          setSubscribersError('')
        }
      })
      .catch(error => {
        if (isCurrent) setSubscribersError(error.message)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, token, subscriberSearch, subscriberPageNumber])

  useEffect(() => {
    if (!token || activeTab !== 'Newsletter') return undefined

    let isCurrent = true
    apiRequest('/dashboard/newsletters/', { token })
      .then(data => {
        if (isCurrent) {
          setNewsletters(data.results)
          setNewsletterError('')
        }
      })
      .catch(error => {
        if (isCurrent) setNewsletterError(error.message)
      })
      .finally(() => {
        if (isCurrent) setNewsletterLoadedToken(token)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, token])

  useEffect(() => {
    if (
      !newsletterLocalStorageKey
      || activeTab !== 'Newsletter'
      || newsletterLoadedToken !== token
      || newsletterRecoveryCheckedKey === newsletterLocalStorageKey
    ) return

    try {
      const saved = localStorage.getItem(newsletterLocalStorageKey)
      if (saved) {
        const draft = JSON.parse(saved)
        if (!draft || typeof draft !== 'object') {
          throw new Error('The saved draft data is not valid.')
        }
        const linkedDraft = draft.newsletterId == null
          ? null
          : newsletters.find(item => String(item.id) === String(draft.newsletterId))
        const isValidDraft = typeof draft.subject === 'string'
          && typeof draft.html === 'string'
          && (draft.newsletterId == null || linkedDraft?.status === 'draft')

        if (isValidDraft) {
          setNewsletterId(draft.newsletterId ?? null)
          setNewsletterStatus('draft')
          setNewsletterSubject(draft.subject)
          setNewsletterHtml(draft.html)
          setNewsletterSavedSnapshot({
            subject: typeof draft.savedSubject === 'string' ? draft.savedSubject : linkedDraft?.subject || '',
            html: typeof draft.savedHtml === 'string' ? draft.savedHtml : linkedDraft?.content_html || '',
          })
          setNewsletterError('')
          setNewsletterNotice('Recovered your latest local newsletter changes.')
          setIsNewsletterEditorOpen(true)
        } else {
          localStorage.removeItem(newsletterLocalStorageKey)
          if (draft.newsletterId != null) {
            setNewsletterError('A locally saved newsletter draft is no longer available on the server.')
          }
        }
      }
    } catch (error) {
      setNewsletterError(`Could not restore the local newsletter draft: ${error.message}`)
    } finally {
      setNewsletterRecoveryCheckedKey(newsletterLocalStorageKey)
    }
  }, [
    activeTab,
    newsletterLoadedToken,
    newsletterLocalStorageKey,
    newsletterRecoveryCheckedKey,
    newsletters,
    token,
  ])

  useEffect(() => {
    if (
      !newsletterLocalStorageKey
      || newsletterRecoveryCheckedKey !== newsletterLocalStorageKey
      || !isNewsletterEditorOpen
      || newsletterStatus !== 'draft'
    ) return

    try {
      if (!hasUnsavedNewsletterChanges) {
        localStorage.removeItem(newsletterLocalStorageKey)
        return
      }
      localStorage.setItem(newsletterLocalStorageKey, JSON.stringify({
        newsletterId,
        subject: newsletterSubject,
        html: newsletterHtml,
        savedSubject: newsletterSavedSnapshot.subject,
        savedHtml: newsletterSavedSnapshot.html,
        updatedAt: Date.now(),
      }))
    } catch (error) {
      setNewsletterError(`Could not save your local newsletter changes: ${error.message}`)
    }
  }, [
    hasUnsavedNewsletterChanges,
    isNewsletterEditorOpen,
    newsletterHtml,
    newsletterId,
    newsletterLocalStorageKey,
    newsletterRecoveryCheckedKey,
    newsletterSavedSnapshot,
    newsletterStatus,
    newsletterSubject,
  ])

  useEffect(() => {
    if (!token || activeTab !== 'Products') return undefined
    let isCurrent = true
    const query = new URLSearchParams({ page: String(productPageNumber) })
    if (productSearch.trim()) query.set('search', productSearch.trim())
    const requestKey = `${productPageNumber}:${productSearch}`
    apiRequest(`/dashboard/products/?${query.toString()}`, { token })
      .then(data => {
        if (isCurrent) {
          setProductsPage(data)
          setProductsPageKey(requestKey)
          setProductError('')
        }
      })
      .catch(error => {
        if (isCurrent) setProductError(error.message)
      })
    return () => {
      isCurrent = false
    }
  }, [activeTab, token, productPageNumber, productSearch])

  useEffect(() => {
    if (!token || activeTab !== 'Settings') return undefined
    let isCurrent = true
    Promise.all([
      apiRequest('/auth/me/', { token }),
      apiRequest('/dashboard/admins/', { token }),
    ])
      .then(([data, adminPage]) => {
        if (!isCurrent) return
        setAccountForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
        })
        setAdmins(adminPage.results)
        setAdminsError('')
      })
      .catch(error => {
        if (isCurrent) setAdminsError(error.message)
      })
    return () => {
      isCurrent = false
    }
  }, [activeTab, token])

  useEffect(() => () => {
    if (productImagePreview.startsWith('blob:')) URL.revokeObjectURL(productImagePreview)
  }, [productImagePreview])

  const startNewsletter = () => {
    setNewsletterId(null)
    setNewsletterStatus('draft')
    setNewsletterSubject('')
    setNewsletterHtml('')
    setNewsletterSavedSnapshot({ subject: '', html: '' })
    setNewsletterError('')
    setNewsletterNotice('')
    setIsNewsletterEditorOpen(true)
  }

  const editNewsletter = newsletter => {
    setNewsletterId(newsletter.id)
    setNewsletterStatus(newsletter.status)
    setNewsletterSubject(newsletter.subject)
    setNewsletterHtml(newsletter.content_html)
    setNewsletterSavedSnapshot({
      subject: newsletter.subject,
      html: newsletter.content_html,
    })
    setNewsletterError(newsletter.last_error || '')
    setNewsletterNotice('')
    setIsNewsletterEditorOpen(true)
  }

  const clearLocalNewsletterDraft = () => {
    if (!newsletterLocalStorageKey) return
    try {
      localStorage.removeItem(newsletterLocalStorageKey)
    } catch (error) {
      setNewsletterError(`The server action completed, but local recovery data could not be cleared: ${error.message}`)
    }
  }

  const saveNewsletter = async () => {
    if (isNewsletterSaving || isNewsletterImageUploading) return false
    setNewsletterError('')
    setNewsletterNotice('')
    if (!newsletterSubject.trim()) {
      setNewsletterError('Add a subject before saving this newsletter.')
      const subjectInputRef = showNewsletterExitConfirmation
        ? newsletterExitSubjectInputRef
        : newsletterSubjectInputRef
      subjectInputRef.current?.focus()
      return false
    }
    setIsNewsletterSaving(true)
    try {
      const saved = await apiRequest(
        newsletterId ? `/dashboard/newsletters/${newsletterId}/` : '/dashboard/newsletters/',
        {
          method: newsletterId ? 'PATCH' : 'POST',
          token,
          body: { subject: newsletterSubject, content_html: newsletterHtml },
        },
      )
      setNewsletterId(saved.id)
      setNewsletterStatus(saved.status)
      setNewsletterSavedSnapshot({ subject: newsletterSubject, html: newsletterHtml })
      setNewsletters(current => [saved, ...current.filter(newsletter => newsletter.id !== saved.id)])
      setNewsletterNotice('Draft saved. Review the email preview before sending.')
      clearLocalNewsletterDraft()
      return true
    } catch (error) {
      setNewsletterError(error.message)
      return false
    } finally {
      setIsNewsletterSaving(false)
    }
  }

  const uploadNewsletterImage = async file => {
    setNewsletterError('')
    setIsNewsletterImageUploading(true)
    try {
      const preparedImage = await prepareNewsletterImage(file)
      const formData = new FormData()
      formData.append('image', preparedImage)
      const result = await apiRequest('/dashboard/newsletter-images/', {
        method: 'POST',
        token,
        body: formData,
      })
      return result.url
    } catch (error) {
      setNewsletterError(error.message)
      throw error
    } finally {
      setIsNewsletterImageUploading(false)
    }
  }

  const sendNewsletter = async () => {
    if (!newsletterId) return
    setNewsletterError('')
    setNewsletterNotice('')
    setIsNewsletterSending(true)
    try {
      await apiRequest(`/dashboard/newsletters/${newsletterId}/`, {
        method: 'PATCH',
        token,
        body: { subject: newsletterSubject, content_html: newsletterHtml },
      })
      const sent = await apiRequest(`/dashboard/newsletters/${newsletterId}/send/`, {
        method: 'POST',
        token,
      })
      setNewsletterStatus(sent.status)
      setNewsletters(current => current.map(newsletter => newsletter.id === sent.id ? sent : newsletter))
      setNewsletterNotice(`Newsletter sent to ${sent.recipient_count} subscribers.`)
      setShowNewsletterSendConfirmation(false)
      setIsNewsletterEditorOpen(false)
      setNewsletterSavedSnapshot({ subject: newsletterSubject, html: newsletterHtml })
      clearLocalNewsletterDraft()
    } catch (error) {
      setNewsletterError(error.message)
    } finally {
      setIsNewsletterSending(false)
    }
  }

  const deleteNewsletterDraft = async () => {
    if (!newsletterId || newsletterStatus !== 'draft') return
    if (!window.confirm('Delete this newsletter draft? This cannot be undone.')) return
    setNewsletterError('')
    try {
      await apiRequest(`/dashboard/newsletters/${newsletterId}/`, {
        method: 'DELETE',
        token,
      })
      setNewsletters(current => current.filter(newsletter => newsletter.id !== newsletterId))
      setNewsletterNotice('Draft deleted.')
      setIsNewsletterEditorOpen(false)
      setNewsletterId(null)
      clearLocalNewsletterDraft()
    } catch (error) {
      setNewsletterError(error.message)
    }
  }

  const deleteNewsletterFromList = async newsletter => {
    if (newsletter.status !== 'draft' || deletingNewsletterId === newsletter.id) return
    setNewsletterDeleteError('')
    setPendingNewsletterDelete(newsletter)
  }

  const confirmNewsletterListDelete = async () => {
    if (!pendingNewsletterDelete || deletingNewsletterId !== null) return
    const newsletter = pendingNewsletterDelete
    setDeletingNewsletterId(newsletter.id)
    setNewsletterDeleteError('')
    setNewsletterError('')
    setNewsletterNotice('')
    try {
      await apiRequest(`/dashboard/newsletters/${newsletter.id}/`, {
        method: 'DELETE',
        token,
      })
      setNewsletters(current => current.filter(item => item.id !== newsletter.id))
      setNewsletterNotice('Draft deleted.')
      setPendingNewsletterDelete(null)
    } catch (error) {
      setNewsletterDeleteError(`Could not delete the draft: ${error.message}`)
    } finally {
      setDeletingNewsletterId(null)
    }
  }

  const handleLogin = async event => {
    event.preventDefault()
    setLoginError('')
    setDataError('')
    setIsSigningIn(true)
    try {
      const signedInUser = await signIn(credentials)
      if (!signedInUser.is_staff) {
        clearAuth()
        setLoginError('This account does not have administrator access.')
      }
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setIsSigningIn(false)
    }
  }

  const updateOrderStatus = async (order, nextStatus) => {
    setOrderStatusUpdates(current => ({
      ...current,
      [order.reference]: { isSaving: true, error: '', success: '' },
    }))
    try {
      const updatedOrder = await apiRequest(
        `/dashboard/orders/${encodeURIComponent(order.reference)}/status/`,
        { method: 'PATCH', body: { status: nextStatus }, token },
      )
      setOrders(current => current.map(item => (
        item.reference === updatedOrder.reference ? { ...item, ...updatedOrder } : item
      )))
      setSummary(current => {
        if (!current || order.status === updatedOrder.status) return current
        const pendingOrders = current.pending_orders
          + (updatedOrder.status === 'pending' ? 1 : 0)
          - (order.status === 'pending' ? 1 : 0)
        return { ...current, pending_orders: pendingOrders }
      })
      if (nextStatus === 'cancelled') setOrderCancellation(null)
      setOrderStatusUpdates(current => ({
        ...current,
        [order.reference]: { isSaving: false, error: '', success: 'Order status updated.' },
      }))
    } catch (error) {
      setOrderStatusUpdates(current => ({
        ...current,
        [order.reference]: { isSaving: false, error: error.message, success: '' },
      }))
    }
  }

  const markInquiryOpened = async inquiry => {
    setInquiryUpdates(current => ({
      ...current,
      [inquiry.id]: { isSaving: true, error: '' },
    }))
    try {
      const updatedInquiry = await apiRequest(
        `/dashboard/inquiries/${inquiry.id}/open/`,
        { method: 'POST', token },
      )
      setInquiries(current => current.map(item => (
        item.id === updatedInquiry.id ? { ...item, ...updatedInquiry } : item
      )))
      setSummary(current => {
        if (!current || inquiry.status !== 'new' || updatedInquiry.status === 'new') return current
        return { ...current, new_inquiries: Math.max(0, current.new_inquiries - 1) }
      })
      setInquiryUpdates(current => ({
        ...current,
        [inquiry.id]: { isSaving: false, error: '' },
      }))
    } catch (error) {
      setInquiryUpdates(current => ({
        ...current,
        [inquiry.id]: { isSaving: false, error: error.message },
      }))
    }
  }

  const requestOrderStatusUpdate = (order, nextStatus) => {
    if (nextStatus === 'cancelled') {
      setOrderCancellation(order)
      return
    }
    updateOrderStatus(order, nextStatus)
  }

  const updateOrderPayment = async (order, method) => {
    const isPaid = !order.is_paid
    setOrderStatusUpdates(current => ({
      ...current,
      [order.reference]: { isSaving: true, error: '', success: '' },
    }))
    try {
      const updatedOrder = await apiRequest(
        `/dashboard/orders/${encodeURIComponent(order.reference)}/payment/`,
        { method: 'PATCH', body: { is_paid: isPaid, payment_method: isPaid ? method : '' }, token },
      )
      setOrders(current => current.map(item => (
        item.reference === updatedOrder.reference ? { ...item, ...updatedOrder } : item
      )))
      setOrderStatusUpdates(current => ({
        ...current,
        [order.reference]: { isSaving: false, error: '', success: 'Payment status updated.' },
      }))
      setPaymentConfirmationOrder(null)
      setPaymentMethod('')
    } catch (error) {
      setOrderStatusUpdates(current => ({
        ...current,
        [order.reference]: { isSaving: false, error: error.message, success: '' },
      }))
    }
  }

  const startNewProduct = () => {
    setEditingProduct('')
    setProductForm(emptyProduct)
    setProductImageFile(null)
    setProductImagePreview('')
    setProductError('')
    setProductSuccess('')
    setIsProductEditorOpen(true)
  }

  const editProduct = product => {
    setEditingProduct(product.slug)
    setProductForm({
      ...product,
      price: String(product.price),
      wholesale_price: product.wholesale_price ?? '',
    })
    setProductImageFile(null)
    setProductImagePreview(product.image || '')
    setProductError('')
    setProductSuccess('')
    setIsProductEditorOpen(true)
  }

  const saveProduct = async event => {
    event.preventDefault()
    setProductError('')
    setProductSuccess('')
    setIsProductSaving(true)
    const payload = {
      ...productForm,
      slug: productForm.slug.trim(),
      name: productForm.name.trim(),
    }
    if (productImageFile) {
      payload.image = productImageFile
    } else if (payload.wholesale_price === '') {
      payload.wholesale_price = null
    }
    let requestBody = payload
    if (productImageFile) {
      requestBody = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (key !== 'image' && value !== null && value !== undefined) {
          requestBody.append(key, String(value))
        }
      })
      requestBody.append('image', productImageFile)
    }
    try {
      const previousProduct = editingProduct
        ? productsPage?.results.find(product => product.slug === editingProduct)
        : null
      const saved = await apiRequest(
        editingProduct
          ? `/dashboard/products/${encodeURIComponent(editingProduct)}/`
          : '/dashboard/products/',
        { method: editingProduct ? 'PATCH' : 'POST', body: requestBody, token },
      )
      setProductForm({ ...saved, wholesale_price: saved.wholesale_price ?? '' })
      setEditingProduct(saved.slug)
      setProductSuccess(`“${saved.name}” ${editingProduct ? 'updated' : 'created'} successfully.`)
      setSummary(current => current ? {
        ...current,
        products: current.products + (editingProduct ? 0 : 1),
        active_products: current.active_products
          + (saved.is_active ? 1 : 0)
          - (previousProduct?.is_active ? 1 : 0),
      } : current)
      const query = new URLSearchParams({ page: String(productPageNumber) })
      if (productSearch.trim()) query.set('search', productSearch.trim())
      const refreshedPage = await apiRequest(`/dashboard/products/?${query.toString()}`, { token })
      setProductsPage(refreshedPage)
      setProductImageFile(null)
      setProductImagePreview(saved.image)
      setIsProductEditorOpen(false)
    } catch (error) {
      setProductError(error.message)
    } finally {
      setIsProductSaving(false)
    }
  }

  const setProductPublished = async product => {
    if (product.is_active) {
      setProductPendingUnpublish(product)
      return
    }

    await updateProductPublishedStatus(product)
  }

  const updateProductPublishedStatus = async product => {
    setProductError('')
    setProductSuccess('')
    setIsProductStatusSaving(true)
    try {
      const updated = await apiRequest(
        `/dashboard/products/${encodeURIComponent(product.slug)}/`,
        { method: 'PATCH', body: { is_active: !product.is_active }, token },
      )
      setProductsPage(current => current && ({
        ...current,
        results: current.results.map(item => item.slug === updated.slug ? updated : item),
      }))
      setSummary(current => current ? {
        ...current,
        active_products: current.active_products + (updated.is_active ? 1 : -1),
      } : current)
      setProductStatusNotice(`“${updated.name}” ${updated.is_active ? 'published' : 'unpublished'}.`)
      setProductPendingUnpublish(null)
    } catch (error) {
      setProductError(error.message)
    } finally {
      setIsProductStatusSaving(false)
    }
  }

  const deleteProduct = async product => {
    if (!window.confirm(`Permanently delete “${product.name}”? This cannot be undone.`)) return
    setProductError('')
    setProductSuccess('')
    try {
      await apiRequest(`/dashboard/products/${encodeURIComponent(product.slug)}/`, {
        method: 'DELETE',
        token,
      })
      setProductsPage(current => current && ({
        ...current,
        count: Math.max(0, current.count - 1),
        results: current.results.filter(item => item.slug !== product.slug),
      }))
      setSummary(current => current ? {
        ...current,
        products: Math.max(0, current.products - 1),
        active_products: Math.max(0, current.active_products - (product.is_active ? 1 : 0)),
      } : current)
      if (editingProduct === product.slug) startNewProduct()
      setProductSuccess(`“${product.name}” was deleted.`)
    } catch (error) {
      setProductError(error.message)
    }
  }

  const createAdmin = async event => {
    event.preventDefault()
    setAdminsError('')
    setAdminSuccess('')
    setIsAdminSaving(true)
    try {
      const created = await apiRequest('/dashboard/admins/', {
        method: 'POST',
        body: newAdmin,
        token,
      })
      setAdmins(current => [...current, created].sort((first, second) => first.email.localeCompare(second.email)))
      setNewAdmin({ username: '', email: '', password: '' })
      setAdminSuccess(`Administrator ${created.email} was added.`)
      setIsNewAdminEditing(false)
    } catch (error) {
      setAdminsError(error.message)
    } finally {
      setIsAdminSaving(false)
    }
  }

  const removeAdmin = async admin => {
    if (!window.confirm(`Delete administrator ${admin.email}? They will lose admin access immediately.`)) return
    setAdminsError('')
    setAdminSuccess('')
    setDeletingAdminId(admin.id)
    try {
      await apiRequest(`/dashboard/admins/${admin.id}/`, { method: 'DELETE', token })
      setAdmins(current => current.filter(item => item.id !== admin.id))
      setAdminSuccess(`Administrator ${admin.email} was deleted.`)
      if (admin.id === user?.id) await signOut()
    } catch (error) {
      setAdminsError(error.message)
    } finally {
      setDeletingAdminId(null)
    }
  }

  const saveAccount = async event => {
    event.preventDefault()
    setAccountError('')
    setAccountSuccess('')
    setIsAccountSaving(true)
    try {
      const updated = await apiRequest('/auth/me/', {
        method: 'PATCH',
        body: accountForm,
        token,
      })
      updateUser({ ...user, ...updated })
      setAccountSuccess('Your account details were saved.')
      setIsAccountEditing(false)
    } catch (error) {
      setAccountError(error.message)
    } finally {
      setIsAccountSaving(false)
    }
  }

  const changePassword = async event => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setIsPasswordSaving(true)
    try {
      await apiRequest('/auth/change-password/', {
        method: 'POST',
        body: passwordForm,
        token,
      })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordSuccess('Password changed successfully.')
      setIsPasswordEditing(false)
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase()
    if (!query) return orders
    return orders.filter(order => [
      order.reference,
      order.customer_name,
      order.business_name,
      order.customer_email,
      order.customer_phone,
      ...order.items.map(item => item.product_name),
    ].some(value => value?.toLowerCase().includes(query)))
  }, [orders, orderSearch])

  const filteredInquiries = useMemo(() => {
    const query = requestSearch.trim().toLowerCase()
    if (!query) return inquiries
    return inquiries.filter(inquiry => [
      inquiry.subject,
      inquiry.kind,
      inquiry.name,
      inquiry.business_name,
      inquiry.email,
      inquiry.product,
      inquiry.message,
    ].some(value => value?.toLowerCase().includes(query)))
  }, [inquiries, requestSearch])

  const changeUserSearch = value => {
    setUserSearch(value)
    setUserPageNumber(1)
  }
  const isUsersLoading = activeTab === 'Users'
    && usersPageKey !== `${userPageNumber}:${userSearch}`
  const isSubscribersLoading = activeTab === 'Subscribers'
    && subscribersPageKey !== `${subscriberPageNumber}:${subscriberSearch}`
  const isProductLoading = activeTab === 'Products'
    && productsPageKey !== `${productPageNumber}:${productSearch}`
    && !productError

  if (!isAuthenticated || !user?.is_staff) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4eee8] px-4 py-6 sm:px-6 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-[-7rem] h-96 w-96 rounded-full bg-[#f5a66f]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-[#6f4734]/10 blur-3xl" />
        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_30px_90px_rgba(55,36,25,0.16)] md:min-h-[620px] md:grid-cols-[1.02fr_0.98fr]">
          <div className="relative flex min-h-44 flex-col justify-between overflow-hidden bg-[#2b211b] px-6 py-5 text-white sm:min-h-52 sm:px-9 sm:py-7 md:min-h-0 md:p-10 lg:p-14">
            <div aria-hidden="true" className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -right-8 -top-12 h-56 w-56 rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#f58537]/15 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-9 w-auto brightness-0 invert sm:h-10" />
              <span className="h-8 w-px bg-white/20" />
              <div>
                <p className="text-sm font-semibold tracking-wide">LEGACY COFFEE</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">Staff workspace</p>
              </div>
            </div>
            <div className="relative mt-8 max-w-md md:mt-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f6a66f] sm:text-xs">Coffee with a story</p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:mt-4 md:text-4xl lg:text-5xl">
                Good coffee.<br className="hidden sm:block" /> Well managed.
              </h1>
              <p className="mt-2 max-w-sm text-xs leading-5 text-white/65 sm:mt-4 sm:text-sm sm:leading-7">
                Your central workspace for orders, products, customer requests, and the people behind every cup.
              </p>
            </div>
            <p className="relative mt-5 hidden text-xs text-white/40 md:block">A workspace for authorized team members.</p>
          </div>

          <div className="flex flex-col justify-center px-6 py-7 sm:px-10 sm:py-10 md:px-10 lg:px-14">
            <Link to="/" className="mb-7 inline-flex w-fit items-center gap-2 text-xs font-semibold text-stone-500 transition hover:text-[#8b4a2b] sm:mb-10">
              <span aria-hidden="true">←</span> Back to storefront
            </Link>
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fbf2eb] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b4a2b]">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#f58537]" />
                Admin portal
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Welcome back</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
                Sign in with your authorized staff account to open your workspace.
              </p>
            </div>
            {loginError && (
              <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
                {loginError}
              </p>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <label className="block text-sm font-semibold text-stone-700" htmlFor="admin-email">
                Email address
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={credentials.email}
                  onChange={event => setCredentials(current => ({ ...current, email: event.target.value }))}
                  className="mt-2 min-h-12 w-full rounded-none border border-stone-200 bg-[#fcfbfa] px-4 py-3 text-base font-normal text-stone-900 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#b86638] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="you@legacycoffee.com"
                />
              </label>
              <label className="block text-sm font-semibold text-stone-700" htmlFor="admin-password">
                Password
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={event => setCredentials(current => ({ ...current, password: event.target.value }))}
                  className="mt-2 min-h-12 w-full rounded-none border border-stone-200 bg-[#fcfbfa] px-4 py-3 text-base font-normal text-stone-900 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#b86638] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Enter your password"
                />
              </label>
              <button
                disabled={isSigningIn}
                className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-none bg-[#593a27] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(89,58,39,0.18)] transition hover:bg-[#40291d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b86638] disabled:cursor-wait disabled:opacity-60"
              >
                {isSigningIn && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {isSigningIn ? 'Signing in…' : 'Sign in to workspace'}
              </button>
            </form>
            <div className="mt-7 flex items-center justify-center gap-2 border-t border-stone-100 pt-5 text-center text-[11px] text-stone-400">
              <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] text-stone-500">✓</span>
              Access is limited to authorized staff accounts.
            </div>
          </div>
        </div>
      </main>
    )
  }

  const isLoading = !summary && !dataError
  const stats = summary ? [
    { label: 'Total orders', value: summary.orders, note: `${summary.pending_orders} awaiting review` },
    { label: 'Pending orders', value: summary.pending_orders, note: 'Need your attention' },
    { label: 'All requests', value: summary.inquiries, note: `${summary.new_inquiries} new requests` },
    { label: 'New requests', value: summary.new_inquiries, note: 'Messages, enquiries, and reservations' },
    { label: 'Active products', value: summary.active_products, note: `${summary.products} in catalog` },
    { label: 'Subscribers', value: summary.active_subscribers, note: 'Active newsletter subscribers' },
    { label: 'Product shares', value: summary.product_shares, note: 'Customer shares recorded' },
  ] : []

  const navigateToSection = section => {
    setSearchParams(current => {
      const next = new URLSearchParams(current)
      if (section === 'Overview') {
        next.delete('tab')
      } else {
        next.set('tab', section)
      }
      return next
    })
    if (section === 'Products') setProductError('')
    if (section === 'Settings') setAccountError('')
  }

  const requestNewsletterExit = (section = null) => {
    if (hasUnsavedNewsletterChanges || isNewsletterImageUploading) {
      setPendingNewsletterExitSection(section)
      setShowNewsletterExitConfirmation(true)
      return
    }
    setIsNewsletterEditorOpen(false)
    if (section === '__signout__') {
      signOut()
    } else if (section) {
      navigateToSection(section)
    }
  }

  const saveDraftAndExit = async () => {
    const saved = await saveNewsletter()
    if (!saved) return
    setShowNewsletterExitConfirmation(false)
    setIsNewsletterEditorOpen(false)
    const exitTarget = pendingNewsletterExitSection
    setPendingNewsletterExitSection(null)
    if (exitTarget === '__signout__') {
      await signOut()
    } else if (exitTarget) {
      navigateToSection(exitTarget)
    }
  }

  const changeSection = section => {
    if (
      activeTab === 'Newsletter'
      && isNewsletterEditorOpen
      && section !== 'Newsletter'
    ) {
      requestNewsletterExit(section)
      return
    }
    navigateToSection(section)
  }

  return (
    <main className="min-h-screen bg-[#f6f7f8] text-stone-900 lg:flex">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
        />
      )}
      <aside className={`fixed inset-y-0 right-0 z-30 flex w-64 flex-col bg-[#241d18] text-white transition-transform duration-200 ease-out lg:left-0 lg:right-auto lg:z-20 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-9 w-auto brightness-0 invert" />
            <div>
              <p className="text-sm font-semibold">Legacy Coffee</p>
              <p className="mt-0.5 text-[11px] text-white/50">ADMIN PORTAL</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <span className="text-sm font-semibold">Close</span>
          </button>
        </div>

        <div className="px-4 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 sm:px-6 lg:px-5 lg:pt-8">
          Workspace
        </div>
        <nav aria-label="Admin sections" className="flex flex-col gap-1 overflow-y-auto px-3 pb-3">
          {sections.map(({ id, label }) => {
            const isActive = activeTab === id
            const count = id === 'Orders'
              ? summary?.pending_orders
              : id === 'Requests'
                ? summary?.new_inquiries
                : null
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  changeSection(id)
                  setIsSidebarOpen(false)
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${
                  isActive ? 'bg-white/10 font-semibold text-white shadow-inner' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-[#f58537] text-white' : 'bg-white/10 text-white/65'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#49372a] text-xs font-semibold text-[#f6c39f]">
              {(user?.email?.[0] || 'A').toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.email}</p>
              <p className="mt-0.5 text-[10px] text-white/40">Staff account</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'Newsletter' && isNewsletterEditorOpen) requestNewsletterExit('__signout__')
                else signOut()
              }}
              className="rounded-md px-2 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b border-stone-200/80 bg-white/95 px-3 backdrop-blur sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <img src="https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png" alt="Legacy Coffee" className="h-8 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">Legacy Coffee</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a75a31]">Admin Portal · {activeTab}</p>
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-3 sm:flex">
            <span className="text-right">
              <span className="block text-xs font-semibold text-stone-700">{user?.email}</span>
              <span className="block text-[10px] text-stone-400">Admin Portal</span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#593a27] text-xs font-semibold text-white">
              {(user?.email?.[0] || 'A').toUpperCase()}
            </span>
          </div>
          <Link
            to="/"
            aria-label="Switch to storefront"
            title="Storefront"
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#f58537] px-3 text-white shadow-sm transition hover:bg-[#d96b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a75a31]"
          >
            <LuStore aria-hidden="true" className="h-5 w-5" />
            <span className="text-xs font-semibold">Storefront</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(open => !open)}
            aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isSidebarOpen}
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-stone-200 text-stone-700 transition hover:bg-stone-50 lg:hidden"
          >
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-current" />
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-current" />
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-current" />
          </button>
        </header>

        <div className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-5 sm:px-7 sm:py-8 lg:px-10">
          {dataError && (
            <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p>{dataError.toLowerCase().includes('permission') ? 'This account does not have staff access.' : dataError}</p>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'Newsletter' && isNewsletterEditorOpen) requestNewsletterExit('__signout__')
                  else signOut()
                }}
                className="font-semibold underline"
              >
                Sign out
              </button>
            </div>
          )}
          {isLoading && <p role="status" className="mb-5 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500">Loading workspace data…</p>}

          {activeTab === 'Analytics' && <AnalyticsDashboard token={token} />}

          {activeTab === 'Overview' && (
            <section aria-labelledby="overview-heading">
              <SectionHeading
                eyebrow="At a glance"
                title="Dashboard overview"
                description="A clear view of today’s activity across your coffee business."
              />

              <dl className="mb-8 grid grid-cols-2 border-y border-stone-200 sm:grid-cols-4 xl:grid-cols-7">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`flex items-center gap-3 py-4 pr-3 ${index % 2 === 1 ? 'border-l border-stone-200 pl-3 sm:border-l-0 sm:pl-0' : ''} ${
                      index > 1 ? 'border-t border-stone-200 sm:border-t-0' : ''
                    } ${index > 0 && index % 2 === 0 ? 'sm:border-l sm:border-stone-200 sm:pl-4' : ''}`}
                  >
                    <div className="min-w-0">
                      <dd className="text-lg font-bold leading-tight text-stone-900">{stat.value ?? '—'}</dd>
                      <dt className="mt-1 text-[11px] leading-snug text-stone-500">{stat.label}</dt>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900">Recent orders</h2>
                      <p className="mt-0.5 text-xs text-stone-400">Latest activity from your customers</p>
                    </div>
                    <button type="button" onClick={() => changeSection('Orders')} className="text-xs font-semibold text-[#a75a31] hover:text-[#784126]">
                      View orders
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <EmptyState title="No orders yet" description="New customer orders will appear here." />
                  ) : (
                    <ul className="divide-y divide-stone-100 px-5">
                      {orders.slice(0, 5).map(order => (
                        <li key={order.reference} className="flex flex-wrap items-center justify-between gap-3 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            {order.items[0]?.product_image ? (
                              <img
                                src={order.items[0].product_image}
                                alt={order.items[0].product_image_alt || order.items[0].product_name}
                                loading="lazy"
                                className="h-9 w-9 shrink-0 rounded-lg bg-white object-cover"
                              />
                            ) : (
                              <span className="h-9 w-9 shrink-0 rounded-lg bg-orange-50" aria-hidden="true" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-stone-800">{order.customer_name}</p>
                              <p className="mt-0.5 truncate text-xs text-stone-400">{order.reference} · {formatDate(order.created_at)}</p>
                            </div>
                          </div>
                          <div className="ml-auto flex items-center gap-3">
                            <span className="text-right text-sm font-semibold text-stone-800">{formatPrice(order.total)}</span>
                            <StatusBadge>{order.status}</StatusBadge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
                  <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900">Recent requests</h2>
                      <p className="mt-0.5 text-xs text-stone-400">Customer messages, business enquiries, and reservations</p>
                    </div>
                    <button type="button" onClick={() => changeSection('Requests')} className="text-xs font-semibold text-[#a75a31] hover:text-[#784126]">
                      View requests
                    </button>
                  </div>
                  {inquiries.length === 0 ? (
                    <EmptyState title="No requests yet" description="Customer messages, business enquiries, and reservations will show here." />
                  ) : (
                    <ul className="divide-y divide-stone-100 px-5">
                      {inquiries.slice(0, 5).map(inquiry => (
                        <li key={inquiry.id} className="flex items-start justify-between gap-3 py-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-stone-800">{inquiry.subject || `${inquiry.kind} request`}</p>
                            <p className="mt-1 truncate text-xs text-stone-500">{inquiry.name} · {inquiry.email}</p>
                            <p className="mt-1 text-[11px] text-stone-400">{formatDate(inquiry.created_at)}</p>
                          </div>
                          <StatusBadge>{inquiry.status}</StatusBadge>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </section>
          )}

          {activeTab === 'Orders' && (
            <section aria-labelledby="orders-heading">
              <SectionHeading
                eyebrow="Commerce"
                title="Order page"
                description={`${summary?.orders ?? orders.length} orders · ${summary?.pending_orders ?? 0} pending`}
              >
                <SearchBox value={orderSearch} onChange={setOrderSearch} label="Search orders" />
              </SectionHeading>
              {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-stone-200/80 bg-white">
                  <EmptyState
                    title={orderSearch ? 'No matching orders' : 'No orders to show'}
                    description={orderSearch ? 'Try another customer, order number, or product.' : 'Customer orders will appear here when they are placed.'}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <article key={order.reference} className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
                      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:px-5">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {order.items[0]?.product_image ? (
                            <img
                              src={order.items[0].product_image}
                              alt={order.items[0].product_image_alt || order.items[0].product_name}
                              loading="lazy"
                              className="h-10 w-10 shrink-0 rounded-lg bg-white object-cover"
                            />
                          ) : (
                            <span className="h-10 w-10 shrink-0 rounded-lg bg-orange-50" aria-hidden="true" />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h2 className="truncate text-sm font-semibold text-stone-900">{order.customer_name}</h2>
                              {order.business_name && <span className="truncate text-xs text-stone-500">{order.business_name}</span>}
                            </div>
                            <p className="mt-1 truncate text-xs text-stone-400">
                              {order.reference} · {formatDate(order.created_at)} · {order.items.reduce((count, item) => count + item.quantity, 0)} items
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-start">
                          <span className="text-sm font-semibold text-stone-900">{formatPrice(order.total)}</span>
                          <StatusBadge>{order.status}</StatusBadge>
                        </div>
                        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 sm:w-auto sm:flex-1 sm:justify-end sm:border-0 sm:pt-0">
                          <div aria-live="polite" className="min-w-0 text-xs">
                            {orderStatusUpdates[order.reference]?.error && (
                              <p role="alert" className="text-red-700">{orderStatusUpdates[order.reference].error}</p>
                            )}
                            {orderStatusUpdates[order.reference]?.success && (
                              <p role="status" className="text-emerald-700">{orderStatusUpdates[order.reference].success}</p>
                            )}
                          </div>
                          <div className="flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
                            {(orderStatusActions[order.status] || []).map(action => (
                              <button
                                key={action.status}
                                type="button"
                                disabled={orderStatusUpdates[order.reference]?.isSaving}
                                onClick={() => requestOrderStatusUpdate(order, action.status)}
                                className={`min-h-10 flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 sm:flex-none sm:px-3 ${
                                  action.destructive
                                    ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                    : 'bg-[#593a27] text-white hover:bg-[#40291d]'
                                }`}
                              >
                                {orderStatusUpdates[order.reference]?.isSaving ? 'Updating…' : action.label}
                              </button>
                            ))}
                            {order.status === 'fulfilled' && (
                              <>
                                <span className={`self-center rounded-full px-2.5 py-1 text-xs font-semibold ${order.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {order.is_paid ? `Paid · ${paymentMethodLabels[order.payment_method]}` : 'Unpaid'}
                                </span>
                                <button
                                  type="button"
                                  disabled={orderStatusUpdates[order.reference]?.isSaving}
                                  onClick={() => {
                                    setPaymentMethod(order.payment_method || '')
                                    setPaymentConfirmationOrder(order)
                                  }}
                                  className="min-h-10 flex-1 rounded-lg border border-stone-300 px-2.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-wait disabled:opacity-50 sm:flex-none sm:px-3"
                                >
                                  {orderStatusUpdates[order.reference]?.isSaving
                                    ? 'Updating…'
                                    : order.is_paid ? 'Undo paid' : 'Mark as paid'}
                                </button>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label={`${expandedOrders[order.reference] ? 'Hide' : 'Show'} details for order ${order.reference}`}
                            aria-expanded={Boolean(expandedOrders[order.reference])}
                            aria-controls={`order-details-${order.reference}`}
                            onClick={() => setExpandedOrders(current => ({
                              ...current,
                              [order.reference]: !current[order.reference],
                            }))}
                            className="flex h-10 w-full shrink-0 items-center justify-center rounded-lg border border-stone-200 text-sm font-bold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 sm:h-9 sm:w-9"
                          >
                            <span aria-hidden="true" className={`transition-transform ${expandedOrders[order.reference] ? 'rotate-90' : ''}`}>›</span>
                          </button>
                        </div>
                      </div>
                      <div
                        id={`order-details-${order.reference}`}
                        hidden={!expandedOrders[order.reference]}
                        className="border-t border-stone-100"
                      >
                        <div className="grid gap-5 px-4 py-4 sm:grid-cols-2 sm:px-5">
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Customer contact</h3>
                            <a className="mt-2 block break-all text-sm text-[#8b4a2b] hover:underline" href={`mailto:${order.customer_email}`}>
                              {order.customer_email}
                            </a>
                            <a className="mt-1.5 block text-sm text-[#8b4a2b] hover:underline" href={`tel:${order.customer_phone}`}>
                              {order.customer_phone}
                            </a>
                          </div>
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Delivery details</h3>
                            <p className="mt-2 break-words text-sm leading-6 text-stone-600">
                              {order.delivery_address}, {order.delivery_city}{order.delivery_notes && <span className="block text-xs text-stone-400">Note: {order.delivery_notes}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-4 sm:px-5">
                          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Items ordered</h3>
                          <ul className="space-y-2.5">
                            {order.items.map((item, index) => (
                              <li key={`${item.product_name}-${index}`} className="flex min-w-0 items-center gap-3 text-sm">
                                {item.product_image ? (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_image_alt || item.product_name}
                                    loading="lazy"
                                    className="h-11 w-11 shrink-0 rounded-md bg-white object-cover"
                                  />
                                ) : (
                                  <span className="h-11 w-11 shrink-0 rounded-md bg-orange-50" aria-hidden="true" />
                                )}
                                <span className="min-w-0 flex-1 break-words text-stone-700">
                                  {item.product_name} <span className="text-stone-400">({item.weight}) × {item.quantity}</span>
                                </span>
                                <span className="shrink-0 text-right font-medium text-stone-800">
                                  {item.is_wholesale && <span className="mb-1 block rounded bg-[#f2e7dc] px-1.5 py-0.5 text-[10px] font-semibold text-[#80543d]">Wholesale</span>}
                                  {formatPrice(item.line_total)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'Products' && (
            <section aria-labelledby="products-heading">
              {isProductEditorOpen ? (
                <SectionHeading
                  eyebrow="Catalog management"
                  title={editingProduct ? 'Edit product' : 'Add product'}
                  description="Complete the product details and save it to the storefront catalog."
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductEditorOpen(false)
                      setProductError('')
                    }}
                    className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Back to products
                  </button>
                </SectionHeading>
              ) : (
                <SectionHeading
                  eyebrow="Catalog management"
                  title="Products"
                  description={`${productsPage?.count ?? summary?.products ?? 0} products in your catalog`}
                >
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <SearchBox
                      value={productSearch}
                      onChange={value => {
                        setProductSearch(value)
                        setProductPageNumber(1)
                        setProductError('')
                      }}
                      label="Search products"
                    />
                    <button
                      type="button"
                      onClick={startNewProduct}
                      className="min-h-10 shrink-0 rounded-lg bg-[#593a27] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#40291d]"
                    >
                      Add
                    </button>
                  </div>
                </SectionHeading>
              )}

              {productError && (
                <p role="alert" className="mb-4 break-words border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {productError}
                </p>
              )}
              {productSuccess && (
                <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {productSuccess}
                </p>
              )}

              <div className={isProductEditorOpen
                ? 'mx-auto grid w-full max-w-3xl grid-cols-1 items-start gap-5'
                : 'block'
              }>
                {!isProductEditorOpen && <div className="min-w-0">
                  {isProductLoading ? (
                    <p role="status" className="border-y border-stone-200 py-6 text-center text-sm text-stone-500">Loading products…</p>
                  ) : productsPage?.results.length ? (
                    <div className="grid grid-cols-2 items-stretch gap-3 xl:grid-cols-1 xl:gap-0 xl:divide-y xl:border-y xl:border-stone-200 xl:bg-white">
                      {productsPage.results.map(product => (
                        <article key={product.slug} className="flex h-full min-w-0 flex-col gap-2 rounded-lg border border-stone-200 bg-white p-2.5 sm:gap-3 sm:p-3 xl:flex-row xl:items-center xl:rounded-none xl:border-0 xl:p-4">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.image_alt || product.name}
                              loading="lazy"
                              className="aspect-square w-full shrink-0 rounded-lg bg-stone-100 object-cover xl:h-16 xl:w-16"
                            />
                          ) : (
                            <div aria-hidden="true" className="aspect-square w-full shrink-0 rounded-lg bg-stone-100 xl:h-16 xl:w-16" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="break-words text-sm font-semibold text-stone-900">{product.name}</h2>
                              <StatusBadge>{product.is_active ? 'published' : 'unpublished'}</StatusBadge>
                            </div>
                            <p className="mt-1 break-all text-xs text-stone-400">
                              {product.slug} · {product.coffee_type} · {product.weight} · {product.roast}
                            </p>
                            <p className="mt-1 text-sm font-medium text-stone-700">
                              {formatPrice(product.price)}
                              {product.wholesale_price && <span className="ml-2 text-xs text-stone-500">Wholesale {formatPrice(product.wholesale_price)}</span>}
                            </p>
                          </div>
                          <div className="mt-auto grid grid-cols-2 gap-2 pt-2 xl:mt-0 xl:flex xl:flex-wrap xl:justify-end xl:pt-0">
                            <button
                              type="button"
                              onClick={() => editProduct(product)}
                              className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductPublished(product)}
                              className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                            >
                              {product.is_active ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(product)}
                              className="col-span-2 min-h-10 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 sm:col-span-1"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="border-y border-stone-200 bg-white">
                      <EmptyState
                        title={productSearch ? 'No matching products' : 'No products yet'}
                        description={productSearch ? 'Try another product name, slug, or roast.' : 'Add your first product using the form.'}
                      />
                    </div>
                  )}
                  {productsPage && productsPage.count > 20 && (
                    <nav aria-label="Product list pages" className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={!productsPage.previous || isProductLoading}
                        onClick={() => {
                          setProductError('')
                          setProductPageNumber(page => page - 1)
                        }}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-center text-xs text-stone-500">{productsPage.count} products · Page {productPageNumber}</span>
                      <button
                        type="button"
                        disabled={!productsPage.next || isProductLoading}
                        onClick={() => {
                          setProductError('')
                          setProductPageNumber(page => page + 1)
                        }}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </div>}

                {isProductEditorOpen && <form onSubmit={saveProduct} className="min-w-0 space-y-4 border-y border-stone-200 bg-white p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-stone-900">{editingProduct ? 'Edit product' : 'Add a product'}</h2>
                      <p className="mt-1 text-xs leading-5 text-stone-500">Product details appear in the storefront when published.</p>
                    </div>
                    {editingProduct && (
                      <button type="button" onClick={startNewProduct} className="text-xs font-semibold text-[#8b4a2b] hover:underline">
                        Add new
                      </button>
                    )}
                  </div>

                  <div className="relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-4 text-center transition hover:border-[#c77a4b] hover:bg-orange-50/30 focus-within:border-[#c77a4b]">
                    {productImagePreview ? (
                      <img
                        src={productImagePreview}
                        alt={productForm.image_alt || 'Product preview'}
                        className="max-h-56 w-full rounded-lg object-contain"
                      />
                    ) : (
                      <div aria-hidden="true" className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f7efe7] text-2xl text-[#70432d]">
                        +
                      </div>
                    )}
                    <span className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#593a27] px-4 py-2 text-sm font-semibold text-white">
                      {productImagePreview ? 'Choose a different photo' : 'Choose photo'}
                    </span>
                    <span className="mt-2 text-xs text-stone-500">JPEG, PNG, or WebP · maximum 5 MB</span>
                    <input
                      aria-label="Choose product photo"
                      required={!editingProduct && !productForm.image}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={event => {
                        const file = event.target.files?.[0] || null
                        setProductImageFile(file)
                        setProductImagePreview(file ? URL.createObjectURL(file) : productForm.image)
                        setProductError('')
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>

                  <label className="block text-xs font-medium text-stone-700">
                    Product name
                    <input
                      ref={newsletterSubjectInputRef}
                      required
                      value={productForm.name}
                      onChange={event => {
                        const name = event.target.value
                        setProductForm(current => ({
                          ...current,
                          name,
                          ...(!editingProduct ? {
                            slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                          } : {}),
                        }))
                      }}
                      className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Product URL slug
                    <input
                      required
                      disabled={Boolean(editingProduct)}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      title="Use lowercase letters, numbers, and hyphens."
                      value={productForm.slug}
                      onChange={event => setProductForm(current => ({ ...current, slug: event.target.value }))}
                      className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Type of coffee
                    <select
                      required
                      value={productForm.coffee_type}
                      onChange={event => setProductForm(current => ({ ...current, coffee_type: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="arabica">Arabica</option>
                      <option value="robusta">Robusta</option>
                      <option value="blend">Blend</option>
                      <option value="ground">Ground coffee</option>
                      <option value="green">Green beans</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block min-w-0 text-xs font-medium text-stone-700">
                      Package weight
                      <input required value={productForm.weight} onChange={event => setProductForm(current => ({ ...current, weight: event.target.value }))} placeholder="500g" className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                    </label>
                    <label className="block min-w-0 text-xs font-medium text-stone-700">
                      Roast
                      <input required value={productForm.roast} onChange={event => setProductForm(current => ({ ...current, roast: event.target.value }))} placeholder="Medium roast" className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block min-w-0 text-xs font-medium text-stone-700">
                      Retail price (UGX)
                      <input required min="0" step="1" type="number" value={productForm.price} onChange={event => setProductForm(current => ({ ...current, price: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                    </label>
                    <label className="block min-w-0 text-xs font-medium text-stone-700">
                      Wholesale price
                      <input min="0" step="1" type="number" value={productForm.wholesale_price} onChange={event => setProductForm(current => ({ ...current, wholesale_price: event.target.value }))} placeholder="Optional" className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-stone-700">
                    Short description
                    <textarea required rows="2" value={productForm.description} onChange={event => setProductForm(current => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Product details
                    <textarea required rows="3" value={productForm.details} onChange={event => setProductForm(current => ({ ...current, details: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Tasting notes
                    <input required value={productForm.tasting_notes} onChange={event => setProductForm(current => ({ ...current, tasting_notes: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Image description
                    <input required value={productForm.image_alt} onChange={event => setProductForm(current => ({ ...current, image_alt: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="flex min-h-10 items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" checked={productForm.is_active} onChange={event => setProductForm(current => ({ ...current, is_active: event.target.checked }))} className="h-4 w-4 accent-[#593a27]" />
                    Publish this product
                  </label>
                  <SavingButton
                    type="submit"
                    isSaving={isProductSaving}
                    savingLabel={productImageFile ? 'Uploading image and saving…' : 'Saving product…'}
                    className="min-h-11 w-full rounded-lg bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d]"
                  >
                    {editingProduct ? 'Save product' : 'Create product'}
                  </SavingButton>
                </form>}
              </div>
            </section>
          )}

          {activeTab === 'Settings' && (
            <section aria-labelledby="settings-heading" className="max-w-3xl">
              <SectionHeading
                eyebrow="Staff account"
                title="Settings"
                description="Manage your account details and sign-in password."
              />
              {accountError && <p role="alert" className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{accountError}</p>}
              {accountSuccess && <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{accountSuccess}</p>}
              <form onSubmit={saveAccount} className="space-y-5 border-y border-stone-200 bg-white p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">Account details</h2>
                    <p className="mt-1 text-xs text-stone-500">Your email is used to sign in and cannot be changed here.</p>
                  </div>
                  {!isAccountEditing && (
                    <button type="button" onClick={() => setIsAccountEditing(true)} className="min-h-10 shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Edit
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-700">
                    First name
                    <input
                      disabled={!isAccountEditing}
                      value={accountForm.first_name}
                      onChange={event => setAccountForm(current => ({ ...current, first_name: event.target.value }))}
                      maxLength="150"
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                  <label className="block text-sm font-medium text-stone-700">
                    Last name
                    <input
                      disabled={!isAccountEditing}
                      value={accountForm.last_name}
                      onChange={event => setAccountForm(current => ({ ...current, last_name: event.target.value }))}
                      maxLength="150"
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-stone-700">
                  Sign-in email
                  <input value={user?.email || ''} readOnly aria-readonly="true" className="mt-1.5 min-h-11 w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500" />
                </label>
                {isAccountEditing && (
                  <div className="flex flex-wrap gap-2">
                    <SavingButton type="submit" isSaving={isAccountSaving} savingLabel="Saving account…" className="min-h-11 rounded-lg bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#40291d]">
                      Save account details
                    </SavingButton>
                    <button type="button" onClick={() => {
                      setAccountForm({ first_name: user?.first_name || '', last_name: user?.last_name || '' })
                      setAccountError('')
                      setIsAccountEditing(false)
                    }} className="min-h-11 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              <form onSubmit={changePassword} className="mt-6 space-y-4 border-y border-stone-200 bg-white p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">Change password</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500">Choose a strong password that you do not use elsewhere.</p>
                  </div>
                  {!isPasswordEditing && (
                    <button type="button" onClick={() => setIsPasswordEditing(true)} className="min-h-10 shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Edit
                    </button>
                  )}
                </div>
                {passwordError && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{passwordError}</p>}
                {passwordSuccess && <p role="status" className="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{passwordSuccess}</p>}
                {[
                  ['current_password', 'Current password', 'current-password'],
                  ['new_password', 'New password', 'new-password'],
                  ['confirm_password', 'Confirm new password', 'new-password'],
                ].map(([field, label, autocomplete]) => (
                  <label key={field} className="block text-sm font-medium text-stone-700">
                    {label}
                    <input
                      disabled={!isPasswordEditing}
                      required
                      type="password"
                      minLength={field === 'current_password' ? undefined : 8}
                      autoComplete={autocomplete}
                      value={passwordForm[field]}
                      onChange={event => setPasswordForm(current => ({ ...current, [field]: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                ))}
                {isPasswordEditing && (
                  <div className="flex flex-wrap gap-2">
                    <SavingButton type="submit" isSaving={isPasswordSaving} savingLabel="Updating password…" className="min-h-11 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Update password
                    </SavingButton>
                    <button type="button" onClick={() => {
                      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
                      setPasswordError('')
                      setIsPasswordEditing(false)
                    }} className="min-h-11 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              <section aria-labelledby="admin-accounts-heading" className="mt-6 border-y border-stone-200 bg-white p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="admin-accounts-heading" className="text-base font-semibold text-stone-900">Administrator accounts</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Add trusted staff or remove admin access. At least one active administrator must always remain.
                    </p>
                  </div>
                  {!isNewAdminEditing && (
                    <button type="button" onClick={() => setIsNewAdminEditing(true)} className="min-h-10 shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                      Edit
                    </button>
                  )}
                </div>
                {adminsError && <p role="alert" className="mt-4 break-words border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{adminsError}</p>}
                {adminSuccess && <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{adminSuccess}</p>}

                <form onSubmit={createAdmin} className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-stone-700">
                    Username
                    <input
                      disabled={!isNewAdminEditing}
                      required
                      autoComplete="off"
                      value={newAdmin.username}
                      onChange={event => setNewAdmin(current => ({ ...current, username: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                  <label className="block text-xs font-medium text-stone-700">
                    Email address
                    <input
                      disabled={!isNewAdminEditing}
                      required
                      type="email"
                      autoComplete="off"
                      value={newAdmin.email}
                      onChange={event => setNewAdmin(current => ({ ...current, email: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                  <label className="block text-xs font-medium text-stone-700 sm:col-span-2">
                    Temporary password
                    <input
                      disabled={!isNewAdminEditing}
                      required
                      type="password"
                      minLength="8"
                      autoComplete="new-password"
                      value={newAdmin.password}
                      onChange={event => setNewAdmin(current => ({ ...current, password: event.target.value }))}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                    />
                  </label>
                  {isNewAdminEditing && (
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <SavingButton type="submit" isSaving={isAdminSaving} savingLabel="Creating administrator…" className="min-h-11 rounded-lg bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#40291d]">
                        Add administrator
                      </SavingButton>
                      <button type="button" onClick={() => {
                        setNewAdmin({ username: '', email: '', password: '' })
                        setAdminsError('')
                        setIsNewAdminEditing(false)
                      }} className="min-h-11 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                        Cancel
                      </button>
                    </div>
                  )}
                </form>

                <ul className="mt-5 divide-y divide-stone-100 border-y border-stone-100">
                  {admins.map(admin => {
                    const activeAdminCount = admins.filter(item => item.is_active).length
                    const isLastActiveAdmin = admin.is_active && activeAdminCount <= 1
                    return (
                      <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="break-all text-sm font-medium text-stone-800">{admin.email}</p>
                          <p className="mt-0.5 break-all text-xs text-stone-400">
                            @{admin.username}{admin.id === user?.id ? ' · You' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge>{admin.is_active ? 'active' : 'inactive'}</StatusBadge>
                          <button
                            type="button"
                            disabled={isLastActiveAdmin || deletingAdminId === admin.id}
                            title={isLastActiveAdmin ? 'At least one active administrator must remain.' : `Delete ${admin.email}`}
                            onClick={() => removeAdmin(admin)}
                            className="min-h-10 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingAdminId === admin.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </section>
          )}

          {activeTab === 'Newsletter' && (
            <section aria-labelledby="newsletter-heading">
              {isNewsletterEditorOpen ? (
                <>
                  <SectionHeading
                    eyebrow="Audience"
                    title={newsletterStatus === 'sent' ? 'Sent newsletter' : newsletterId ? 'Edit newsletter' : 'New newsletter'}
                    description={newsletterStatus === 'sent'
                      ? `Sent to ${newsletters.find(item => item.id === newsletterId)?.recipient_count ?? 0} subscribers`
                      : ''}
                  >
                    <button
                      type="button"
                      onClick={() => requestNewsletterExit()}
                      className="min-h-10 border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
                    >
                      Back to newsletters
                    </button>
                  </SectionHeading>

                  {newsletterError && (
                    <p role="alert" className="mb-4 break-words border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {newsletterError}
                    </p>
                  )}
                  {newsletterNotice && (
                    <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {newsletterNotice}
                    </p>
                  )}
                  <div>
                    <div className="min-w-0 space-y-4">
                      <label className="block text-sm font-semibold text-stone-700">
                        Email subject
                        <input
                          required
                          maxLength={180}
                          disabled={newsletterStatus === 'sent' || newsletterStatus === 'sending' || isNewsletterSaving}
                          value={newsletterSubject}
                          onChange={event => setNewsletterSubject(event.target.value)}
                          placeholder="A fresh update from Legacy Coffee"
                          className="mt-1.5 min-h-11 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50"
                        />
                      </label>

                      <NewsletterEditor
                        value={newsletterHtml}
                        onChange={setNewsletterHtml}
                        onImageUpload={uploadNewsletterImage}
                        isUploading={isNewsletterImageUploading}
                        readOnly={newsletterStatus === 'sent' || newsletterStatus === 'sending' || isNewsletterSaving}
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        {newsletterStatus === 'draft' && (
                          <>
                            <SavingButton
                              type="button"
                              isSaving={isNewsletterSaving || isNewsletterImageUploading}
                              savingLabel={isNewsletterImageUploading && !isNewsletterSaving ? 'Wait for image upload…' : 'Saving draft…'}
                              onClick={saveNewsletter}
                              className="inline-flex min-h-11 items-center gap-2 bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d]"
                            >
                              Save draft
                            </SavingButton>
                            <button
                              type="button"
                              disabled={!newsletterId || isNewsletterSaving || isNewsletterImageUploading}
                              onClick={() => setShowNewsletterSendConfirmation(true)}
                              className="inline-flex min-h-11 items-center gap-2 bg-[#f58537] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d96b25] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <LuSend aria-hidden="true" className="h-4 w-4" />
                              Send to subscribers
                            </button>
                          </>
                        )}
                        {newsletterStatus === 'sending' && (
                          <p role="status" className="text-sm font-medium text-amber-800">Sending is in progress. Refresh the newsletter list shortly to check the status.</p>
                        )}
                        {newsletterStatus === 'sent' && (
                          <StatusBadge>sent</StatusBadge>
                        )}
                        {newsletterStatus === 'draft' && newsletterId && (
                          <button
                            type="button"
                            disabled={isNewsletterSaving || isNewsletterSending}
                            onClick={deleteNewsletterDraft}
                            className="min-h-11 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete draft
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </>
              ) : (
                <>
                  <SectionHeading
                    eyebrow="Audience"
                    title="Newsletters"
                    description={`${newsletters.length} recent campaigns · ${summary?.active_subscribers ?? 0} active subscribers`}
                  >
                    <button
                      type="button"
                      onClick={startNewsletter}
                      className="min-h-11 w-full bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d] sm:w-auto"
                    >
                      Create newsletter
                    </button>
                  </SectionHeading>
                  {newsletterError && (
                    <p role="alert" className="mb-4 break-words border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      Newsletter error: {newsletterError}
                    </p>
                  )}
                  {newsletterNotice && (
                    <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {newsletterNotice}
                    </p>
                  )}
                  {isNewsletterLoading ? (
                    <p role="status" className="border-y border-stone-200 py-8 text-center text-sm text-stone-500">Loading newsletters…</p>
                  ) : newsletters.length ? (
                    <ul className="divide-y divide-stone-100 border-y border-stone-200 bg-white">
                      {newsletters.map(newsletter => (
                        <li key={newsletter.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-stone-900">{newsletter.subject}</p>
                            <p className="mt-1 text-xs text-stone-500">
                              Updated {formatDate(newsletter.updated_at)}
                              {newsletter.status === 'sent' && newsletter.sent_at ? ` · Sent ${formatDate(newsletter.sent_at)}` : ''}
                              {newsletter.status === 'sent' ? ` · ${newsletter.recipient_count} recipients` : ''}
                            </p>
                            {newsletter.last_error && (
                              <p className="mt-1 text-xs text-red-700">Some deliveries did not complete. Reopen this draft to retry the remaining subscribers.</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                            <StatusBadge>{newsletter.status}</StatusBadge>
                            <button
                              type="button"
                              onClick={() => editNewsletter(newsletter)}
                              className="min-h-10 border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                            >
                              {newsletter.status === 'draft' ? 'Edit draft' : 'View'}
                            </button>
                            {newsletter.status === 'draft' && (
                              <button
                                type="button"
                                disabled={deletingNewsletterId === newsletter.id}
                                aria-label={`Delete draft ${newsletter.subject}`}
                                onClick={() => deleteNewsletterFromList(newsletter)}
                                className="flex min-h-10 items-center justify-center gap-1.5 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                              >
                                {deletingNewsletterId === newsletter.id ? (
                                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                                ) : (
                                  <LuTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
                                )}
                                Delete
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="border-y border-stone-200 bg-white">
                      <EmptyState
                        title="No newsletters yet"
                        description="Create a draft, format your content, preview the email, and send it to active subscribers when ready."
                      />
                    </div>
                  )}
                  {pendingNewsletterDelete && (
                    <div
                      className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-950/45 p-4"
                      onMouseDown={event => {
                        if (event.target === event.currentTarget && deletingNewsletterId === null) {
                          setPendingNewsletterDelete(null)
                          setNewsletterDeleteError('')
                        }
                      }}
                      onKeyDown={event => {
                        if (event.key === 'Escape' && deletingNewsletterId === null) {
                          setPendingNewsletterDelete(null)
                          setNewsletterDeleteError('')
                        }
                      }}
                    >
                      <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-newsletter-title"
                        aria-describedby="delete-newsletter-description"
                        className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-2xl"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                            <LuTrash2 aria-hidden="true" className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <h2 id="delete-newsletter-title" className="text-base font-semibold text-stone-900">
                              Delete newsletter draft?
                            </h2>
                            <p id="delete-newsletter-description" className="mt-1 break-words text-sm leading-6 text-stone-600">
                              {`Delete the draft “${pendingNewsletterDelete.subject}”? This cannot be undone.`}
                            </p>
                          </div>
                        </div>
                        {newsletterDeleteError && (
                          <p role="alert" className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                            {newsletterDeleteError}
                          </p>
                        )}
                        <div className="mt-5 flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={deletingNewsletterId !== null}
                            onClick={() => {
                              setPendingNewsletterDelete(null)
                              setNewsletterDeleteError('')
                            }}
                            className="min-h-10 rounded border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deletingNewsletterId !== null}
                            onClick={confirmNewsletterListDelete}
                            className="inline-flex min-h-10 items-center gap-2 rounded bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
                          >
                            {deletingNewsletterId !== null && (
                              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                            )}
                            Delete draft
                          </button>
                        </div>
                      </section>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeTab === 'Subscribers' && (
            <section aria-labelledby="subscribers-heading">
              <SectionHeading
                eyebrow="Newsletter audience"
                title="Subscribers"
                description={`${subscribersPage?.count ?? summary?.active_subscribers ?? 0} newsletter subscribers`}
              >
                <SearchBox
                  value={subscriberSearch}
                  onChange={value => {
                    setSubscriberSearch(value)
                    setSubscriberPageNumber(1)
                    setSubscribersError('')
                  }}
                  label="Search subscribers"
                />
              </SectionHeading>
              {subscribersError && (
                <p role="alert" className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  Could not load newsletter subscribers: {subscribersError}
                </p>
              )}
              {isSubscribersLoading ? (
                <p role="status" className="border-y border-stone-200 py-6 text-center text-sm text-stone-500">Loading subscribers…</p>
              ) : subscribersPage?.results.length ? (
                <>
                  <ul className="divide-y divide-stone-200 border-y border-stone-200 bg-white">
                    {subscribersPage.results.map(subscriber => (
                      <li key={subscriber.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                        <div className="min-w-0">
                          <a className="break-all text-sm font-semibold text-[#8b4a2b] hover:underline" href={`mailto:${subscriber.email}`}>
                            {subscriber.email}
                          </a>
                          <p className="mt-1 text-xs text-stone-500">
                            Subscribed {formatDate(subscriber.subscribed_at)}
                          </p>
                        </div>
                        <StatusBadge>{subscriber.is_active ? 'active' : 'unsubscribed'}</StatusBadge>
                      </li>
                    ))}
                  </ul>
                  {subscribersPage.count > 20 && (
                    <nav aria-label="Subscriber list pages" className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={!subscribersPage.previous || isSubscribersLoading}
                        onClick={() => setSubscriberPageNumber(page => page - 1)}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-center text-xs text-stone-500">
                        {subscribersPage.count} subscribers · Page {subscriberPageNumber}
                      </span>
                      <button
                        type="button"
                        disabled={!subscribersPage.next || isSubscribersLoading}
                        onClick={() => setSubscriberPageNumber(page => page + 1)}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              ) : (
                <div className="border-y border-stone-200 bg-white">
                  <EmptyState
                    title={subscriberSearch ? 'No matching subscribers' : 'No subscribers yet'}
                    description={subscriberSearch ? 'Try another email address.' : 'New newsletter signups will appear here.'}
                  />
                </div>
              )}
            </section>
          )}

          {activeTab === 'Users' && (
            <section aria-labelledby="users-heading">
              <SectionHeading
                eyebrow="Customer accounts"
                title="Users"
                description={`${usersPage?.count ?? summary?.users ?? 0} customer accounts`}
              >
                <SearchBox value={userSearch} onChange={changeUserSearch} label="Search users" />
              </SectionHeading>
              {usersError && (
                <p role="alert" className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  Could not load customer accounts: {usersError}
                </p>
              )}
              {isUsersLoading ? (
                <p role="status" className="border-y border-stone-200 py-6 text-center text-sm text-stone-500">Loading users…</p>
              ) : usersPage?.results.length ? (
                <>
                  <ul className="divide-y divide-stone-200 border-y border-stone-200 bg-white sm:hidden">
                    {usersPage.results.map(customer => (
                      <li key={customer.id} className="space-y-2.5 px-3 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-stone-800">{customer.name}</p>
                            {customer.email && (
                              <a className="mt-1 block break-all text-xs text-[#8b4a2b] hover:underline" href={`mailto:${customer.email}`}>
                                {customer.email}
                              </a>
                            )}
                            <p className="mt-1 break-all text-xs text-stone-500">{customer.phone || 'Phone not provided'}</p>
                          </div>
                          <StatusBadge>{customer.is_active ? 'active' : 'inactive'}</StatusBadge>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <dt className="text-stone-400">Orders</dt>
                            <dd className="mt-0.5 font-medium text-stone-700">{customer.order_count}</dd>
                          </div>
                          <div>
                            <dt className="text-stone-400">Joined</dt>
                            <dd className="mt-0.5 text-stone-600">{formatDate(customer.date_joined)}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-stone-400">Last sign-in</dt>
                            <dd className="mt-0.5 text-stone-600">{customer.last_login ? formatDate(customer.last_login) : 'Never'}</dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto border-y border-stone-200 bg-white sm:block">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                          <th scope="col" className="px-4 py-3 sm:px-5">Customer</th>
                          <th scope="col" className="px-4 py-3 sm:px-5">Account status</th>
                          <th scope="col" className="px-4 py-3 sm:px-5">Orders</th>
                          <th scope="col" className="px-4 py-3 sm:px-5">Joined</th>
                          <th scope="col" className="px-4 py-3 sm:px-5">Last sign-in</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {usersPage.results.map(customer => (
                          <tr key={customer.id} className="transition-colors hover:bg-stone-50/70">
                            <td className="px-4 py-4 sm:px-5">
                              <p className="font-semibold text-stone-800">{customer.name}</p>
                              {customer.email && (
                                <a className="mt-1 inline-block text-xs text-[#8b4a2b] hover:underline" href={`mailto:${customer.email}`}>
                                  {customer.email}
                                </a>
                              )}
                              <p className="mt-1 text-xs text-stone-500">{customer.phone || 'Phone not provided'}</p>
                            </td>
                            <td className="px-4 py-4 sm:px-5">
                              <StatusBadge>{customer.is_active ? 'active' : 'inactive'}</StatusBadge>
                            </td>
                            <td className="px-4 py-4 font-medium tabular-nums text-stone-700 sm:px-5">{customer.order_count}</td>
                            <td className="px-4 py-4 text-xs text-stone-500 sm:px-5">{formatDate(customer.date_joined)}</td>
                            <td className="px-4 py-4 text-xs text-stone-500 sm:px-5">
                              {customer.last_login ? formatDate(customer.last_login) : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="border-y border-stone-200 bg-white">
                  <EmptyState
                    title={userSearch ? 'No matching users' : 'No customer accounts yet'}
                    description={userSearch ? 'Try another name or email address.' : 'Customer accounts will appear here after they sign up.'}
                  />
                </div>
              )}
              {usersPage && usersPage.count > 20 && (
                <nav aria-label="User list pages" className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={!usersPage.previous || isUsersLoading}
                    onClick={() => setUserPageNumber(page => page - 1)}
                    className="border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-stone-500">
                    {usersPage.count} users · Page {userPageNumber}
                  </span>
                  <button
                    type="button"
                    disabled={!usersPage.next || isUsersLoading}
                    onClick={() => setUserPageNumber(page => page + 1)}
                    className="border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}
            </section>
          )}

          {activeTab === 'Requests' && (
            <section aria-labelledby="requests-heading">
              <SectionHeading
                eyebrow="Customer communication"
                title="Requests inbox"
                description={`${summary?.inquiries ?? inquiries.length} requests · ${summary?.new_inquiries ?? 0} new`}
              >
                <SearchBox value={requestSearch} onChange={setRequestSearch} label="Search requests" />
              </SectionHeading>
              {filteredInquiries.length === 0 ? (
                <div className="rounded-xl border border-stone-200/80 bg-white">
                  <EmptyState
                    title={requestSearch ? 'No matching requests' : 'No requests to show'}
                    description={requestSearch ? 'Try a different name, email, subject, or business.' : 'Customer messages, business enquiries, and reservations will appear here.'}
                  />
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredInquiries.map(inquiry => (
                    <article key={inquiry.id} className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:p-6">
                      <header className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-semibold text-stone-900">{inquiry.subject || `${inquiry.kind} request`}</h2>
                            <StatusBadge>{inquiry.kind}</StatusBadge>
                          </div>
                          <p className="mt-1.5 text-xs text-stone-400">{formatDate(inquiry.created_at)}</p>
                        </div>
                        <StatusBadge>{inquiry.status}</StatusBadge>
                      </header>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-y border-stone-100 py-3 text-xs">
                        <span className="font-semibold text-stone-700">{inquiry.name}</span>
                        <a className="text-[#8b4a2b] hover:underline" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                        {inquiry.phone && <a className="text-[#8b4a2b] hover:underline" href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>}
                      </div>
                      {(inquiry.business_name || inquiry.product || inquiry.quantity) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[inquiry.business_name, inquiry.product, inquiry.quantity].filter(Boolean).map(value => (
                            <span key={value} className="rounded-md bg-stone-100 px-2.5 py-1 text-xs text-stone-600">{value}</span>
                          ))}
                        </div>
                      )}
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-600">{inquiry.message}</p>
                      {inquiry.status === 'new' && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                          {inquiryUpdates[inquiry.id]?.error && (
                            <p role="alert" className="text-sm text-red-700">{inquiryUpdates[inquiry.id].error}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => markInquiryOpened(inquiry)}
                            disabled={inquiryUpdates[inquiry.id]?.isSaving}
                            className="ml-auto rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-[#a75a31] hover:text-[#8b4a2b] disabled:cursor-wait disabled:opacity-50"
                          >
                            {inquiryUpdates[inquiry.id]?.isSaving ? 'Opening…' : 'Mark as opened'}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {showNewsletterExitConfirmation && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/60 p-4">
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="newsletter-exit-confirmation-heading"
                className="w-full max-w-md border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a75a31]">Unsaved newsletter</p>
                <h2 id="newsletter-exit-confirmation-heading" className="mt-2 text-xl font-bold text-stone-900">
                  Save your changes as a draft?
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Your latest changes are stored in this browser. Saving as a draft also stores them with your newsletter account.
                </p>
                <label className="mt-4 block text-sm font-semibold text-stone-700">
                  Email subject
                  <input
                    ref={newsletterExitSubjectInputRef}
                    required
                    maxLength={180}
                    disabled={isNewsletterSaving || isNewsletterImageUploading}
                    value={newsletterSubject}
                    onChange={event => {
                      setNewsletterSubject(event.target.value)
                      setNewsletterError('')
                    }}
                    placeholder="A fresh update from Legacy Coffee"
                    className="mt-1.5 min-h-11 w-full border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#c77a4b] focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50"
                  />
                </label>
                {newsletterError && (
                  <p role="alert" className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {newsletterError}
                  </p>
                )}
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={isNewsletterSaving || isNewsletterImageUploading}
                    onClick={() => {
                      setShowNewsletterExitConfirmation(false)
                      setPendingNewsletterExitSection(null)
                    }}
                    className="min-h-11 border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <SavingButton
                    type="button"
                    isSaving={isNewsletterSaving || isNewsletterImageUploading}
                    savingLabel={isNewsletterImageUploading && !isNewsletterSaving ? 'Finishing image upload…' : 'Saving draft…'}
                    onClick={saveDraftAndExit}
                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#593a27] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d]"
                  >
                    Save draft
                  </SavingButton>
                </div>
              </section>
            </div>
          )}

          {showNewsletterSendConfirmation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="newsletter-send-confirmation-heading"
                className="w-full max-w-md border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a75a31]">Confirm send</p>
                <h2 id="newsletter-send-confirmation-heading" className="mt-2 text-xl font-bold text-stone-900">
                  Email this newsletter?
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  <strong>{newsletterSubject || 'Untitled newsletter'}</strong> will be sent to about{' '}
                  <strong>{summary?.active_subscribers ?? 0} active subscribers</strong>. This cannot be undone.
                </p>
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={isNewsletterSending}
                    onClick={() => setShowNewsletterSendConfirmation(false)}
                    className="min-h-11 border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    Keep editing
                  </button>
                  <SavingButton
                    type="button"
                    isSaving={isNewsletterSending}
                    savingLabel="Sending newsletter…"
                    onClick={sendNewsletter}
                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#f58537] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d96b25]"
                  >
                    <LuSend aria-hidden="true" className="h-4 w-4" />
                    Send newsletter
                  </SavingButton>
                </div>
              </section>
            </div>
          )}

          {productPendingUnpublish && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 p-4"
              onMouseDown={event => {
                if (event.target === event.currentTarget && !isProductStatusSaving) setProductPendingUnpublish(null)
              }}
            >
              <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="product-unpublish-heading"
                aria-describedby="product-unpublish-description"
                className="w-full max-w-md border border-rose-200 bg-white p-6 shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <LuTriangleAlert aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Confirm unpublish</p>
                    <h2 id="product-unpublish-heading" className="mt-2 text-xl font-bold text-stone-900">
                      Unpublish “{productPendingUnpublish.name}”?
                    </h2>
                    <p id="product-unpublish-description" className="mt-2 text-sm leading-6 text-stone-600">
                      This product will no longer appear in the storefront. You can publish it again later.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={isProductStatusSaving}
                    onClick={() => setProductPendingUnpublish(null)}
                    className="min-h-11 border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProductStatusSaving}
                    onClick={() => updateProductPublishedStatus(productPendingUnpublish)}
                    className="min-h-11 bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"
                  >
                    {isProductStatusSaving ? 'Unpublishing…' : 'Unpublish product'}
                  </button>
                </div>
              </section>
            </div>
          )}

          {productStatusNotice && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 p-4"
              onMouseDown={event => {
                if (event.target === event.currentTarget) setProductStatusNotice('')
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-published-heading"
                className="w-full max-w-md border border-stone-200 bg-white p-6 shadow-2xl"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Product status updated</p>
                <h2 id="product-published-heading" className="mt-2 text-xl font-bold text-stone-900">
                  {productStatusNotice}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  The product visibility in the storefront has been updated.
                </p>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setProductStatusNotice('')}
                    className="min-h-11 bg-[#593a27] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40291d]"
                  >
                    Done
                  </button>
                </div>
              </section>
            </div>
          )}

          {paymentConfirmationOrder && (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/65 p-4 backdrop-blur-sm"
              onMouseDown={event => {
                if (event.target === event.currentTarget && !orderStatusUpdates[paymentConfirmationOrder.reference]?.isSaving) {
                  setPaymentConfirmationOrder(null)
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-confirmation-heading"
                aria-describedby="payment-confirmation-description"
                className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
              >
                <div className="p-5 sm:p-6">
                  <p className={`text-xs font-bold uppercase tracking-[0.16em] ${paymentConfirmationOrder.is_paid ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {paymentConfirmationOrder.is_paid ? 'Undo payment confirmation' : 'Record payment'}
                  </p>
                  <h2 id="payment-confirmation-heading" className="mt-2 text-xl font-bold text-stone-900">
                    {paymentConfirmationOrder.is_paid ? 'Mark this order as unpaid?' : 'Confirm payment received?'}
                  </h2>
                  <p id="payment-confirmation-description" className="mt-2 text-sm leading-6 text-stone-600">
                    {paymentConfirmationOrder.is_paid
                      ? 'This removes the paid marker from the accounting summary. You can mark the order as paid again later.'
                      : 'Only continue if payment has actually been received. This will update the paid totals in Accounting.'}
                  </p>
                  <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Fulfilled order</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold text-stone-800">{paymentConfirmationOrder.reference}</span>
                      <span className="text-sm font-semibold text-stone-900">{formatPrice(paymentConfirmationOrder.total)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-stone-500">{paymentConfirmationOrder.customer_name}</p>
                  </div>
                  {!paymentConfirmationOrder.is_paid ? (
                    <fieldset className="mt-5">
                      <legend className="text-sm font-semibold text-stone-800">How was the payment received?</legend>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {[
                          { value: 'mobile_money', label: 'Mobile Money' },
                          { value: 'bank', label: 'Bank' },
                          { value: 'cash', label: 'Cash' },
                        ].map(method => (
                          <label
                            key={method.value}
                            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-semibold transition ${
                              paymentMethod === method.value
                                ? 'border-[#593a27] bg-[#f7f0e9] text-[#593a27]'
                                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment-method"
                              value={method.value}
                              checked={paymentMethod === method.value}
                              onChange={event => setPaymentMethod(event.target.value)}
                              className="sr-only"
                            />
                            {method.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : (
                    <p className="mt-4 text-sm text-stone-600">
                      Recorded as paid by <strong>{paymentMethodLabels[paymentConfirmationOrder.payment_method]}</strong>.
                    </p>
                  )}
                  {orderStatusUpdates[paymentConfirmationOrder.reference]?.error && (
                    <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                      {orderStatusUpdates[paymentConfirmationOrder.reference].error}
                    </p>
                  )}
                  <div className="mt-6 flex flex-row justify-end gap-2">
                    <button
                      type="button"
                      disabled={orderStatusUpdates[paymentConfirmationOrder.reference]?.isSaving}
                      onClick={() => setPaymentConfirmationOrder(null)}
                      className="min-h-11 min-w-0 flex-1 whitespace-nowrap rounded-lg border border-stone-300 px-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      autoFocus
                      disabled={orderStatusUpdates[paymentConfirmationOrder.reference]?.isSaving || (!paymentConfirmationOrder.is_paid && !paymentMethod)}
                      onClick={() => updateOrderPayment(paymentConfirmationOrder, paymentMethod)}
                      className={`min-h-11 min-w-0 flex-1 whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-white transition disabled:cursor-wait disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm ${
                        paymentConfirmationOrder.is_paid ? 'bg-amber-700 hover:bg-amber-800' : 'bg-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      {orderStatusUpdates[paymentConfirmationOrder.reference]?.isSaving
                        ? 'Updating payment…'
                        : paymentConfirmationOrder.is_paid ? 'Confirm as unpaid' : 'Confirm payment received'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {orderCancellation && (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/65 p-4 backdrop-blur-sm"
              onMouseDown={event => {
                if (event.target === event.currentTarget && !orderStatusUpdates[orderCancellation.reference]?.isSaving) {
                  setOrderCancellation(null)
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="order-cancellation-heading"
                aria-describedby="order-cancellation-description"
                className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
              >
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">Cancel order</p>
                  <h2 id="order-cancellation-heading" className="mt-2 text-xl font-bold text-stone-900">
                    Cancel this order?
                  </h2>
                  <p id="order-cancellation-description" className="mt-2 text-sm leading-6 text-stone-600">
                    The order will be marked cancelled and its value will be excluded from non-cancelled order totals. You can reopen it later.
                  </p>
                  <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Order to cancel</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold text-stone-800">{orderCancellation.reference}</span>
                      <span className="text-sm font-semibold text-stone-900">{formatPrice(orderCancellation.total)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-stone-500">{orderCancellation.customer_name}</p>
                  </div>
                  {orderStatusUpdates[orderCancellation.reference]?.error && (
                    <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                      {orderStatusUpdates[orderCancellation.reference].error}
                    </p>
                  )}
                  <div className="mt-6 flex flex-row justify-end gap-2">
                    <button
                      type="button"
                      disabled={orderStatusUpdates[orderCancellation.reference]?.isSaving}
                      onClick={() => setOrderCancellation(null)}
                      className="min-h-11 min-w-0 flex-1 whitespace-nowrap rounded-lg border border-stone-300 px-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm"
                    >
                      Keep order
                    </button>
                    <button
                      type="button"
                      autoFocus
                      disabled={orderStatusUpdates[orderCancellation.reference]?.isSaving}
                      onClick={() => updateOrderStatus(orderCancellation, 'cancelled')}
                      className="min-h-11 min-w-0 flex-1 whitespace-nowrap rounded-lg bg-rose-700 px-2 text-xs font-semibold text-white transition hover:bg-rose-800 disabled:cursor-wait disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm"
                    >
                      {orderStatusUpdates[orderCancellation.reference]?.isSaving ? 'Cancelling…' : 'Cancel order'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          <footer className="mt-10 border-t border-stone-200 pt-4 text-xs text-stone-400">
            Legacy Coffee · Staff workspace
          </footer>
        </div>
      </div>
    </main>
  )
}
