import { createListenerMiddleware, TypedStartListening } from '@reduxjs/toolkit'
import { HakemustenArviointiAppDispatch, HakemustenArviointiRootState } from './arviointiStore'

export const hakemustenArviointiListenerMiddleware = createListenerMiddleware()

export type HakemustenArviointiStartListening = TypedStartListening<
  HakemustenArviointiRootState,
  HakemustenArviointiAppDispatch
>
export const startHakemustenArviointiListening =
  hakemustenArviointiListenerMiddleware.startListening as HakemustenArviointiStartListening
