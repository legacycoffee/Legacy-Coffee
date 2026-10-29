import { useCallback, useState } from 'react'
import { CartContext } from './cartContext.js'
import { getCartItemUnitPrice } from '../data/products.js'

const CART_STORAGE_KEY = 'legacy-coffee-cart'
const ORDER_STORAGE_KEY = 'legacy-coffee-latest-order'
const WHOLESALE_DETAILS_STORAGE_KEY = 'legacy-coffee-wholesale-details'

function readStorage(key, fallback) {
  const storedValue = localStorage.getItem(key)
  return storedValue ? JSON.parse(storedValue) : fallback
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStorage(CART_STORAGE_KEY, []))
  const [latestOrder, setLatestOrder] = useState(() => readStorage(ORDER_STORAGE_KEY, null))
  const [wholesaleDetails, setWholesaleDetails] = useState(() => readStorage(WHOLESALE_DETAILS_STORAGE_KEY, null))

  const saveItems = nextItems => {
    setItems(nextItems)
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems))
  }

  const addToCart = (product, quantity = 1) => {
    const existingItem = items.find(item => item.id === product.id)
    const nextItems = existingItem
      ? items.map(item => item.id === product.id ? { ...item, ...product, quantity: item.quantity + quantity } : item)
      : [...items, { ...product, quantity }]
    saveItems(nextItems)
  }

  const addWholesaleItems = (wholesaleItems, details) => {
    const nextItems = [...items]
    wholesaleItems.forEach(product => {
      const existingIndex = nextItems.findIndex(item => item.id === product.id)
      if (existingIndex >= 0) {
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          ...product,
          quantity: nextItems[existingIndex].quantity + product.quantity,
        }
      } else {
        nextItems.push(product)
      }
    })
    saveItems(nextItems)
    setWholesaleDetails(details)
    localStorage.setItem(WHOLESALE_DETAILS_STORAGE_KEY, JSON.stringify(details))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return
    saveItems(items.map(item => item.id === productId ? { ...item, quantity } : item))
  }

  const removeFromCart = productId => {
    const nextItems = items.filter(item => item.id !== productId)
    saveItems(nextItems)
    if (!nextItems.some(item => item.is_wholesale)) {
      setWholesaleDetails(null)
      localStorage.removeItem(WHOLESALE_DETAILS_STORAGE_KEY)
    }
  }

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.setItem(CART_STORAGE_KEY, '[]')
    setWholesaleDetails(null)
    localStorage.removeItem(WHOLESALE_DETAILS_STORAGE_KEY)
  }, [])

  const saveOrder = order => {
    setLatestOrder(order)
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order))
  }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = items.reduce((sum, item) => sum + getCartItemUnitPrice(item) * item.quantity, 0)
  const value = {
    items,
    cartCount,
    cartTotal,
    latestOrder,
    wholesaleDetails,
    addToCart,
    addWholesaleItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    saveOrder,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
