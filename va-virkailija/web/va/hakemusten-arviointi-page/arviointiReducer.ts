import {
  createAction,
  createAsyncThunk,
  createSlice,
  Draft,
  isAnyOf,
  isFulfilled,
  isPending,
  isRejected,
  PayloadAction,
} from '@reduxjs/toolkit'
import HttpUtil from 'soresu-form/web/HttpUtil'
import {
  Answer,
  Arvio,
  ChangeRequest,
  Comment,
  Hakemus,
  HakemusStatus,
  LoadedHakemusData,
  NormalizedHakemusData,
  Payment,
  Score,
  Scoring,
} from 'soresu-form/web/va/types'
import { HakuData, LahetysStatuses, VaCodeValue } from '../types'
import { Lahetys } from '../hakujen-hallinta-page/haku-details/Tapahtumaloki'
import { TalousarviotiliWithKoulutusasteet } from '../hakujen-hallinta-page/hakuReducer'
import { Muutoshakemus as MuutoshakemusType } from 'soresu-form/web/va/types/muutoshakemus'
import { HakemustenArviointiRootState } from './arviointiStore'
import _ from 'lodash'
import {
  mutateDefaultBudgetValuesForSelectedHakemusOverriddenAnswers,
  mutateDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers,
  mutatesDefaultBudgetValuesForSelectedHakemusSeurantaAnswers,
} from './overrides'

const oldestFirst = (a: Lahetys, b: Lahetys) => (a.created_at < b.created_at ? -1 : 1)
const successfullySent = (lahetys: Lahetys) => lahetys.success
const getEarliestSuccessfulLahetysDate = (loki: Lahetys[]) =>
  loki.filter(successfullySent).sort(oldestFirst)[0]?.created_at

async function getLahetysStatuses(avustushakuId: number) {
  const [paatos, valiselvitys, loppuselvitys] = await Promise.all([
    HttpUtil.get<Lahetys[]>(`/api/avustushaku/${avustushakuId}/tapahtumaloki/paatoksen_lahetys`),
    HttpUtil.get<Lahetys[]>(
      `/api/avustushaku/${avustushakuId}/tapahtumaloki/valiselvitys-notification`
    ),
    HttpUtil.get<Lahetys[]>(
      `/api/avustushaku/${avustushakuId}/tapahtumaloki/loppuselvitys-notification`
    ),
  ])
  return {
    paatoksetSentAt: getEarliestSuccessfulLahetysDate(paatos),
    valiselvitysPyynnostSentAt: getEarliestSuccessfulLahetysDate(valiselvitys),
    loppuselvitysPyynnotSentAt: getEarliestSuccessfulLahetysDate(loppuselvitys),
  }
}

async function getEarliestPaymentCreatedAt(avustushakuId: number) {
  const payments = await HttpUtil.get<Payment[]>(`/api/v2/grants/${avustushakuId}/payments/`)
  const paymentIsSent = ['sent', 'paid']
  const allPaymentsPaid = payments.every((p) => paymentIsSent.includes(p['paymentstatus-id']))
  if (payments.length === 0 || !allPaymentsPaid) {
    return undefined
  }
  return payments.map((p) => p['created-at']).sort()[0]
}

export interface DropdownAvustushaku {
  id: number
  name: string
}

export const fetchAvustushakuInfo = createAsyncThunk<AvustushakuData, number>(
  'arviointi/fetchAvustushakuInfo',
  async (avustushakuId) => {
    const [hakuData, projects, lahetykset, earliestPaymentCreatedAt] = await Promise.all([
      HttpUtil.get<HakuData>(`/api/avustushaku/${avustushakuId}`),
      HttpUtil.get<VaCodeValue[]>(`/api/avustushaku/${avustushakuId}/projects`),
      getLahetysStatuses(avustushakuId),
      getEarliestPaymentCreatedAt(avustushakuId),
    ])
    return {
      hakuData,
      projects,
      lahetykset,
      earliestPaymentCreatedAt,
    }
  }
)

export const initialize = createAsyncThunk<
  void,
  { avustushakuId?: number; hakemusId?: number },
  { state: HakemustenArviointiRootState }
>('arviointi/initialize', async ({ avustushakuId, hakemusId }, thunkAPI) => {
  await thunkAPI.dispatch(fetchAvustushaut())
  if (avustushakuId) {
    await thunkAPI.dispatch(fetchAvustushakuInfo(avustushakuId))
  }
  if (hakemusId) {
    await thunkAPI.dispatch(selectHakemus(hakemusId))
  }
})

const fetchAvustushaut = createAsyncThunk<
  DropdownAvustushaku[],
  void,
  { state: HakemustenArviointiRootState }
>('arviointi/avustushaut', async (_) => {
  return await HttpUtil.get<DropdownAvustushaku[]>('/api/avustushaku/arviointi/dropdown')
})

export const setKeskeytettyAloittamatta = createAsyncThunk<
  Hakemus,
  { hakemusId: number; keskeyta: boolean },
  { state: HakemustenArviointiRootState }
>('arviointi/setKeskeytettyAloittamatta', async ({ hakemusId, keskeyta }, thunkAPI) => {
  const { hakuData } = getLoadedAvustushakuData(thunkAPI.getState().arviointi)
  return await HttpUtil.put(
    `/api/avustushaku/${hakuData.avustushaku.id}/hakemus/${hakemusId}/keskeyta-aloittamatta`,
    { keskeyta }
  )
})

export const selectHakemus = createAsyncThunk<
  { hakemus: Hakemus; extra: LoadedHakemusData },
  number,
  { state: HakemustenArviointiRootState }
>(
  'arviointi/selectHakemus',
  async (hakemusId, thunkAPI) => {
    const { hakuData } = getLoadedAvustushakuData(thunkAPI.getState().arviointi)
    const { avustushaku, privileges } = hakuData
    const avustushakuId = avustushaku.id
    const [
      project,
      talousarviotilit,
      normalizedData,
      muutoshakemukset,
      { scoring, scores },
      payments,
      comments,
      selvitys,
      changeRequests,
      attachmentVersions,
      newHakuData,
    ] = await Promise.all([
      HttpUtil.get<VaCodeValue>(`/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/project`),
      HttpUtil.get<TalousarviotiliWithKoulutusasteet[]>(
        `/api/avustushaku/${avustushakuId}/talousarviotilit`
      ),
      HttpUtil.get<NormalizedHakemusData>(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/normalized`
      ).catch(() => undefined),
      HttpUtil.get<MuutoshakemusType[]>(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/muutoshakemus/`
      ),
      HttpUtil.get<{ scores: Score[]; scoring: Scoring }>(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/scores`
      ),
      HttpUtil.get<Payment[]>(`/api/v2/applications/${hakemusId}/payments/`),
      HttpUtil.get<Comment[]>(`/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/comments`),
      HttpUtil.get<Hakemus['selvitys']>(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/selvitys`
      ),
      HttpUtil.get<ChangeRequest[]>(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/change-requests`
      ),
      HttpUtil.get<unknown[]>(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/attachments/versions`
      ),
      HttpUtil.get<HakuData>(`/api/avustushaku/${avustushakuId}`),
    ])
    const updatedHakemus = newHakuData.hakemukset.find((e) => e.id === hakemusId)
    if (!updatedHakemus) throw new Error(`No hakemus found for ID ${hakemusId}`)

    const hakuIsPublishedAndEnded =
      avustushaku.status === 'published' && avustushaku.phase === 'ended'
    const accessControl = {
      allowHakemusCommenting: hakuIsPublishedAndEnded,
      allowHakemusStateChanges: hakuIsPublishedAndEnded && privileges['change-hakemus-state'],
      allowHakemusScoring: hakuIsPublishedAndEnded && privileges['score-hakemus'],
      allowHakemusOfficerEditing: privileges['change-hakemus-state'],
      allowHakemusCancellation:
        avustushaku.status !== 'resolved' && privileges['change-hakemus-state'],
    }
    let mutatedArvio = false
    let clonedForWeirdMutations = _.cloneDeep(updatedHakemus)
    if (accessControl.allowHakemusStateChanges) {
      const mbyMutated1 = mutateDefaultBudgetValuesForSelectedHakemusOverriddenAnswers(
        clonedForWeirdMutations,
        hakuData
      )
      const mbyMutated2 = mutateDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers(
        clonedForWeirdMutations,
        hakuData
      )
      mutatedArvio = mbyMutated1 || mbyMutated2
    }
    if (mutatedArvio) {
      thunkAPI.dispatch(
        setArvioValue({
          hakemusId,
          key: 'hasChanges',
          value: true,
        })
      )
      await thunkAPI.dispatch(saveHakemusArvio({ hakemusId }))
    }
    mutatesDefaultBudgetValuesForSelectedHakemusSeurantaAnswers(clonedForWeirdMutations, hakuData)

    return {
      hakemus: clonedForWeirdMutations,
      extra: {
        project,
        talousarviotilit,
        normalizedData,
        muutoshakemukset,
        scores,
        scoring,
        payments,
        comments,
        selvitys,
        changeRequests,
        attachmentVersions,
        accessControl,
      },
    }
  },
  {
    condition: (hakemusId, { getState }) => {
      const loadingHakemusId = getState().arviointi.loadStatus.loadingHakemusId
      const fetchInProgress = hakemusId === loadingHakemusId
      return !fetchInProgress
    },
  }
)

export const saveHakemusArvio = createAsyncThunk<
  { budgetGranted: number | undefined },
  { hakemusId: number },
  { state: { arviointi: ArviointiState } }
>('arviointi/saveHakemusArvio', async ({ hakemusId }, thunkAPI) => {
  const avustushakuId = getLoadedAvustushakuData(thunkAPI.getState().arviointi).hakuData.avustushaku
    .id
  const hakemus = getHakemus(thunkAPI.getState().arviointi, hakemusId)
  const { hasChanges, ...actualArvio } = hakemus.arvio
  if (hasChanges) {
    const res = await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/arvio`,
      actualArvio
    )
    return {
      budgetGranted: res['budget-granted'],
    }
  }
  throw Error('no changes')
})

export const startHakemusArvioAutoSave = createAction<{ hakemusId: number }>(
  'arviointi/startHakemusArvioAutoSave'
)

export const saveHakemusArvioSoon = createAction<{ hakemusId: number }>(
  'arviointi/saveHakemusArvioSoon'
)

export const updateHakemusStatus = createAsyncThunk<
  ChangeRequest[],
  { hakemusId: number; status: HakemusStatus; comment: string },
  { state: HakemustenArviointiRootState; rejectValue: string }
>('arviointi/updateHakemusStatus', async ({ hakemusId, status, comment }, thunkAPI) => {
  const state = thunkAPI.getState().arviointi
  const { hakuData } = getLoadedAvustushakuData(state)
  const avustushakuId = hakuData.avustushaku.id
  await HttpUtil.post(`/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/status`, {
    status,
    comment,
  })
  return await HttpUtil.get<ChangeRequest[]>(
    `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/change-requests`
  )
})

export const addHakemusComment = createAsyncThunk<
  Comment[],
  { hakemusId: number; comment: string },
  { state: HakemustenArviointiRootState }
>('arviointi/addHakemusComment', async ({ hakemusId, comment }, thunkAPI) => {
  const avustushakuId = getLoadedAvustushakuData(thunkAPI.getState().arviointi).hakuData.avustushaku
    .id
  return await HttpUtil.post(`/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/comments`, {
    comment,
  })
})

export const updateHakemukset = createAsyncThunk<HakuData, { avustushakuId: number }>(
  'arviointi/updateHakemukset',
  async ({ avustushakuId }) => {
    return await HttpUtil.get<HakuData>(`/api/avustushaku/${avustushakuId}`)
  }
)

export const refreshHakemus = createAsyncThunk<
  void,
  { hakemusId: number },
  { state: HakemustenArviointiRootState }
>('arviointi/refreshHakemus', async ({ hakemusId }, thunkAPI) => {
  await thunkAPI.dispatch(selectHakemus(hakemusId))
})

export const addPayment = createAsyncThunk<
  Payment,
  {
    paymentSum: number
    index: number
    hakemusId: number
    projectCode: string | undefined
  },
  { state: HakemustenArviointiRootState; rejectValue: string }
>('arviointi/addPayment', async ({ paymentSum, index, hakemusId, projectCode }, thunkAPI) => {
  const hakemus = getHakemus(thunkAPI.getState().arviointi, hakemusId)
  return await HttpUtil.post('/api/v2/payments/', {
    'application-id': hakemus!.id,
    'application-version': hakemus!.version,
    'paymentstatus-id': 'waiting',
    'batch-id': null,
    'payment-sum': paymentSum,
    'project-code': projectCode,
    phase: index,
  })
})

export const removePayment = createAsyncThunk<
  void,
  { paymentId: number; hakemusId: number },
  { state: HakemustenArviointiRootState }
>('arviointi/removePayment', async ({ paymentId }) => {
  await HttpUtil.delete(`/api/v2/payments/${paymentId}/`)
})

export const setScore = createAsyncThunk<
  { scoring: Scoring; scores: Score[] },
  { selectionCriteriaIndex: number; newScore: number; hakemusId: number },
  { state: HakemustenArviointiRootState }
>('arviointi/setScore', async ({ newScore, selectionCriteriaIndex, hakemusId }, thunkAPI) => {
  const avustushakuId = getLoadedAvustushakuData(thunkAPI.getState().arviointi).hakuData.avustushaku
    .id
  return await HttpUtil.post(`/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/scores`, {
    'selection-criteria-index': selectionCriteriaIndex,
    score: newScore,
  })
})

export const removeScore = createAsyncThunk<
  { scoring: Scoring; scores: Score[] },
  { index: number; hakemusId: number },
  { state: HakemustenArviointiRootState }
>('arviointi/removeScore', async ({ index, hakemusId }, thunkAPI) => {
  const evaluationId = getHakemus(thunkAPI.getState().arviointi, hakemusId).arvio.id
  await HttpUtil.delete(`/api/avustushaku/evaluations/${evaluationId}/scores/${index}/`)
  const avustushakuId = getLoadedAvustushakuData(thunkAPI.getState().arviointi).hakuData.avustushaku
    .id
  return await HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/scores`)
})

export const selectProject = createAsyncThunk<
  VaCodeValue,
  { hakemusId: number; project: VaCodeValue },
  { state: HakemustenArviointiRootState }
>('arviointi/selectProject', async ({ project, hakemusId }, thunkAPI) => {
  const avustushakuId = getLoadedAvustushakuData(thunkAPI.getState().arviointi).hakuData.avustushaku
    .id
  await HttpUtil.post(`/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/project`, project)
  return project
})

interface SaveStatus {
  saveInProgress: boolean
  saveTime: string | null
  serverError: string
}

export interface AvustushakuData {
  hakuData: HakuData
  projects: VaCodeValue[]
  lahetykset: LahetysStatuses
  earliestPaymentCreatedAt?: string
}

export interface ArviointiState {
  avustushaut?: DropdownAvustushaku[]
  avustushakuData?: AvustushakuData
  saveStatus: SaveStatus
  loadStatus: {
    loadingHakemusId: number | null
    loadingAvustushaku: boolean
    loadError: boolean
  }
  modal: React.JSX.Element | undefined
  showOthersScores?: boolean
}

const initialState: ArviointiState = {
  avustushaut: undefined,
  avustushakuData: undefined,
  loadStatus: {
    loadingAvustushaku: false,
    loadingHakemusId: null,
    loadError: false,
  },
  saveStatus: {
    saveInProgress: false,
    saveTime: null,
    serverError: '',
  },
  modal: undefined,
}

type ArvioAction<T extends keyof Arvio> = PayloadAction<{
  key: T
  value: Arvio[T]
  hakemusId: number
}>

const saveStatusAwareActions = [
  setKeskeytettyAloittamatta,
  addPayment,
  selectProject,
  removePayment,
  updateHakemusStatus,
  addHakemusComment,
  setScore,
  removeScore,
  saveHakemusArvio,
] as const

const arviointiSlice = createSlice({
  name: 'hakemustenArviointi',
  initialState,
  reducers: {
    setArvioValue: <_ = ArviointiState, T extends keyof Arvio = 'id'>(
      state: Draft<ArviointiState>,
      { payload }: ArvioAction<T>
    ) => {
      const { hakemusId, key, value } = payload
      const hakemus = getHakemus(state, hakemusId)
      hakemus.arvio.hasChanges = true
      hakemus.arvio[key] = value
    },
    setArvioFieldValue: (
      state: Draft<ArviointiState>,
      { payload }: PayloadAction<{ hakemusId: number; answer: Answer; index: number }>
    ) => {
      const { hakemusId, answer, index } = payload
      const hakemus = getHakemus(state, hakemusId)
      hakemus.arvio.hasChanges = true
      hakemus.arvio['overridden-answers']?.value?.splice(index, 1, answer)
    },
    setMuutoshakemukset: (
      state,
      {
        payload,
      }: PayloadAction<{
        hakemusId: number
        muutoshakemukset: MuutoshakemusType[]
      }>
    ) => {
      const { hakemusId, muutoshakemukset } = payload
      const hakemus = getHakemus(state, hakemusId)
      hakemus.muutoshakemukset = muutoshakemukset
    },
    toggleShowOthersScore: (state) => {
      state.showOthersScores = !state.showOthersScores
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvustushaut.fulfilled, (state, { payload }) => {
        state.avustushaut = payload
      })
      .addCase(setKeskeytettyAloittamatta.pending, (state, { meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus['keskeytetty-aloittamatta'] = meta.arg.keskeyta
        hakemus.refused = meta.arg.keskeyta
      })
      .addCase(setKeskeytettyAloittamatta.rejected, (state, { meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus['keskeytetty-aloittamatta'] = !meta.arg.keskeyta
        hakemus.refused = !meta.arg.keskeyta
      })
      .addCase(setKeskeytettyAloittamatta.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus['keskeytetty-aloittamatta'] = payload['keskeytetty-aloittamatta']
        hakemus.refused = payload.refused
      })
      .addCase(selectHakemus.pending, (state, { meta }) => {
        state.loadStatus.loadingHakemusId = meta.arg
        state.loadStatus.loadError = false
      })
      .addCase(selectHakemus.rejected, (state) => {
        state.loadStatus.loadingHakemusId = null
        state.loadStatus.loadError = true
      })
      .addCase(selectHakemus.fulfilled, (state, { payload, meta }) => {
        const hakemusId = meta.arg
        const { hakemukset } = getLoadedAvustushakuData(state).hakuData
        const index = hakemukset.findIndex((h) => h.id === hakemusId)
        state.loadStatus.loadingHakemusId = null
        state.loadStatus.loadError = false
        if (index != -1) {
          hakemukset[index] = {
            ...payload.hakemus,
            ...payload.extra,
          }
        }
      })
      .addCase(saveHakemusArvio.fulfilled, (state, { meta, payload }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus.arvio.hasChanges = false
        hakemus.arvio['budget-granted'] = payload.budgetGranted
      })
      .addCase(updateHakemukset.fulfilled, (state, { payload }) => {
        const loadedState = getLoadedAvustushakuData(state)
        loadedState.hakuData = payload
      })
      .addCase(addPayment.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus.payments.push(payload)
      })
      .addCase(removePayment.fulfilled, (state, { meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        const index = hakemus.payments.findIndex((p) => p.id === meta.arg.paymentId)
        if (index !== -1) {
          hakemus.payments.splice(index, 1)
        }
      })
      .addCase(selectProject.fulfilled, (state, { meta, payload }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus.project = payload
      })
      .addCase(updateHakemusStatus.fulfilled, (state, { meta, payload }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus.status = meta.arg.status
        hakemus.changeRequests = payload
      })
      .addCase(addHakemusComment.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus.comments = payload
      })
      .addCase(setScore.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus.arvio.scoring = payload.scoring
        hakemus.scores = payload.scores
      })
      .addCase(removeScore.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId)
        hakemus.arvio.scoring = payload.scoring
        hakemus.scores = payload.scores
      })
      .addCase(fetchAvustushakuInfo.pending, (state) => {
        state.avustushakuData = undefined
        state.loadStatus.loadingAvustushaku = true
        state.loadStatus.loadError = false
      })
      .addCase(fetchAvustushakuInfo.rejected, (state) => {
        state.loadStatus.loadingAvustushaku = false
        state.loadStatus.loadError = true
      })
      .addCase(fetchAvustushakuInfo.fulfilled, (state, { payload }) => {
        state.avustushakuData = payload
        state.loadStatus.loadingAvustushaku = false
      })
      .addMatcher(isAnyOf(isRejected(...saveStatusAwareActions)), (state) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: 'unexpected-save-error',
        }
      })
      .addMatcher(
        isAnyOf(
          isPending(...saveStatusAwareActions),
          startHakemusArvioAutoSave,
          saveHakemusArvioSoon
        ),
        (state) => {
          state.saveStatus = {
            saveInProgress: true,
            saveTime: null,
            serverError: '',
          }
        }
      )
      .addMatcher(isAnyOf(isFulfilled(...saveStatusAwareActions)), (state) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: new Date().toISOString(),
          serverError: '',
        }
      })
  },
})

export const getLoadedAvustushakuData = (state: ArviointiState) => {
  if (state.loadStatus.loadingAvustushaku || !state.avustushakuData) {
    throw Error('Tried to access data before it was loaded')
  }
  return state.avustushakuData
}

export const getHakemus = (state: ArviointiState, hakemusId: number) => {
  const { hakuData } = getLoadedAvustushakuData(state)
  const hakemus = hakuData.hakemukset.find((h) => h.id === hakemusId)
  if (!hakemus) {
    throw Error(`Hakemus with id ${hakemusId} not found`)
  }
  return hakemus
}

export const hasMultibatchPayments = ({ arviointi }: HakemustenArviointiRootState): boolean => {
  const { hakuData } = getLoadedAvustushakuData(arviointi)
  const { avustushaku } = hakuData
  const multiplemaksuera = avustushaku.content.multiplemaksuera === true
  return multiplemaksuera
}

export const { setArvioValue, setArvioFieldValue, setMuutoshakemukset, toggleShowOthersScore } =
  arviointiSlice.actions

export default arviointiSlice.reducer
