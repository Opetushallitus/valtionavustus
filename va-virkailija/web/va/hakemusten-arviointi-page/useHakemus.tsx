import { useParams } from 'react-router-dom'
import { useHakemustenArviointiSelector } from './arviointiStore'
import { getHakemus } from './arviointiReducer'
import { Hakemus } from 'soresu-form/web/va/types'
import { isHakemusLoading } from './arviointiSelectors'

export const useHakemus = () => {
  const { hakemusId: hakemusIdFromParams } = useParams()
  const hakemusId = Number(hakemusIdFromParams)
  const hakemus = useHakemustenArviointiSelector((state) => getHakemus(state.arviointi, hakemusId))
  return hakemus
}

export function useHakemusLoadingAware(): Hakemus | null {
  const hakemus = useHakemus()
  const isLoading = useHakemustenArviointiSelector((state) => isHakemusLoading(state.arviointi))

  if (isLoading) {
    return null
  }
  return hakemus
}
