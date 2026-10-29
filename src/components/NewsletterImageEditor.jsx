import { useEffect, useRef, useState } from 'react'
import {
  LuAlignCenter,
  LuAlignVerticalJustifyCenter,
  LuArrowDown,
  LuArrowLeft,
  LuArrowRight,
  LuArrowUp,
  LuCheck,
  LuCrop,
  LuFlipHorizontal,
  LuFlipVertical,
  LuRotateCcw,
  LuRotateCw,
  LuUndo2,
  LuRedo2,
  LuZoomIn,
  LuZoomOut,
} from 'react-icons/lu'

const MIN_SIZE = 8
const MAX_IMAGE_PIXELS = 40000000

function getImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      if (image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
        reject(new Error('Choose an image with no more than 40 megapixels.'))
        return
      }
      resolve(image)
    }
    image.onerror = () => reject(new Error('This image could not be loaded in the editor.'))
    image.src = src
  })
}

function createInitialState(width, height) {
  return {
    canvasWidth: width,
    canvasHeight: height,
    imageX: 0,
    imageY: 0,
    imageWidth: width,
    imageHeight: height,
    rotation: 0,
    flipX: false,
    flipY: false,
    crop: { x: 0, y: 0, width, height },
    cropMode: false,
    aspectLocked: true,
  }
}

function getRotatedBounds(state) {
  const radians = (state.rotation * Math.PI) / 180
  const width = Math.abs(state.imageWidth * Math.cos(radians)) + Math.abs(state.imageHeight * Math.sin(radians))
  const height = Math.abs(state.imageWidth * Math.sin(radians)) + Math.abs(state.imageHeight * Math.cos(radians))
  return {
    x: state.imageX + (state.imageWidth - width) / 2,
    y: state.imageY + (state.imageHeight - height) / 2,
    width,
    height,
  }
}

function ActionButton({ label, onClick, disabled, active = false, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-10 shrink-0 items-center justify-center border transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-[#f58537] bg-orange-50 text-[#8b4a2b]'
          : 'border-transparent text-stone-700 hover:border-stone-200 hover:bg-stone-50'
      }`}
    >
      {children}
    </button>
  )
}

export default function NewsletterImageEditor({ src, onClose, onSave, onDelete, isSaving }) {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const stateRef = useRef(null)
  const sourceRef = useRef(null)
  const originalRef = useRef(null)
  const historyRef = useRef({ past: [], future: [] })
  const interactionRef = useRef(null)
  const objectUrlsRef = useRef(new Set())
  const [editorState, setEditorState] = useState(null)
  const [sourceImage, setSourceImage] = useState(null)
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [viewZoom, setViewZoom] = useState(100)
  const [stageSize, setStageSize] = useState({ width: 720, height: 480 })
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { canUndo, canRedo } = historyState

  const refreshHistory = () => setHistoryState({
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,
  })

  const setCurrent = (nextState, nextSource = sourceRef.current) => {
    stateRef.current = nextState
    sourceRef.current = nextSource
    setEditorState(nextState)
    setSourceImage(nextSource)
  }

  const remember = () => {
    if (!stateRef.current || !sourceRef.current) return
    historyRef.current = {
      past: [...historyRef.current.past, {
        state: stateRef.current,
        source: sourceRef.current,
      }],
      future: [],
    }
    refreshHistory()
  }

  const commit = (nextState, nextSource = sourceRef.current) => {
    remember()
    setCurrent(nextState, nextSource)
    setSaveError('')
  }

  useEffect(() => {
    let active = true
    const objectUrls = objectUrlsRef.current
    getImage(src)
      .then(image => {
        if (!active) return
        const initial = createInitialState(image.naturalWidth, image.naturalHeight)
        stateRef.current = initial
        sourceRef.current = image
        originalRef.current = { state: initial, source: image }
        historyRef.current = { past: [], future: [] }
        refreshHistory()
        setEditorState(initial)
        setSourceImage(image)
      })
      .catch(error => {
        if (active) setLoadError(error.message)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
      objectUrls.forEach(url => URL.revokeObjectURL(url))
      objectUrls.clear()
    }
  }, [src])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !editorState || !sourceImage) return
    canvas.width = editorState.canvasWidth
    canvas.height = editorState.canvasHeight
    const context = canvas.getContext('2d')
    if (!context) {
      setSaveError('Your browser could not prepare the image canvas.')
      return
    }
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.save()
    context.translate(editorState.imageX + editorState.imageWidth / 2, editorState.imageY + editorState.imageHeight / 2)
    context.rotate((editorState.rotation * Math.PI) / 180)
    context.scale(editorState.flipX ? -1 : 1, editorState.flipY ? -1 : 1)
    context.drawImage(
      sourceImage,
      -editorState.imageWidth / 2,
      -editorState.imageHeight / 2,
      editorState.imageWidth,
      editorState.imageHeight,
    )
    context.restore()
  }, [editorState, sourceImage])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    const observer = new ResizeObserver(entries => {
      const bounds = entries[0]?.contentRect
      if (bounds) setStageSize({ width: bounds.width, height: bounds.height })
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const undo = () => {
    const history = historyRef.current
    const previous = history.past[history.past.length - 1]
    if (!previous || !stateRef.current || !sourceRef.current) return
    historyRef.current = {
      past: history.past.slice(0, -1),
      future: [{ state: stateRef.current, source: sourceRef.current }, ...history.future],
    }
    setCurrent(previous.state, previous.source)
    refreshHistory()
  }

  const redo = () => {
    const history = historyRef.current
    const next = history.future[0]
    if (!next || !stateRef.current || !sourceRef.current) return
    historyRef.current = {
      past: [...history.past, { state: stateRef.current, source: sourceRef.current }],
      future: history.future.slice(1),
    }
    setCurrent(next.state, next.source)
    refreshHistory()
  }

  useEffect(() => {
    const handleKeyDown = event => {
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
        event.preventDefault()
        redo()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  const getCanvasPoint = event => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const bounds = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * canvas.width / bounds.width,
      y: (event.clientY - bounds.top) * canvas.height / bounds.height,
    }
  }

  const getHandle = target => target instanceof Element ? target.closest('[data-editor-handle]')?.dataset.editorHandle : null

  const beginInteraction = (event, type) => {
    if (!editorState || isSaving) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getCanvasPoint(event)
    interactionRef.current = {
      type,
      handle: getHandle(event.target),
      start: point,
      state: editorState,
    }
  }

  const changeCrop = (state, handle, dx, dy) => {
    const crop = { ...state.crop }
    if (handle === 'move') {
      crop.x = Math.min(state.canvasWidth - crop.width, Math.max(0, crop.x + dx))
      crop.y = Math.min(state.canvasHeight - crop.height, Math.max(0, crop.y + dy))
    } else {
      const right = crop.x + crop.width
      const bottom = crop.y + crop.height
      if (handle.includes('w')) crop.x = Math.min(right - MIN_SIZE, Math.max(0, crop.x + dx))
      if (handle.includes('e')) crop.width = Math.max(MIN_SIZE, Math.min(state.canvasWidth - crop.x, crop.width + dx))
      if (handle.includes('n')) crop.y = Math.min(bottom - MIN_SIZE, Math.max(0, crop.y + dy))
      if (handle.includes('s')) crop.height = Math.max(MIN_SIZE, Math.min(state.canvasHeight - crop.y, crop.height + dy))
      if (handle.includes('w')) crop.width = right - crop.x
      if (handle.includes('n')) crop.height = bottom - crop.y
    }
    return { ...state, crop }
  }

  const resizeImage = (state, handle, dx, dy) => {
    const radians = (-state.rotation * Math.PI) / 180
    const localX = dx * Math.cos(radians) - dy * Math.sin(radians)
    const localY = dx * Math.sin(radians) + dy * Math.cos(radians)
    const left = handle.includes('w')
    const right = handle.includes('e')
    const top = handle.includes('n')
    const bottom = handle.includes('s')
    let width = Math.max(MIN_SIZE, state.imageWidth + (right ? localX : left ? -localX : 0))
    let height = Math.max(MIN_SIZE, state.imageHeight + (bottom ? localY : top ? -localY : 0))
    if (state.aspectLocked) {
      const ratio = state.imageWidth / state.imageHeight
      const widthChanged = right || left
      if (widthChanged) height = Math.max(MIN_SIZE, width / ratio)
      else width = Math.max(MIN_SIZE, height * ratio)
    }
    const widthDelta = width - state.imageWidth
    const heightDelta = height - state.imageHeight
    const centerShiftX = ((left ? -widthDelta : right ? widthDelta : 0) * Math.cos(radians)
      - (top ? -heightDelta : bottom ? heightDelta : 0) * Math.sin(radians)) / 2
    const centerShiftY = ((left ? -widthDelta : right ? widthDelta : 0) * Math.sin(radians)
      + (top ? -heightDelta : bottom ? heightDelta : 0) * Math.cos(radians)) / 2
    return {
      ...state,
      imageX: state.imageX + centerShiftX,
      imageY: state.imageY + centerShiftY,
      imageWidth: width,
      imageHeight: height,
    }
  }

  const handleStagePointerMove = event => {
    const interaction = interactionRef.current
    if (!interaction) return
    const point = getCanvasPoint(event)
    const dx = point.x - interaction.start.x
    const dy = point.y - interaction.start.y
    let nextState
    if (interaction.type === 'crop') {
      nextState = changeCrop(interaction.state, interaction.handle || 'move', dx, dy)
    } else if (interaction.type === 'resize') {
      nextState = resizeImage(interaction.state, interaction.handle, dx, dy)
    } else {
      nextState = {
        ...interaction.state,
        imageX: interaction.state.imageX + dx,
        imageY: interaction.state.imageY + dy,
      }
    }
    stateRef.current = nextState
    setEditorState(nextState)
  }

  const endInteraction = () => {
    const interaction = interactionRef.current
    if (!interaction) return
    interactionRef.current = null
    if (stateRef.current !== interaction.state) {
      historyRef.current = {
        past: [...historyRef.current.past, { state: interaction.state, source: sourceRef.current }],
        future: [],
      }
      refreshHistory()
    }
  }

  const updateProperty = (changes, source = sourceRef.current) => {
    if (!editorState) return
    commit({ ...editorState, ...changes }, source)
  }

  const updateDimensions = (width, height) => {
    if (!editorState) return
    const nextWidth = Math.max(MIN_SIZE, Number(width) || editorState.imageWidth)
    const nextHeight = Math.max(MIN_SIZE, Number(height) || editorState.imageHeight)
    const imageX = editorState.imageX + (editorState.imageWidth - nextWidth) / 2
    const imageY = editorState.imageY + (editorState.imageHeight - nextHeight) / 2
    commit({ ...editorState, imageX, imageY, imageWidth: nextWidth, imageHeight: nextHeight })
  }

  const setRotation = value => {
    const rotation = Number(value)
    const rotatedState = { ...editorState, rotation }
    const bounds = getRotatedBounds(rotatedState)
    const offsetX = editorState.imageX + editorState.imageWidth / 2 - editorState.canvasWidth / 2
    const offsetY = editorState.imageY + editorState.imageHeight / 2 - editorState.canvasHeight / 2
    const canvasWidth = Math.ceil(Math.max(editorState.canvasWidth, bounds.width + 2 * Math.abs(offsetX)))
    const canvasHeight = Math.ceil(Math.max(editorState.canvasHeight, bounds.height + 2 * Math.abs(offsetY)))
    const imageCenterX = canvasWidth / 2 + offsetX
    const imageCenterY = canvasHeight / 2 + offsetY
    commit({
      ...rotatedState,
      canvasWidth,
      canvasHeight,
      imageX: imageCenterX - rotatedState.imageWidth / 2,
      imageY: imageCenterY - rotatedState.imageHeight / 2,
      crop: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
    })
  }

  const rotate = degrees => setRotation(((editorState.rotation + degrees + 360) % 360))

  const flip = axis => updateProperty({
    [axis === 'horizontal' ? 'flipX' : 'flipY']: !(axis === 'horizontal' ? editorState.flipX : editorState.flipY),
  })

  const alignImage = alignment => {
    const bounds = getRotatedBounds(editorState)
    const position = {
      left: { imageX: (bounds.width - editorState.imageWidth) / 2 },
      center: { imageX: (editorState.canvasWidth - bounds.width) / 2 - (editorState.imageWidth - bounds.width) / 2 },
      right: { imageX: editorState.canvasWidth - bounds.width - (editorState.imageWidth - bounds.width) / 2 },
      top: { imageY: (bounds.height - editorState.imageHeight) / 2 },
      middle: { imageY: (editorState.canvasHeight - bounds.height) / 2 - (editorState.imageHeight - bounds.height) / 2 },
      bottom: { imageY: editorState.canvasHeight - bounds.height - (editorState.imageHeight - bounds.height) / 2 },
    }[alignment]
    updateProperty(position)
  }

  const toggleCrop = () => {
    if (!editorState) return
    const crop = editorState.cropMode
      ? { x: 0, y: 0, width: editorState.canvasWidth, height: editorState.canvasHeight }
      : {
        x: editorState.canvasWidth * 0.08,
        y: editorState.canvasHeight * 0.08,
        width: editorState.canvasWidth * 0.84,
        height: editorState.canvasHeight * 0.84,
      }
    updateProperty({ crop, cropMode: !editorState.cropMode })
  }

  const applyCrop = () => {
    if (!editorState || !sourceImage || !canvasRef.current) return
    const { x, y, width, height } = editorState.crop
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = Math.max(1, Math.round(width))
    cropCanvas.height = Math.max(1, Math.round(height))
    const context = cropCanvas.getContext('2d')
    if (!context) {
      setSaveError('Your browser could not prepare the crop.')
      return
    }
    context.drawImage(canvasRef.current, x, y, width, height, 0, 0, cropCanvas.width, cropCanvas.height)
    commit(createInitialState(cropCanvas.width, cropCanvas.height), cropCanvas)
  }

  const reset = () => {
    if (!originalRef.current) return
    commit(originalRef.current.state, originalRef.current.source)
    setViewZoom(100)
  }

  const replaceImage = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      setSaveError('Choose an image smaller than 20 MB.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setSaveError('Choose a JPEG, PNG, WebP, or GIF image.')
      return
    }
    setIsLoading(true)
    setLoadError('')
    setSaveError('')
    try {
      const url = URL.createObjectURL(file)
      objectUrlsRef.current.add(url)
      const image = await getImage(url)
      const nextState = createInitialState(image.naturalWidth, image.naturalHeight)
      commit(nextState, image)
      originalRef.current = { state: nextState, source: image }
    } catch (error) {
      setSaveError(error.message || 'This image could not be opened.')
    } finally {
      setIsLoading(false)
    }
  }

  const save = async () => {
    if (!canvasRef.current || !editorState) return
    setSaveError('')
    try {
      const bounds = getRotatedBounds(editorState)
      const left = Math.max(0, Math.floor(bounds.x))
      const top = Math.max(0, Math.floor(bounds.y))
      const right = Math.min(editorState.canvasWidth, Math.ceil(bounds.x + bounds.width))
      const bottom = Math.min(editorState.canvasHeight, Math.ceil(bounds.y + bounds.height))
      const width = right - left
      const height = bottom - top
      if (width < 1 || height < 1) {
        throw new Error('Move the image into the canvas before saving.')
      }

      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = width
      exportCanvas.height = height
      const exportContext = exportCanvas.getContext('2d')
      if (!exportContext) {
        throw new Error('Your browser could not prepare the edited image.')
      }
      exportContext.drawImage(
        canvasRef.current,
        left,
        top,
        width,
        height,
        0,
        0,
        width,
        height,
      )

      const blob = await new Promise((resolve, reject) => {
        exportCanvas.toBlob(result => {
          if (result) resolve(result)
          else reject(new Error('The edited image could not be exported.'))
        }, 'image/webp', 0.92)
      })
      const extension = blob.type === 'image/webp' ? 'webp' : 'png'
      await onSave(
        new File([blob], `newsletter-image.${extension}`, { type: blob.type }),
        { width, height },
      )
      onClose()
    } catch (error) {
      setSaveError(error.message || 'The edited image could not be saved.')
    }
  }

  const fittedWidth = editorState
    ? Math.max(1, Math.min(
      stageSize.width - 40,
      720,
      (stageSize.height - 40) * editorState.canvasWidth / editorState.canvasHeight,
    ))
    : 1
  const fittedHeight = editorState ? fittedWidth * editorState.canvasHeight / editorState.canvasWidth : 1
  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
  const handlePosition = {
    nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2',
    n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',
    ne: 'left-full top-0 -translate-x-1/2 -translate-y-1/2',
    e: 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2',
    se: 'left-full top-full -translate-x-1/2 -translate-y-1/2',
    s: 'left-1/2 top-full -translate-x-1/2 -translate-y-1/2',
    sw: 'left-0 top-full -translate-x-1/2 -translate-y-1/2',
    w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/75 p-2 sm:p-5" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-image-editor-title"
        className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden border border-stone-200 bg-white shadow-2xl"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 id="newsletter-image-editor-title" className="text-base font-bold text-stone-900">Picture format</h2>
            <span className="hidden text-xs text-stone-400 sm:inline">Newsletter image editor</span>
          </div>
          <div className="flex flex-wrap items-center gap-0.5">
            <ActionButton label="Undo" onClick={undo} disabled={!canUndo || isLoading || isSaving}><LuUndo2 /></ActionButton>
            <ActionButton label="Redo" onClick={redo} disabled={!canRedo || isLoading || isSaving}><LuRedo2 /></ActionButton>
            <span className="mx-1 h-7 border-l border-stone-200" />
            <ActionButton label="Crop" onClick={toggleCrop} active={editorState?.cropMode} disabled={!editorState || isLoading || isSaving}><LuCrop /></ActionButton>
            <ActionButton label="Rotate left" onClick={() => rotate(-90)} disabled={!editorState || isLoading || isSaving}><LuRotateCcw /></ActionButton>
            <ActionButton label="Rotate right" onClick={() => rotate(90)} disabled={!editorState || isLoading || isSaving}><LuRotateCw /></ActionButton>
            <ActionButton label="Flip horizontally" onClick={() => flip('horizontal')} disabled={!editorState || isLoading || isSaving}><LuFlipHorizontal /></ActionButton>
            <ActionButton label="Flip vertically" onClick={() => flip('vertical')} disabled={!editorState || isLoading || isSaving}><LuFlipVertical /></ActionButton>
            <ActionButton label="Reset image" onClick={reset} disabled={!editorState || isLoading || isSaving}><LuRotateCcw /></ActionButton>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
          <div className="flex min-h-[340px] min-w-0 flex-1 flex-col bg-stone-100 lg:min-h-0">
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-3 py-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs">
                <LuZoomOut aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-500" />
                <input
                  aria-label="Canvas zoom"
                  type="range"
                  min="25"
                  max="200"
                  step="5"
                  value={viewZoom}
                  onChange={event => setViewZoom(Number(event.target.value))}
                  className="w-full accent-[#c77a4b]"
                />
                <LuZoomIn aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-500" />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-600">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={replaceImage} disabled={isLoading || isSaving} className="sr-only" />
                Replace image
              </label>
            </div>

            <div ref={stageRef} className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-5">
              {isLoading && <p role="status" className="text-sm text-stone-500">Loading image…</p>}
              {loadError && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>}
              {!isLoading && !loadError && editorState && (
                <div
                  className="relative shrink-0 shadow-lg"
                  onPointerMove={handleStagePointerMove}
                  onPointerUp={endInteraction}
                  onPointerCancel={endInteraction}
                  style={{
                    width: fittedWidth,
                    height: fittedHeight,
                    transform: `scale(${viewZoom / 100})`,
                    transformOrigin: 'center',
                    backgroundColor: '#ffffff',
                    backgroundImage: 'linear-gradient(45deg, #e7e5e4 25%, transparent 25%), linear-gradient(-45deg, #e7e5e4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e7e5e4 75%), linear-gradient(-45deg, transparent 75%, #e7e5e4 75%)',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                    backgroundSize: '16px 16px',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    aria-label="Image editing canvas"
                    className="absolute inset-0 h-full w-full"
                    style={{ touchAction: 'none' }}
                    onPointerDown={event => {
                      if (editorState.cropMode) {
                        beginInteraction(event, 'crop')
                        return
                      }
                      const handle = getHandle(event.target)
                      beginInteraction(event, handle ? 'resize' : 'move')
                    }}
                  />
                  {editorState.cropMode ? (
                    <>
                      <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/35" style={{ height: `${editorState.crop.y / editorState.canvasHeight * 100}%` }} />
                      <div className="pointer-events-none absolute left-0 bg-black/35" style={{
                        top: `${editorState.crop.y / editorState.canvasHeight * 100}%`,
                        width: `${editorState.crop.x / editorState.canvasWidth * 100}%`,
                        height: `${editorState.crop.height / editorState.canvasHeight * 100}%`,
                      }} />
                      <div className="pointer-events-none absolute right-0 bg-black/35" style={{
                        top: `${editorState.crop.y / editorState.canvasHeight * 100}%`,
                        width: `${(editorState.canvasWidth - editorState.crop.x - editorState.crop.width) / editorState.canvasWidth * 100}%`,
                        height: `${editorState.crop.height / editorState.canvasHeight * 100}%`,
                      }} />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/35" style={{
                        height: `${(editorState.canvasHeight - editorState.crop.y - editorState.crop.height) / editorState.canvasHeight * 100}%`,
                      }} />
                      <div
                        className="absolute z-10 border-2 border-[#f58537] bg-white/10"
                        style={{
                          left: `${editorState.crop.x / editorState.canvasWidth * 100}%`,
                          top: `${editorState.crop.y / editorState.canvasHeight * 100}%`,
                          width: `${editorState.crop.width / editorState.canvasWidth * 100}%`,
                          height: `${editorState.crop.height / editorState.canvasHeight * 100}%`,
                          touchAction: 'none',
                        }}
                        data-editor-handle="move"
                        onPointerDown={event => beginInteraction(event, 'crop')}
                      >
                        {handles.map(handle => (
                          <span
                            key={handle}
                            role="presentation"
                            data-editor-handle={handle}
                            onPointerDown={event => beginInteraction(event, 'crop')}
                            className={`absolute h-3 w-3 border border-[#8b4a2b] bg-white ${handlePosition[handle]}`}
                            style={{ touchAction: 'none' }}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 cursor-move"
                        onPointerDown={event => beginInteraction(event, 'move')}
                        style={{ touchAction: 'none' }}
                        aria-label="Move image"
                      />
                      <div
                        className="absolute border border-[#f58537]"
                        style={{
                          left: `${editorState.imageX / editorState.canvasWidth * 100}%`,
                          top: `${editorState.imageY / editorState.canvasHeight * 100}%`,
                          width: `${editorState.imageWidth / editorState.canvasWidth * 100}%`,
                          height: `${editorState.imageHeight / editorState.canvasHeight * 100}%`,
                          transform: `rotate(${editorState.rotation}deg)`,
                          transformOrigin: 'center',
                          touchAction: 'none',
                        }}
                      >
                        {handles.map(handle => (
                          <span
                            key={handle}
                            role="presentation"
                            data-editor-handle={handle}
                            onPointerDown={event => beginInteraction(event, 'resize')}
                            className={`absolute h-3 w-3 border border-[#8b4a2b] bg-white ${handlePosition[handle]}`}
                            style={{ touchAction: 'none' }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="w-full shrink-0 border-t border-stone-200 bg-white p-4 lg:w-72 lg:overflow-y-auto lg:border-l lg:border-t-0">
            <h3 className="text-sm font-bold text-stone-900">Format picture</h3>
            {editorState && (
              <div className="mt-4 space-y-5">
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Size</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs text-stone-600">
                      Width
                      <input
                        aria-label="Image width"
                        type="number"
                        min={MIN_SIZE}
                        value={Math.round(editorState.imageWidth)}
                        onChange={event => {
                          const width = Math.max(MIN_SIZE, Number(event.target.value) || MIN_SIZE)
                          const height = editorState.aspectLocked
                            ? width / (editorState.imageWidth / editorState.imageHeight)
                            : editorState.imageHeight
                          updateDimensions(width, height)
                        }}
                        className="mt-1 min-h-9 w-full border border-stone-300 px-2 text-sm text-stone-800"
                      />
                    </label>
                    <label className="text-xs text-stone-600">
                      Height
                      <input
                        aria-label="Image height"
                        type="number"
                        min={MIN_SIZE}
                        value={Math.round(editorState.imageHeight)}
                        onChange={event => {
                          const height = Math.max(MIN_SIZE, Number(event.target.value) || MIN_SIZE)
                          const width = editorState.aspectLocked
                            ? height * (editorState.imageWidth / editorState.imageHeight)
                            : editorState.imageWidth
                          updateDimensions(width, height)
                        }}
                        className="mt-1 min-h-9 w-full border border-stone-300 px-2 text-sm text-stone-800"
                      />
                    </label>
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-xs text-stone-600">
                    <input
                      type="checkbox"
                      checked={editorState.aspectLocked}
                      onChange={event => updateProperty({ aspectLocked: event.target.checked })}
                      className="accent-[#c77a4b]"
                    />
                    Lock aspect ratio
                  </label>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Rotation</h4>
                  <label className="mt-2 flex items-center gap-2">
                    <LuRotateCw aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-500" />
                    <input
                      aria-label="Rotation angle"
                      type="range"
                      min="-180"
                      max="180"
                      value={editorState.rotation > 180 ? editorState.rotation - 360 : editorState.rotation}
                      onChange={event => setRotation(event.target.value)}
                      className="w-full accent-[#c77a4b]"
                    />
                    <span className="w-10 text-right text-xs tabular-nums text-stone-500">{Math.round(editorState.rotation)}°</span>
                  </label>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Position</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs text-stone-600">
                      X
                      <input aria-label="Horizontal position" type="number" value={Math.round(editorState.imageX)} onChange={event => updateProperty({ imageX: Number(event.target.value) || 0 })} className="mt-1 min-h-9 w-full border border-stone-300 px-2 text-sm" />
                    </label>
                    <label className="text-xs text-stone-600">
                      Y
                      <input aria-label="Vertical position" type="number" value={Math.round(editorState.imageY)} onChange={event => updateProperty({ imageY: Number(event.target.value) || 0 })} className="mt-1 min-h-9 w-full border border-stone-300 px-2 text-sm" />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <ActionButton label="Align left" onClick={() => alignImage('left')}><LuArrowLeft /></ActionButton>
                    <ActionButton label="Align center" onClick={() => alignImage('center')}><LuAlignCenter /></ActionButton>
                    <ActionButton label="Align right" onClick={() => alignImage('right')}><LuArrowRight /></ActionButton>
                    <ActionButton label="Align top" onClick={() => alignImage('top')}><LuArrowUp /></ActionButton>
                    <ActionButton label="Align middle" onClick={() => alignImage('middle')}><LuAlignVerticalJustifyCenter /></ActionButton>
                    <ActionButton label="Align bottom" onClick={() => alignImage('bottom')}><LuArrowDown /></ActionButton>
                  </div>
                </section>

                {editorState.cropMode && (
                  <button type="button" onClick={applyCrop} className="w-full bg-[#f58537] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#d96b25]">
                    Apply crop
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>

        {(saveError || loadError) && (
          <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {saveError || loadError}
          </p>
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3">
          <button type="button" onClick={onDelete} disabled={isSaving || isLoading} className="min-h-10 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
            Delete image
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="min-h-10 border border-stone-300 px-4 text-sm font-semibold text-stone-700 disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={!editorState || isLoading || Boolean(loadError) || isSaving} className="inline-flex min-h-10 items-center gap-2 bg-[#593a27] px-4 text-sm font-semibold text-white hover:bg-[#40291d] disabled:cursor-wait disabled:opacity-50">
              {isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> : <LuCheck aria-hidden="true" className="h-4 w-4" />}
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
