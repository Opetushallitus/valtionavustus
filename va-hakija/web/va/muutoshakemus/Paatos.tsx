import React, { useEffect, useState } from 'react'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { MuutoshakemusPaatos } from 'soresu-form/web/va/MuutoshakemusPaatos'
import { PaatosState, MuutoshakemusPaatosResponse } from 'soresu-form/web/va/types/muutoshakemus'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'

import { Query } from './MuutoshakemusApp'

import '../style/paatos.css'

const initialState: PaatosState = {} as PaatosState

export const Paatos = ({ query }: { query: Query }) => {
  const { t } = useTranslations()
  const [loading, setLoading] = useState(true)
  const [paatosState, setPaatosState] = useState<PaatosState>(initialState)

  useEffect(() => {
    const fetchData = async () => {
      const muutoshakemusPaatos = (await HttpUtil.get(
        `/api/muutoshakemus/paatos/${query['user-key']}`
      )) as MuutoshakemusPaatosResponse
      const environment = (await HttpUtil.get(`/environment`)) as EnvironmentApiResponse
      setPaatosState({
        ...muutoshakemusPaatos,
        environment,
      })
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div className="paatos__wrapper">
      {loading ? <div>{t.loadingDecision}</div> : <MuutoshakemusPaatos {...paatosState} />}
    </div>
  )
}
