import React, { useEffect, useState } from 'react'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { MuutoshakemusPaatos } from 'va-common/web/va/MuutoshakemusPaatos'
import { PaatosState } from 'va-common/web/va/types/muutoshakemus'
import { useTranslations } from 'va-common/web/va/i18n/TranslationContext'

import { Query } from './MuutoshakemusApp'

import '../style/paatos.less'

const initialState: PaatosState = {} as PaatosState

export const Paatos = ({ query }: { query: Query }) => {
  const { t } = useTranslations()
  const [loading, setLoading] = useState(true)
  const [paatosState, setPaatosState] = useState<PaatosState>(initialState)

  useEffect(() => {
    const fetchData = async () => {
      const response = await HttpUtil.get(`/api/muutoshakemus/paatos/${query['user-key']}`) as PaatosState
      setPaatosState(response)
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
