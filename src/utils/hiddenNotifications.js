function getStorageKey(userId) {
  return `legacy-coffee-hidden-notifications:${userId}`
}

export function getHiddenNotificationIds(userId) {
  if (!userId) return new Set()

  try {
    const storedIds = JSON.parse(localStorage.getItem(getStorageKey(userId)) || '[]')
    if (Array.isArray(storedIds) && storedIds.every(id => typeof id === 'string')) {
      return new Set(storedIds)
    }
    console.warn('Saved hidden notifications are invalid; showing all notifications.')
  } catch (error) {
    console.warn('Saved hidden notifications could not be read.', error)
  }

  return new Set()
}

export function hideNotificationForUser(userId, notificationId) {
  if (!userId) {
    throw new Error('Could not identify your account to hide this notification.')
  }

  const hiddenIds = getHiddenNotificationIds(userId)
  hiddenIds.add(notificationId)
  localStorage.setItem(getStorageKey(userId), JSON.stringify([...hiddenIds]))
  return hiddenIds
}
