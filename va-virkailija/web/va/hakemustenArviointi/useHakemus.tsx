import { useParams } from 'react-router-dom'
import { useHakemustenArviointiSelector } from './arviointiStore'
import { getHakemus } from './arviointiReducer'

export const useHakemus = () => {
  const { hakemusId: hakemusIdFromParams } = useParams()
  const hakemusId = Number(hakemusIdFromParams)
  const hakemus = useHakemustenArviointiSelector((state) => getHakemus(state.arviointi, hakemusId))
  return hakemus
}
