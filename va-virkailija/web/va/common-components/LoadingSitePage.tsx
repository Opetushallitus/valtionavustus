import React, { useEffect, useState } from 'react'

/*
  Show loading page but only after a brief wait.
  This way you don't always see the page when e.g. refreshing page
  and instead only when it actually takes a while.
 */
export default function LoadingSitePage() {
  const [showLoading, setShowLoading] = useState(false)
  const [dots, setDots] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(true)
    }, 300)
    return () => {
      clearTimeout(timer)
    }
  }, [])
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots.length >= 3 ? '' : prevDots + '.'))
    }, 300)
    return () => {
      clearInterval(interval)
    }
  }, [])
  if (showLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100vw',
          height: '100vh',
        }}
      >
        <img
          src="/img/logo-240x68@2x.png"
          width={480}
          height={136}
          alt="Opetushallitus / Utbildningsstyrelsen"
        />
        <div style={{ width: '220px' }}>{`Ladataan tarvittavia tietoja${dots}`}</div>
      </div>
    )
  }
  return null
}
