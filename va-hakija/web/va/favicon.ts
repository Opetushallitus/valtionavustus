export function changeFaviconIconTo(favicon: 'oph' | 'jotpa') {
  const faviconElement = document.querySelector<HTMLLinkElement>('#favicon')
  if (!faviconElement) return

  if (favicon === 'oph') {
    faviconElement.href = '/favicon.ico'
  } else {
    faviconElement.href = '/img/jotpa/jotpa-favicon.ico'
  }
}
