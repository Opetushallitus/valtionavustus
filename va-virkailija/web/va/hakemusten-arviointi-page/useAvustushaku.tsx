import { useParams } from 'react-router-dom'

export const useAvustushakuId = (): number => {
  const { avustushakuId: avustushakuIdFromParams } = useParams()
  const avustushakuId = Number(avustushakuIdFromParams)
  if (isNaN(avustushakuId)) {
    throw Error(`avustushakuId ${avustushakuIdFromParams} was NaN`)
  }
  return avustushakuId
}
