const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_SIDE = 2560
const OPTIMIZE_AFTER_BYTES = 1024 * 1024

function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This image could not be opened for upload.'))
    }
    image.src = url
  })
}

function exportWebp(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('This image could not be prepared for upload.'))
    }, 'image/webp', quality)
  })
}

export async function prepareNewsletterImage(file) {
  if (file.size <= OPTIMIZE_AFTER_BYTES) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('Choose an image smaller than 5 MB.')
    }
    return file
  }
  if (file.type === 'image/webp' && file.size <= MAX_UPLOAD_BYTES) return file

  const image = await decodeImage(file)
  const { width, height } = image
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height))
  const needsOptimization = scale < 1 || file.size > OPTIMIZE_AFTER_BYTES
  if (!needsOptimization) return file

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser could not prepare this image for upload.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close?.()

  let optimized = await exportWebp(canvas, 0.92)
  if (optimized.type !== 'image/webp') {
    if (file.size <= MAX_UPLOAD_BYTES) return file
    throw new Error('Your browser cannot optimize this image. Choose a smaller image and try again.')
  }
  if (optimized.size > MAX_UPLOAD_BYTES) {
    optimized = await exportWebp(canvas, 0.82)
  }

  if (optimized.size > MAX_UPLOAD_BYTES) {
    throw new Error('This image is still larger than the 5 MB upload limit after optimization. Try a smaller image.')
  }
  if (optimized.size >= file.size && file.size <= MAX_UPLOAD_BYTES) return file

  const fileName = `${file.name.replace(/\.[^.]+$/, '') || 'newsletter-image'}.webp`
  return new File([optimized], fileName, { type: 'image/webp' })
}
