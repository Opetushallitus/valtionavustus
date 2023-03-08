import React from 'react'

export default function WarningBanner({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="warning-banner">
      <div className="warning-banner-content">{children}</div>
    </div>
  )
}
