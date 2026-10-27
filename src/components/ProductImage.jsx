export default function ProductImage({ product, className = '', objectFit = 'cover' }) {
  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-contain sm:object-cover'

  return (
    <img
      src={product.image}
      alt={product.imageAlt}
      loading="lazy"
      className={`h-full w-full ${objectFitClass} ${className}`}
    />
  )
}
