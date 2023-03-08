import { useEffect, useRef } from 'react'

export default function useOutsideClick<T extends HTMLElement>(onOutsideClick: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref?.current && event.target instanceof Element && !ref.current.contains(event.target)) {
        onOutsideClick()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onOutsideClick])
  return ref
}
