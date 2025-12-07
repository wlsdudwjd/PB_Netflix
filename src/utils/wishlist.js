const WISHLIST_KEY = 'pb-wishlist'

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : []
  } catch (error) {
    console.warn('Failed to parse wishlist', error)
    return []
  }
}

export const getWishlist = () => {
  if (typeof localStorage === 'undefined') return []
  return safeParse(localStorage.getItem(WISHLIST_KEY))
}

export const saveWishlist = (items) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
}

export const toggleWishlist = (movie) => {
  if (!movie || !movie.id) return []
  const current = getWishlist()
  const exists = current.some((m) => m.id === movie.id)
  const next = exists ? current.filter((m) => m.id !== movie.id) : [...current, movie]
  saveWishlist(next)
  return next
}
