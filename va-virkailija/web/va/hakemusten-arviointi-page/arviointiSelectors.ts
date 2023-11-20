import { useUserInfo } from '../initial-data-context'
import { VALMISTELIJA_ROLES } from '../types'
import { ArviointiState, getHakemus, getLoadedAvustushakuData } from './arviointiReducer'
import { useHakemustenArviointiSelector as useSelector } from './arviointiStore'

export const useUserRoles = (hakemusId: number) => {
  const { hakuData } = useSelector((state) => getLoadedAvustushakuData(state.arviointi))
  const userInfo = useUserInfo()
  const { roles } = hakuData
  const hakemus = useSelector((state) => getHakemus(state.arviointi, hakemusId))

  const fallbackPresenter = roles.find((r) =>
    (VALMISTELIJA_ROLES as readonly string[]).includes(r.role)
  )
  const hakemukselleUkotettuValmistelija =
    roles.find((r) => r.id === hakemus.arvio['presenter-role-id']) || fallbackPresenter
  const userOid = userInfo['person-oid']
  const isCurrentUserHakemukselleUkotettuValmistelija =
    hakemukselleUkotettuValmistelija?.oid === userOid
  const userRole = roles.find((r) => r.oid === userOid)?.role
  const isPresentingOfficer =
    userRole && (VALMISTELIJA_ROLES as readonly string[]).includes(userRole)

  return {
    isPresentingOfficer,
    hakemukselleUkotettuValmistelija,
    isCurrentUserHakemukselleUkotettuValmistelija,
  }
}

export const isHakemusLoading = (state: ArviointiState): boolean =>
  !!state.saveStatus.loadingHakemusId
