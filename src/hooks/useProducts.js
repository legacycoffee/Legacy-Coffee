import { useEffect, useState } from 'react'
import { apiRequest } from '../context/api.js'

function mapProduct(product) {
  return {
    ...product,
    price: Number(product.price),
    wholesalePrice: product.wholesale_price == null ? null : Number(product.wholesale_price),
    tastingNotes: product.tasting_notes,
    imageAlt: product.image_alt,
  }
}

export default function useProducts() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadProducts = async () => {
      setIsLoading(true)
      setError('')
      try {
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
        if (isCurrent) {
          setProducts([...firstPage.results, ...pages.flatMap(page => page.results)].map(mapProduct))
        }
      } catch (requestError) {
        if (isCurrent) {
          setProducts([])
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
