import { useState } from 'react'

export function usePhotoSwipe(length, onNext, onPrev, threshold = 50) {
  const [touchStart, setTouchStart] = useState(null)

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX)

  const handleTouchEnd = (e) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > threshold && length > 1) {
      if (diff > 0) onNext()
      else onPrev()
    }
    setTouchStart(null)
  }

  return { handleTouchStart, handleTouchEnd }
}
