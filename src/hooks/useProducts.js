import { useEffect, useState } from 'react'
import { apiRequest } from '../context/api.js'
import { products as localProducts } from '../data/products.js'

const PRODUCT_CACHE_DURATION = 60_000
const fallbackProducts = localProducts.map(product => ({
  ...product,
  price: Number(product.price),
  wholesalePrice: product.wholesalePrice ?? null,
  tastingNotes: product.tastingNotes,
  imageAlt: product.imageAlt,
}))
let cachedProducts = null
let cacheExpiresAt = 0
let productsRequest = null

function mapProduct(product) {
  return {
    ...product,
    price: Number(product.price),
    wholesalePrice: product.wholesale_price == null ? null : Number(product.wholesale_price),
    tastingNotes: product.tasting_notes,
    imageAlt: product.image_alt,
  }
}

async function fetchProductsCatalog() {
  if (cachedProducts && Date.now() < cacheExpiresAt) return cachedProducts
  if (productsRequest) return productsRequest

  productsRequest = (async () => {
    const firstPage = await apiRequest('/shop/products/')
    const pageCount = firstPage.results.length
      ? Math.ceil(firstPage.count / firstPage.results.length)
      : 1
    const pages = await Promise.all(
      Array.from(
        { length: pageCount - 1 },
        (_, index) => apiRequest(`/shop/products/?page=${index + 2}`),
      ),
    )
    const products = [...firstPage.results, ...pages.flatMap(page => page.results)].map(mapProduct)
    cachedProducts = products
    cacheExpiresAt = Date.now() + PRODUCT_CACHE_DURATION
    return products
  })().finally(() => {
    productsRequest = null
  })

  return productsRequest
}

export default function useProducts() {
  const [products, setProducts] = useState(() => cachedProducts || fallbackProducts)
  const [isLoading, setIsLoading] = useState(() => cachedProducts === null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadProducts = async () => {
      setError('')
      try {
        const loadedProducts = await fetchProductsCatalog()
        if (isCurrent) setProducts(loadedProducts)
      } catch (requestError) {
        if (isCurrent) {
          setProducts(cachedProducts || fallbackProducts)
          setError(requestError.message)
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadProducts()
    return () => {
      isCurrent = false
    }
  }, [])

  return { products, isLoading, error }
}
