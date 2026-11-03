import { Privileges, UserInfo } from './types'

export function isPääkäyttäjä(userInfo: UserInfo): boolean {
  return userInfo.privileges.includes('va-admin')
}

export function hasEditHakuPrivilege(avustushaku: { privileges?: Privileges }): boolean {
  return !!avustushaku.privileges?.['edit-haku']
}
