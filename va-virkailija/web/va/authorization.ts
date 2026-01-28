import { UserInfo } from './types'

export function isPääkäyttäjä(userInfo: UserInfo): boolean {
  return userInfo.privileges.includes('va-admin')
}
