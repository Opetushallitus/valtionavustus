import {
  AsyncThunkPayloadCreator,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import { ValidationResult, Privileges, Role, Selvitys, UserInfo, VaCodeValue } from '../types'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import {
  Avustushaku as BaseAvustushaku,
  AvustushakuStatus,
  AvustushakuType,
  Form,
  HelpTexts,
  Koodisto,
  Koodistos,
  Language,
  Liite,
  Payment,
} from 'soresu-form/web/va/types'
import HttpUtil from 'soresu-form/web/HttpUtil'
import _ from 'lodash'
import FormUtil from 'soresu-form/web/form/FormUtil'

declare global {
  interface Window {
    __VA_AUTOSAVE_TIMEOUT__?: number
  }
}

const DEFAULT_AUTOSAVE_TIMEOUT = 3000
const getAutosaveTimeout = () => window.__VA_AUTOSAVE_TIMEOUT__ ?? DEFAULT_AUTOSAVE_TIMEOUT
import { fiLongDateTimeFormat, parseFinnishTimestamp } from 'soresu-form/web/va/i18n/dateformat'
import { HakujenHallintaRootState } from './hakujenHallintaStore'
import { TalousarviotiliWithUsageInfo } from '../koodienhallinta-page/types'

export interface TalousarviotiliWithKoulutusasteet extends TalousarviotiliWithUsageInfo {
  koulutusasteet: string[]
}

const ValiselvitysForm = require('../data/ValiselvitysForm.json') as Form
const LoppuselvitysForm = require('../data/LoppuselvitysForm.json') as Form

export interface VirkailijaAvustushaku extends BaseAvustushaku {
  roles?: Role[]
  payments?: Payment[]
  privileges?: Privileges
  formContent?: Form
  loppuselvitysForm?: Form
  valiselvitysForm?: Form
  muutoshakukelpoisuus?: ValidationResult
  vastuuvalmistelija?: string
  'paatokset-lahetetty'?: string
  'maksatukset-lahetetty'?: string
  'valiselvitykset-lahetetty'?: string
  'loppuselvitykset-lahetetty'?: string
  'maksatukset-summa'?: number
  'use-overridden-detailed-costs'?: boolean | null
  projects?: VaCodeValue[]
  talousarviotilit?: (TalousarviotiliWithKoulutusasteet | undefined)[]
}

export interface LainsaadantoOption {
  id: number
  name: string
}

interface InitialData {
  hakuList: VirkailijaAvustushaku[]
  userInfo: UserInfo
  environment: EnvironmentApiResponse
  codeOptions: VaCodeValue[]
  lainsaadantoOptions: LainsaadantoOption[]
  decisionLiitteet: Liite[]
  helpTexts: HelpTexts
}

interface OnSelectHakuData {
  muutoshakukelpoisuus: ValidationResult
  privileges: Privileges
  roles: Role[]
  projects: VaCodeValue[]
  payments: Payment[]
  formContent: Form
  avustushaku: BaseAvustushaku
  valiselvitysForm: Form
  loppuselvitysForm: Form
  talousarviotilit: TalousarviotiliWithKoulutusasteet[]
}

type ExtraSavingStateKeys = 'saveInProgress' | keyof ExtraSavingStates

const startSaving = (key: ExtraSavingStateKeys) => (state: State) => {
  state.saveStatus[key] = true
  state.saveStatus.saveTime = null
}

const saveSuccess = ({ saveStatus }: State, key: ExtraSavingStateKeys): SaveStatus => {
  return {
    ...saveStatus,
    [key]: false,
    saveTime: new Date().toISOString(),
    serverError: undefined,
  }
}

type ExtraSavingStates = {
  savingRoles: boolean
  savingForm: boolean
  savingTalousarviotilit: boolean
  savingManuallyRefactorToOwnActionsAtSomepoint: boolean
  sendingMaksatuksetAndTasmaytysraportti: boolean
  sendingMaksatuksetAndTasmaytysraporttiFailed: boolean
}

type SaveStatus = {
  saveInProgress: boolean
  saveTime: string | null
  serverError?: string
} & ExtraSavingStates

interface State {
  initialData: { loading: false; data: InitialData } | { loading: true }
  saveStatus: SaveStatus
  loadStatus: {
    loadingAvustushaku: boolean
    error: boolean
  }
  formDrafts: Record<number, Form>
  formDraftsJson: Record<number, string>
  loppuselvitysFormDrafts: Record<number, Form>
  loppuselvitysFormDraftsJson: Record<number, string>
  valiselvitysFormDrafts: Record<number, Form>
  valiselvitysFormDraftsJson: Record<number, string>
  koodistos: Koodistos
  loadingProjects: boolean
}

function appendDefaultAvustuksenAlkamisAndPaattymispaivaIfMissing(
  avustushaku: VirkailijaAvustushaku
): VirkailijaAvustushaku {
  const today = new Date().toISOString().split('T')[0]
  return {
    ...avustushaku,
    ['hankkeen-alkamispaiva']: avustushaku['hankkeen-alkamispaiva'] ?? today,
    ['hankkeen-paattymispaiva']: avustushaku['hankkeen-paattymispaiva'] ?? today,
  }
}

export const ensureKoodistoLoaded = createAsyncThunk<
  Koodisto[],
  void,
  { state: HakujenHallintaRootState }
>(
  'haku/ensureKoodistoLoaded',
  async (_) => {
    const koodistos = await HttpUtil.get<Koodisto[]>('/api/koodisto/')
    return koodistos
  },
  {
    condition: (_, { getState }) => {
      const koodistosState = getState().haku.koodistos
      if (koodistosState.loading || koodistosState.content) {
        return false
      }
      return true
    },
  }
)

export const updateProjects = createAsyncThunk<
  void,
  { avustushakuId: number; projects: VaCodeValue[] },
  { state: HakujenHallintaRootState }
>('haku/updateProjects', async (payload, thunkAPI) => {
  thunkAPI.dispatch(updateProject(payload))
  thunkAPI.dispatch(startAutoSaveForAvustushaku(payload.avustushakuId))
  await HttpUtil.post(`/api/avustushaku/${payload.avustushakuId}/projects`, payload.projects)
})

export const startIndicatingThatSendingMaksatuksetAndTasmaytysraporttiFailed = createAsyncThunk<
  void,
  void,
  { state: HakujenHallintaRootState }
>('haku/startIndicatingThatSendingMaksatuksetAndTasmaytysraporttiFailed', async (_, thunkAPI) => {
  thunkAPI.dispatch(
    hakuSlice.actions.startIndicatingThatSendingMaksatuksetAndTasmaytysraporttiFailed()
  )
  setTimeout(
    () => thunkAPI.dispatch(hakuSlice.actions.stopIndicatingThatSendingMaksatuksetFailed()),
    5000
  )
})

export const replaceTalousarviotilit = createAsyncThunk<
  void,
  {
    avustushakuId: number
    talousarviotilit: (TalousarviotiliWithKoulutusasteet | undefined)[]
  },
  { state: HakujenHallintaRootState }
>('haku/updateTalousarviotilit', async (payload, thunkAPI) => {
  thunkAPI.dispatch(updateTalousarviotilit(payload))
  const removeEmptyKoulutusasteet = (aste: string) => aste !== ''
  const removeEmptyTalousarviot = (
    tili: TalousarviotiliWithKoulutusasteet | undefined
  ): tili is TalousarviotiliWithKoulutusasteet => tili !== undefined
  await HttpUtil.post(
    `/api/avustushaku/${payload.avustushakuId}/talousarviotilit`,
    payload.talousarviotilit
      .filter(removeEmptyTalousarviot)
      .map(({ avustushaut, koulutusasteet, ...rest }) => ({
        ...rest,
        koulutusasteet: koulutusasteet.filter(removeEmptyKoulutusasteet),
      }))
  )
})

export const fetchInitialState = createAsyncThunk<
  InitialData,
  void,
  { state: HakujenHallintaRootState }
>('haku/fetchInitialState', async () => {
  const [
    hakuList,
    userInfo,
    environment,
    codeOptions,
    lainsaadantoOptions,
    decisionLiitteet,
    helpTexts,
  ] = await Promise.all([
    HttpUtil.get<VirkailijaAvustushaku[]>('/api/avustushaku/listing'),
    HttpUtil.get<UserInfo>('/api/userinfo'),
    HttpUtil.get<EnvironmentApiResponse>('/environment'),
    HttpUtil.get<VaCodeValue[]>('/api/v2/va-code-values/'),
    HttpUtil.get<LainsaadantoOption[]>('/api/avustushaku/lainsaadanto-options'),
    HttpUtil.get('/api/paatos/liitteet'),
    HttpUtil.get<HelpTexts>('/api/help-texts/all'),
  ])
  const modifiedHakuList = hakuList.map(appendDefaultAvustuksenAlkamisAndPaattymispaivaIfMissing)
  return {
    hakuList: modifiedHakuList,
    userInfo,
    environment,
    codeOptions,
    lainsaadantoOptions,
    decisionLiitteet,
    helpTexts,
  }
})

const appendBudgetComponent = (selvitysType: Selvitys, formContent: Form | undefined) => {
  const form = selvitysType === 'valiselvitys' ? ValiselvitysForm : LoppuselvitysForm
  const originalVaBudget =
    formContent?.content && FormUtil.findFieldByFieldType(formContent?.content, 'vaBudget')
  if (originalVaBudget) {
    const childrenWithoutBudgetSummary = originalVaBudget.children?.filter(
      (i) => i.id !== 'budget-summary'
    )
    const selvitysVaBudget = FormUtil.findFieldByFieldType(form.content, 'vaBudget')
    if (selvitysVaBudget) {
      selvitysVaBudget.children = childrenWithoutBudgetSummary
    } else {
      form.content.push({
        fieldClass: 'wrapperElement',
        id: 'financing-plan',
        fieldType: 'theme',
        children: [
          {
            fieldClass: 'wrapperElement',
            id: 'budget',
            fieldType: 'vaBudget',
            children: childrenWithoutBudgetSummary,
          },
        ],
        label: {
          fi: 'Talousarvio',
          sv: 'Projektets budget',
        },
      })
    }
  }
  return form
}

const getSelvitysFormContent = async (
  avustushakuId: number,
  selvitysType: Selvitys,
  formContent: Form
) => {
  const form = appendBudgetComponent(selvitysType, formContent)
  return HttpUtil.post(`/api/avustushaku/${avustushakuId}/init-selvitysform/${selvitysType}`, form)
}

export const selectHaku = createAsyncThunk<
  OnSelectHakuData,
  number,
  { state: HakujenHallintaRootState }
>('haku/selectHaku', async (avustushakuId, thunkAPI) => {
  const [
    muutoshakukelpoisuus,
    privileges,
    roles,
    projects,
    payments,
    formContent,
    talousarviotilit,
  ] = await Promise.all([
    HttpUtil.get<ValidationResult>(
      `/api/avustushaku/${avustushakuId}/onko-muutoshakukelpoinen-avustushaku-ok`
    ),
    HttpUtil.get<Privileges>(`/api/avustushaku/${avustushakuId}/privileges`),
    HttpUtil.get<Role[]>(`/api/avustushaku/${avustushakuId}/role`),
    HttpUtil.get<VaCodeValue[]>(`/api/avustushaku/${avustushakuId}/projects`),
    HttpUtil.get<Payment[]>(`/api/v2/grants/${avustushakuId}/payments/`),
    HttpUtil.get<Form>(`/api/avustushaku/${avustushakuId}/form`),
    HttpUtil.get<TalousarviotiliWithKoulutusasteet[]>(
      `/api/avustushaku/${avustushakuId}/talousarviotilit`
    ),
  ])
  const valiselvitysForm = await getSelvitysFormContent(avustushakuId, 'valiselvitys', formContent)
  const loppuselvitysForm = await getSelvitysFormContent(
    avustushakuId,
    'loppuselvitys',
    formContent
  )
  const avustushaku = selectAvustushaku(thunkAPI.getState().haku, avustushakuId)
  return {
    muutoshakukelpoisuus,
    privileges,
    roles,
    projects,
    payments,
    formContent,
    avustushaku,
    valiselvitysForm,
    loppuselvitysForm,
    talousarviotilit,
  }
})

function avustusHakuPayload(haku: VirkailijaAvustushaku) {
  const payload = _.omit(haku, [
    'roles',
    'formContent',
    'privileges',
    'valiselvitysForm',
    'loppuselvitysForm',
    'payments',
    'muutoshakukelpoisuus',
    'vastuuvalmistelija',
    'paatokset-lahetetty',
    'maksatukset-lahetetty',
    'valiselvitykset-lahetetty',
    'loppuselvitykset-lahetetty',
    'maksatukset-summa',
    'use-overridden-detailed-costs',
    'projects',
    'talousarviotilit',
  ])

  return {
    ...payload,
    valiselvitysdate: payload.valiselvitysdate === '' ? null : payload.valiselvitysdate,
    loppuselvitysdate: payload.loppuselvitysdate === '' ? null : payload.loppuselvitysdate,
  }
}

const saveHaku = createAsyncThunk<
  VirkailijaAvustushaku,
  VirkailijaAvustushaku,
  { rejectValue: string }
>('haku/saveHaku', async (selectedHaku, { rejectWithValue }) => {
  try {
    const data = await HttpUtil.post(
      `/api/avustushaku/${selectedHaku.id}`,
      avustusHakuPayload(selectedHaku)
    )
    return data as BaseAvustushaku
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      return rejectWithValue('validation-error')
    } else {
      return rejectWithValue('unexpected-save-error')
    }
  }
})

export const createHaku = createAsyncThunk<number, number, { state: HakujenHallintaRootState }>(
  'haku/createHaku',
  async (baseHakuId, thunkAPI) => {
    const newAvustushaku = await HttpUtil.put('/api/avustushaku', {
      baseHakuId,
    })
    thunkAPI.dispatch(addAvustushaku(newAvustushaku))
    return newAvustushaku.id
  }
)

export const createHakuRole = createAsyncThunk<
  { roles: Role[]; privileges: Privileges; avustushakuId: number },
  { role: Omit<Role, 'id'>; avustushakuId: number }
>('haku/createRole', async ({ role, avustushakuId }) => {
  await HttpUtil.put(`/api/avustushaku/${avustushakuId}/role`, role)
  const [roles, privileges] = await Promise.all([
    HttpUtil.get<Role[]>(`/api/avustushaku/${avustushakuId}/role`),
    HttpUtil.get<Privileges>(`/api/avustushaku/${avustushakuId}/privileges`),
  ])
  return { roles, privileges, avustushakuId }
})

export const deleteRole = createAsyncThunk<
  {
    roles: Role[]
    privileges: Privileges
    avustushakuId: number
  },
  { roleId: number; avustushakuId: number }
>('haku/deleteRole', async ({ roleId, avustushakuId }) => {
  await HttpUtil.delete(`/api/avustushaku/${avustushakuId}/role/${roleId}`)
  const [roles, privileges] = await Promise.all([
    HttpUtil.get<Role[]>(`/api/avustushaku/${avustushakuId}/role`),
    HttpUtil.get<Privileges>(`/api/avustushaku/${avustushakuId}/privileges`),
  ])
  return { roles, privileges, avustushakuId }
})

const saveRole = createAsyncThunk<
  | {
      roles: Role[]
      avustushakuId: number
      privileges: Privileges
    }
  | { privileges: Privileges; avustushakuId: number },
  { role: Role; avustushakuId: number }
>('haku/saveRole', async ({ role, avustushakuId }) => {
  await HttpUtil.post(`/api/avustushaku/${avustushakuId}/role/${role.id}`, role)
  const privileges = await HttpUtil.get<Privileges>(`/api/avustushaku/${avustushakuId}/privileges`)
  if (role.role === 'vastuuvalmistelija') {
    const roles = await HttpUtil.get<Role[]>(`/api/avustushaku/${avustushakuId}/role`)
    return {
      avustushakuId,
      roles,
      privileges,
    }
  } else {
    return {
      privileges,
      avustushakuId,
    }
  }
})

const callSaveRole: AsyncThunkPayloadCreator<
  void,
  { role: Role; avustushakuId: number },
  { state: HakujenHallintaRootState }
> = async ({ role, avustushakuId }, thunkAPI) => {
  thunkAPI.dispatch(saveRole({ role, avustushakuId }))
}

export const debouncedSaveRole = createAsyncThunk<void, { role: Role; avustushakuId: number }>(
  'haku/debouncedSaveRole',
  _.debounce(callSaveRole, getAutosaveTimeout())
)

const debouncedSave: AsyncThunkPayloadCreator<
  void,
  number,
  { state: HakujenHallintaRootState }
> = async (id, thunkAPI) => {
  const haku = selectAvustushaku(thunkAPI.getState().haku, id)
  thunkAPI.dispatch(saveHaku(haku))
}

const debouncedSaveFn = _.debounce(debouncedSave, getAutosaveTimeout())

const debouncedSaveHaku = createAsyncThunk<void, number, { state: HakujenHallintaRootState }>(
  'haku/debouncedSaveHaku',
  debouncedSaveFn
)

export const startAutoSaveForAvustushaku = createAsyncThunk<
  void,
  number,
  { state: HakujenHallintaRootState }
>('haku/startAutoSave', async (id, thunkAPI) => {
  thunkAPI.dispatch(debouncedSaveHaku(id))
})

export const saveHakuImmediately = createAsyncThunk<
  void,
  number,
  { state: HakujenHallintaRootState }
>('haku/saveHakuImmediately', async (id, thunkAPI) => {
  debouncedSaveFn.cancel()
  const haku = selectAvustushaku(thunkAPI.getState().haku, id)
  thunkAPI.dispatch(saveHaku(haku))
})

const selvitysFormMap = {
  valiselvitys: 'valiselvitysForm',
  loppuselvitys: 'loppuselvitysForm',
} as const

const selvitysFormDraftMap = {
  valiselvitys: 'valiselvitysFormDrafts',
  loppuselvitys: 'loppuselvitysFormDrafts',
} as const

const selvitysFormDraftJsonMap = {
  valiselvitys: 'valiselvitysFormDraftsJson',
  loppuselvitys: 'loppuselvitysFormDraftsJson',
} as const

export const recreateSelvitysForm = createAsyncThunk<
  void,
  {
    avustushaku: VirkailijaAvustushaku
    selvitysType: Selvitys
  }
>('haku/recreateSelvitysForm', async ({ avustushaku, selvitysType }, thunkAPI) => {
  const form = appendBudgetComponent(selvitysType, avustushaku.formContent)
  const avustushakuId = avustushaku.id
  thunkAPI.dispatch(selvitysFormUpdated({ selvitysType, avustushakuId, newDraft: form }))
  thunkAPI.dispatch(
    selvitysFormJsonUpdated({
      selvitysType,
      avustushakuId,
      newDraftJson: JSON.stringify(form, null, 2),
    })
  )
})

export const saveSelvitysForm = createAsyncThunk<
  { avustushakuId: number; form: Form; selvitysType: Selvitys },
  {
    avustushakuId: number
    form: Form
    selvitysType: Selvitys
  },
  { rejectValue: string }
>('haku/saveSelvitysForm', async ({ form, selvitysType, avustushakuId }, { rejectWithValue }) => {
  try {
    const response = await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/selvitysform/${selvitysType}`,
      form
    )
    return {
      avustushakuId,
      form: response,
      selvitysType,
    }
  } catch (error: any) {
    if (error && error.response.status === 400) {
      return rejectWithValue('validation-error')
    }
    return rejectWithValue('unexpected-save-error')
  }
})

export const saveForm = createAsyncThunk<
  {
    avustushakuId: number
    form: Form
    muutoshakukelpoinen: ValidationResult
  },
  { avustushakuId: number; form: Form },
  { rejectValue: string }
>('haku/saveForm', async ({ avustushakuId, form }, { rejectWithValue }) => {
  try {
    const formFromServer = await HttpUtil.post(`/api/avustushaku/${avustushakuId}/form`, form)
    const muutoshakukelpoinen = await HttpUtil.get<ValidationResult>(
      `/api/avustushaku/${avustushakuId}/onko-muutoshakukelpoinen-avustushaku-ok`
    )
    return {
      avustushakuId,
      form: formFromServer,
      muutoshakukelpoinen,
    }
  } catch (error: any) {
    if (error && error.response.status === 400) {
      return rejectWithValue('validation-error')
    }
    return rejectWithValue('unexpected-save-error')
  }
})

export const updateField = createAsyncThunk<
  void,
  {
    avustushaku: VirkailijaAvustushaku
    field: { id: string; name?: string; dataset?: any }
    newValue: any // TODO: should really be string | number | null
    immediate?: boolean
  },
  { state: HakujenHallintaRootState }
>('haku/updateField', async (update, thunkAPI) => {
  const fieldId = update.field.id
  const basicFields = [
    'loppuselvitysdate',
    'valiselvitysdate',
    'register-number',
    'hallinnoiavustuksia-register-number',
  ] as const
  let avustushaku = _.cloneDeep(update.avustushaku)
  if (basicFields.indexOf(fieldId as any) > -1) {
    avustushaku[fieldId as (typeof basicFields)[number]] = update.newValue
  } else if (fieldId === 'haku-self-financing-percentage') {
    avustushaku.content['self-financing-percentage'] = parseInt(update.newValue)
  } else if (fieldId.startsWith('haku-name-')) {
    const hakuname = /haku-name-(\w+)/.exec(fieldId)
    if (!hakuname) {
      throw Error(`Failed to find hakuname ${fieldId}`)
    }
    const lang = hakuname[1] as Language
    avustushaku.content.name[lang] = update.newValue
  } else if (fieldId.startsWith('hakuaika-')) {
    const hakuaika = /hakuaika-(\w+)/.exec(fieldId)
    if (!hakuaika) {
      throw Error(`Failed to find hakuaika ${fieldId}`)
    }
    const startOrEnd = hakuaika[1] as 'start' | 'end'
    const newDate = parseFinnishTimestamp(update.newValue, fiLongDateTimeFormat)
    avustushaku.content.duration[startOrEnd] = newDate.toISOString()
  } else if (fieldId === 'hankkeen-alkamispaiva' || fieldId === 'hankkeen-paattymispaiva') {
    avustushaku[fieldId] = update.newValue
  } else if (fieldId.startsWith('set-haku-type-')) {
    avustushaku['haku-type'] = update.newValue as AvustushakuType
  } else if (fieldId.startsWith('set-is_academysize-')) {
    avustushaku['is_academysize'] = update.newValue === 'true'
  } else if (fieldId.startsWith('set-status-')) {
    avustushaku['status'] = update.newValue as AvustushakuStatus
  } else if (fieldId.startsWith('selection-criteria-')) {
    const selectionCriteria = /selection-criteria-(\d+)-(\w+)/.exec(fieldId)
    if (!selectionCriteria) {
      throw Error(`Failed to find selectionCriteria ${fieldId}`)
    }
    const index = Number(selectionCriteria[1])
    const lang = selectionCriteria[2] as Language
    avustushaku.content['selection-criteria'].items[index][lang] = update.newValue
  } else if (fieldId.startsWith('focus-area-')) {
    const focusArea = /focus-area-(\d+)-(\w+)/.exec(fieldId)
    if (!focusArea) {
      throw Error(`Failed to find focusArea ${fieldId}`)
    }
    const index = Number(focusArea[1])
    const lang = focusArea[2] as Language
    avustushaku.content['focus-areas'].items[index][lang] = update.newValue
  } else if (fieldId.startsWith('set-maksuera-')) {
    avustushaku.content['multiplemaksuera'] = update.newValue === 'true'
  } else if (update.field.id.indexOf('decision.') !== -1) {
    const fieldName = update.field.id.slice(9)
    _.set(avustushaku.decision!, fieldName, update.newValue)
  } else if (fieldId.startsWith('operational-unit-id')) {
    avustushaku['operational-unit-id'] = update.newValue
  } else if (fieldId.startsWith('allow_visibility_in_external_system')) {
    avustushaku.allow_visibility_in_external_system = update.newValue === 'true'
  } else if (fieldId.startsWith('muutoshakukelpoinen')) {
    avustushaku.muutoshakukelpoinen = update.newValue === 'true'
  } else if (fieldId === 'arvioitu_maksupaiva') {
    avustushaku.arvioitu_maksupaiva = update.newValue
  } else if (update.field.name === 'payment-size-limit') {
    avustushaku.content['payment-size-limit'] = update.newValue
  } else if (fieldId === 'payment-fixed-limit') {
    avustushaku.content['payment-fixed-limit'] = parseInt(update.newValue)
  } else if (fieldId === 'payment-min-first-batch') {
    avustushaku.content['payment-min-first-batch'] = parseInt(update.newValue)
  } else if (fieldId === 'total-grant-size') {
    avustushaku.content['total-grant-size'] = parseInt(update.newValue)
  } else if (fieldId === 'transaction-account') {
    avustushaku.content['transaction-account'] = update.newValue
  } else if (fieldId === 'document-type') {
    avustushaku.content['document-type'] = update.newValue
  } else {
    console.error('Unsupported update to field ', update.field.id, ':', update)
  }
  thunkAPI.dispatch(updateAvustushaku(avustushaku))
  if (update.immediate) {
    thunkAPI.dispatch(saveHakuImmediately(avustushaku.id))
  } else {
    thunkAPI.dispatch(startAutoSaveForAvustushaku(avustushaku.id))
  }
})

const initialState: State = {
  initialData: {
    loading: true,
  },
  loadStatus: {
    loadingAvustushaku: false,
    error: false,
  },
  saveStatus: {
    saveInProgress: false,
    saveTime: null,
    serverError: '',
    savingRoles: false,
    savingForm: false,
    savingTalousarviotilit: false,
    savingManuallyRefactorToOwnActionsAtSomepoint: false,
    sendingMaksatuksetAndTasmaytysraportti: false,
    sendingMaksatuksetAndTasmaytysraporttiFailed: false,
  },
  formDrafts: {},
  formDraftsJson: {},
  loppuselvitysFormDrafts: {},
  loppuselvitysFormDraftsJson: {},
  valiselvitysFormDrafts: {},
  valiselvitysFormDraftsJson: {},
  koodistos: {
    content: null,
    loading: false,
  },
  loadingProjects: false,
}

const hakuSlice = createSlice({
  name: 'haku',
  initialState,
  reducers: {
    startManuallySaving: startSaving('savingManuallyRefactorToOwnActionsAtSomepoint'),
    startSendingMaksatuksetAndTasmaytysraportti: (state) => {
      state.saveStatus.sendingMaksatuksetAndTasmaytysraportti = true
    },
    stopSendingMaksatuksetAndTasmaytysraportti: (state) => {
      state.saveStatus.sendingMaksatuksetAndTasmaytysraportti = false
    },
    startIndicatingThatSendingMaksatuksetAndTasmaytysraporttiFailed: (state) => {
      state.saveStatus.sendingMaksatuksetAndTasmaytysraporttiFailed = true
    },
    stopIndicatingThatSendingMaksatuksetFailed: (state) => {
      state.saveStatus.sendingMaksatuksetAndTasmaytysraporttiFailed = false
    },
    completeManualSave: (state, { payload }: PayloadAction<boolean | undefined>) => {
      if (payload === false) {
        state.saveStatus.savingManuallyRefactorToOwnActionsAtSomepoint = false
        state.saveStatus.serverError = 'unexpected-save-error'
      } else {
        state.saveStatus = saveSuccess(state, 'savingManuallyRefactorToOwnActionsAtSomepoint')
      }
    },
    formUpdated: (state, { payload }: PayloadAction<{ avustushakuId: number; newForm: Form }>) => {
      state.formDrafts[payload.avustushakuId] = payload.newForm
      state.saveStatus.saveTime = null
    },
    formJsonUpdated: (
      state,
      { payload }: PayloadAction<{ avustushakuId: number; newFormJson: string }>
    ) => {
      state.formDraftsJson[payload.avustushakuId] = payload.newFormJson
      state.saveStatus.saveTime = null
    },
    selvitysFormUpdated: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number
        newDraft: Form
        selvitysType: Selvitys
      }>
    ) => {
      const { avustushakuId, newDraft, selvitysType } = payload
      state[selvitysFormDraftMap[selvitysType]][avustushakuId] = newDraft
      state.saveStatus.saveTime = null
    },
    selvitysFormJsonUpdated: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number
        newDraftJson: string
        selvitysType: Selvitys
      }>
    ) => {
      const { avustushakuId, selvitysType, newDraftJson } = payload
      state[selvitysFormDraftJsonMap[selvitysType]][avustushakuId] = newDraftJson
      state.saveStatus.saveTime = null
    },
    addAvustushaku: (state, { payload }: PayloadAction<BaseAvustushaku>) => {
      const hakuList = getHakuList(state)
      hakuList.unshift(payload)
    },
    updateAvustushaku: (state, { payload }: PayloadAction<VirkailijaAvustushaku>) => {
      const hakuList = getHakuList(state)
      const index = hakuList.findIndex(({ id }) => id === payload.id)
      hakuList[index] = payload
    },
    addFocusArea: (state, { payload }: PayloadAction<{ avustushakuId: number }>) => {
      const selectedHaku = selectAvustushaku(state, payload.avustushakuId)
      selectedHaku.content['focus-areas'].items.push({ fi: '', sv: '' })
    },
    deleteFocusArea: (
      state,
      { payload }: PayloadAction<{ avustushakuId: number; index: number }>
    ) => {
      const selectedHaku = selectAvustushaku(state, payload.avustushakuId)
      selectedHaku.content['focus-areas'].items.splice(payload.index, 1)
    },
    addSelectionCriteria: (state, { payload }: PayloadAction<{ avustushakuId: number }>) => {
      const selectedHaku = selectAvustushaku(state, payload.avustushakuId)
      selectedHaku.content['selection-criteria'].items.push({ fi: '', sv: '' })
    },
    removeSelectionCriteria: (
      state,
      { payload }: PayloadAction<{ avustushakuId: number; index: number }>
    ) => {
      const selectedHaku = selectAvustushaku(state, payload.avustushakuId)
      selectedHaku.content['selection-criteria'].items.splice(payload.index, 1)
    },
    updateProject: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number
        projects: VaCodeValue[]
      }>
    ) => {
      const selectedHaku = selectAvustushaku(state, payload.avustushakuId)
      if (selectedHaku.projects) {
        selectedHaku.projects = payload.projects
      }
    },
    updateTalousarviotilit: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number
        talousarviotilit: (TalousarviotiliWithKoulutusasteet | undefined)[]
      }>
    ) => {
      const selectedHaku = selectAvustushaku(state, payload.avustushakuId)
      selectedHaku!.talousarviotilit = payload.talousarviotilit
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialState.pending, (state) => {
        state.initialData.loading = true
      })
      .addCase(fetchInitialState.fulfilled, (state, action) => {
        state.initialData = {
          loading: false,
          data: action.payload,
        }
      })
      .addCase(selectHaku.pending, (state) => {
        state.loadStatus.loadingAvustushaku = true
      })
      .addCase(selectHaku.rejected, (state) => {
        state.loadStatus.loadingAvustushaku = false
        state.loadStatus.error = true
      })
      .addCase(selectHaku.fulfilled, (state, action) => {
        const { avustushaku, valiselvitysForm, loppuselvitysForm, ...rest } = action.payload
        const avustushakuId = avustushaku.id
        state.formDrafts[avustushakuId] = rest.formContent
        state.formDraftsJson[avustushakuId] = JSON.stringify(rest.formContent, null, 2)
        state.valiselvitysFormDrafts[avustushakuId] = valiselvitysForm
        state.valiselvitysFormDraftsJson[avustushakuId] = JSON.stringify(valiselvitysForm, null, 2)
        state.loppuselvitysFormDrafts[avustushakuId] = loppuselvitysForm
        state.loppuselvitysFormDraftsJson[avustushakuId] = JSON.stringify(
          loppuselvitysForm,
          null,
          2
        )
        const hakuList = getHakuList(state)
        const index = hakuList.findIndex(({ id }) => id === avustushakuId)
        hakuList[index] = {
          ...avustushaku,
          ...rest,
          valiselvitysForm,
          loppuselvitysForm,
        }
        state.loadStatus.loadingAvustushaku = false
        state.loadStatus.error = false
      })
      .addCase(saveHaku.fulfilled, (state, action) => {
        const response = action.payload
        const oldHaku = selectAvustushaku(state, response.id)
        oldHaku.status = response.status
        oldHaku.phase = response.phase
        oldHaku.decision!.updatedAt = response.decision?.updatedAt
        state.saveStatus = saveSuccess(state, 'saveInProgress')
        if (!oldHaku.projects || oldHaku.projects.length === 0) {
          state.saveStatus.serverError = 'validation-error'
        }
      })
      .addCase(saveHaku.rejected, (state, action) => {
        state.saveStatus.serverError = action.payload ?? 'unexpected-save-error'
        state.saveStatus.saveInProgress = false
      })
      .addCase(startAutoSaveForAvustushaku.pending, startSaving('saveInProgress'))
      .addCase(saveHakuImmediately.pending, startSaving('saveInProgress'))
      .addCase(createHakuRole.pending, startSaving('savingRoles'))
      .addCase(createHakuRole.fulfilled, (state, action) => {
        state.saveStatus = saveSuccess(state, 'savingRoles')
        const { avustushakuId, roles, privileges } = action.payload
        const haku = selectAvustushaku(state, avustushakuId)
        haku.roles = roles
        haku.privileges = privileges
      })
      .addCase(createHaku.rejected, (state) => {
        state.saveStatus.serverError = 'unexpected-create-error'
        state.saveStatus.saveInProgress = false
      })
      .addCase(debouncedSaveRole.pending, startSaving('savingRoles'))
      .addCase(saveRole.fulfilled, (state, action) => {
        state.saveStatus = saveSuccess(state, 'savingRoles')
        const payload = action.payload
        const haku = selectAvustushaku(state, payload.avustushakuId)
        if ('roles' in payload) {
          haku.roles = payload.roles
        } else {
          haku.privileges = payload.privileges
        }
      })
      .addCase(deleteRole.pending, startSaving('savingRoles'))
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.saveStatus = saveSuccess(state, 'savingRoles')
        const payload = action.payload
        const haku = selectAvustushaku(state, payload.avustushakuId)
        haku.privileges = payload.privileges
        haku.roles = payload.roles
      })
      .addCase(saveForm.pending, startSaving('savingForm'))
      .addCase(saveForm.fulfilled, (state, action) => {
        const { avustushakuId, form, muutoshakukelpoinen } = action.payload
        const haku = selectAvustushaku(state, avustushakuId)
        haku.formContent = form
        state.formDrafts[avustushakuId] = form
        state.formDraftsJson[avustushakuId] = JSON.stringify(form, null, 2)
        haku.muutoshakukelpoisuus = muutoshakukelpoinen
        state.saveStatus = saveSuccess(state, 'savingForm')
      })
      .addCase(saveForm.rejected, (state, action) => {
        state.saveStatus.savingForm = false
        state.saveStatus.serverError = action.payload ?? 'unexpected-save-error'
      })
      .addCase(saveSelvitysForm.pending, startSaving('savingForm'))
      .addCase(saveSelvitysForm.fulfilled, (state, action) => {
        const { avustushakuId, form, selvitysType } = action.payload
        const haku = selectAvustushaku(state, avustushakuId)
        haku[selvitysFormMap[selvitysType]] = form
        state[selvitysFormDraftMap[selvitysType]][avustushakuId] = form
        state[selvitysFormDraftJsonMap[selvitysType]][avustushakuId] = JSON.stringify(form, null, 2)
        state.saveStatus = saveSuccess(state, 'savingForm')
      })
      .addCase(saveSelvitysForm.rejected, (state, action) => {
        state.saveStatus.savingForm = false
        state.saveStatus.serverError = action.payload ?? 'unexpected-save-error'
      })
      .addCase(ensureKoodistoLoaded.pending, (state) => {
        state.koodistos.loading = true
      })
      .addCase(ensureKoodistoLoaded.fulfilled, (state, action) => {
        state.koodistos.content = action.payload
        state.koodistos.loading = false
      })
      .addCase(ensureKoodistoLoaded.rejected, (state) => {
        state.koodistos.content = null
        state.koodistos.loading = false
      })
      .addCase(replaceTalousarviotilit.pending, startSaving('savingTalousarviotilit'))
      .addCase(replaceTalousarviotilit.fulfilled, (state) => {
        state.saveStatus = saveSuccess(state, 'savingTalousarviotilit')
      })
      .addCase(replaceTalousarviotilit.rejected, (state) => {
        state.saveStatus.savingTalousarviotilit = false
        state.saveStatus.serverError = 'unexpected-save-error'
      })
  },
})

export const {
  startManuallySaving,
  completeManualSave,
  formUpdated,
  formJsonUpdated,
  selvitysFormUpdated,
  selvitysFormJsonUpdated,
  addAvustushaku,
  updateAvustushaku,
  addFocusArea,
  deleteFocusArea,
  updateProject,
  updateTalousarviotilit,
  addSelectionCriteria,
  removeSelectionCriteria,
  startSendingMaksatuksetAndTasmaytysraportti,
  stopSendingMaksatuksetAndTasmaytysraportti,
} = hakuSlice.actions

export default hakuSlice.reducer

const getHakuList = (state: State | HakujenHallintaRootState): VirkailijaAvustushaku[] => {
  if ('haku' in state) {
    if (state.haku.initialData.loading) {
      return []
    }
    return state.haku.initialData.data.hakuList
  }
  if (state.initialData.loading) {
    return []
  }
  return state.initialData.data.hakuList
}
export const getAvustushakuFromState = (state: State, avustushakuId: number) => {
  const hakuList = getHakuList(state)
  const haku = hakuList.find(({ id }) => id === avustushakuId)
  return haku
}

export const selectAvustushaku = (state: State, avustushakuId: number) => {
  const avustushaku = getAvustushakuFromState(state, avustushakuId)
  if (!avustushaku) {
    throw Error(`Expected to find avustushaku with id=${avustushakuId}`)
  }
  return avustushaku
}

export const selectLoadedInitialData = (state: HakujenHallintaRootState) => {
  const initialData = state.haku.initialData
  if (initialData.loading) {
    throw Error('Tried to use initialData before it was fetched')
  }
  return initialData.data
}

export const selectHakuState = (state: HakujenHallintaRootState) => state.haku
