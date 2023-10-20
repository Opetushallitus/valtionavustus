import React from 'react'

import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import { Role, UserInfo } from '../../../types'
import { Taloustarkastus, Asiatarkastus } from './LoppuselvitysTarkastus'

import './LoppuselvitysForm.less'

type LoppuselvitysFormProps = {
  avustushaku: Avustushaku
  hakemus: Hakemus
  userInfo: UserInfo
  presenter?: Role
}

export const LoppuselvitysForm = ({ hakemus, userInfo, presenter }: LoppuselvitysFormProps) => {
  const status = hakemus['status-loppuselvitys']
  const showTaydennyspyynto = status !== 'missing'

  const allowedToDoAsiatarkastus =
    isPääkäyttäjä(userInfo) || presenter?.oid === userInfo['person-oid']
  const asiatarkastusEnabled = status === 'submitted' && allowedToDoAsiatarkastus
  const taloustarkastusEnabled = status === 'information_verified' || status === 'accepted'
  return (
    <div className="information-verification">
      {showTaydennyspyynto && allowedToDoAsiatarkastus && (
        <Asiatarkastus disabled={taloustarkastusEnabled} />
      )}
      {showTaydennyspyynto && (
        <Taloustarkastus disabled={asiatarkastusEnabled || status === 'accepted'} />
      )}
    </div>
  )
}

function isPääkäyttäjä(userInfo: UserInfo): boolean {
  return userInfo.privileges.includes('va-admin')
}
