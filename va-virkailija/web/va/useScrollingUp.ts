import { useEffect, useState } from 'react'

export default function useScrollingUp() {
  let prevY = window.scrollY
  const [scrollingUp, setScrollingUp] = useState(false)

  const handleScroll = () => {
    const currY = window.scrollY
    setScrollingUp(currY === 0 ? false : prevY > currY)
    prevY = currY
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return scrollingUp
}
