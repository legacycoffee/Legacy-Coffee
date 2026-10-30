function getResponsiveImageUrls(image) {
  try {
    const url = new URL(image)

    if (url.hostname === 'images.unsplash.com') {
      return [480, 800].map(width => {
        const responsiveUrl = new URL(url)
        responsiveUrl.searchParams.set('auto', 'format')
        responsiveUrl.searchParams.set('fit', 'crop')
        responsiveUrl.searchParams.set('q', '75')
        responsiveUrl.searchParams.set('w', String(width))
        return `${responsiveUrl.href} ${width}w`
      })
    }

    if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/image/upload/')) {
      const uploadMarker = '/image/upload/'
      const uploadIndex = url.pathname.indexOf(uploadMarker)
      const prefix = url.pathname.slice(0, uploadIndex + uploadMarker.length)
      const pathAfterUpload = url.pathname.slice(uploadIndex + uploadMarker.length)
      const hasVersionPrefix = /^v\d+\//.test(pathAfterUpload)

      if (hasVersionPrefix) {
        return [480, 800].map(width => (
          `${url.origin}${prefix}f_auto,q_auto,w_${width}/${pathAfterUpload} ${width}w`
        ))
      }
    }
  } catch {
    return []
  }

  return []
}

export default function ProductImage({ product, className = '', objectFit = 'cover' }) {
  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover'
  const srcSet = getResponsiveImageUrls(product.image).join(', ')

  return (
    <img
      src={product.image}
      srcSet={srcSet || undefined}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      alt={product.imageAlt}
      loading="lazy"
      decoding="async"
      className={`h-full w-full ${objectFitClass} ${className}`}
    />
  )
}
