import React from 'react'
import { Language } from 'soresu-form/web/va/types'

interface LogoProps {
  lang: Language
  showJotpaLogo: boolean
}

export const Logo = ({ lang, showJotpaLogo }: LogoProps) => {
  if (!showJotpaLogo) return OpetushallitusLogo

  if (lang === 'sv') return JotpaLogoSv
  return JotpaLogoFi
}

const Img = ({ src, alt }: { src: string; alt: string }) => {
  return <img id="logo" src={src} width="240" height="68" alt={alt} />
}

const OpetushallitusLogo = (
  <Img src={'/img/logo-240x68@2x.png'} alt={'Opetushallitus / Utbildningsstyrelsen'} />
)
const JotpaLogoFi = (
  <Img
    src={'/img/jotpa/jotpa-logo-fi.png'}
    alt={'Jatkuvan oppimisen ja työllisyyden palvelukeskus'}
  />
)
const JotpaLogoSv = (
  <Img
    src={'/img/jotpa/jotpa-logo-sv.png'}
    alt={'Servicecentret för kontinuerligt lärande och sysselsättning'}
  />
)
