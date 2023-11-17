import { useSearchParams } from 'react-router-dom'
import { useHakujenHallintaSelector } from './hakujenHallintaStore'
import { Avustushaku, getAvustushakuFromState, selectAvustushaku } from './hakuReducer'

export const useAvustushaku = (): number => {
  const [searchParams] = useSearchParams()
  const avustushakuId = Number(searchParams.get('avustushaku'))
  if (isNaN(avustushakuId)) {
    throw Error('wrong type of avustushaku')
  }
  return avustushakuId
}

export const useCurrentAvustushaku = (): Avustushaku => {
  const avustushakuId = useAvustushaku()
  const avustushaku = useHakujenHallintaSelector((state) =>
    selectAvustushaku(state.haku, avustushakuId)
  )
  return avustushaku
}

export const tryToUseCurrentAvustushaku = (): Avustushaku | undefined => {
  const avustushakuId = useAvustushaku()
  const avustushaku = useHakujenHallintaSelector((state) =>
    getAvustushakuFromState(state.haku, avustushakuId)
  )
  return avustushaku
}
