import React, { useState } from 'react'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import { Role, UserInfo } from '../../../types'
import { useFeature } from '../../../initial-data-context'
import { useHakemustenArviointiDispatch } from '../../arviointiStore'
import { refreshHakemus } from '../../arviointiReducer'
import { VerificationBox } from './VerificationBox'
import { Taloustarkastus, Asiatarkastus } from './LoppuselvitysTarkastus'

import './LoppuselvitysForm.less'

type LoppuselvitysFormProps = {
  avustushaku: Avustushaku
  hakemus: Hakemus
  userInfo: UserInfo
  presenter?: Role
}

export const LoppuselvitysForm = ({
  avustushaku,
  hakemus,
  userInfo,
  presenter,
}: LoppuselvitysFormProps) => {
  const [message, setMessage] = useState('')
  const dispatch = useHakemustenArviointiDispatch()
  const status = hakemus['status-loppuselvitys']
  const taydennyspyyntoEnabled = useFeature('loppuselvitys-taydennyspyynto')
  const showTaydennyspyynto = taydennyspyyntoEnabled && status !== 'missing'

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    await HttpUtil.post(
      `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/loppuselvitys/verify-information`,
      { message }
    )
    dispatch(
      refreshHakemus({
        hakemusId: hakemus.id,
      })
    )
  }

  const allowedToDoAsiatarkastus =
    isPääkäyttäjä(userInfo) || presenter?.oid === userInfo['person-oid']
  const asiatarkastusEnabled = status === 'submitted' && allowedToDoAsiatarkastus
  const taloustarkastusEnabled = status === 'information_verified' || status === 'accepted'
  return (
    <div className="information-verification">
      {asiatarkastusEnabled && !showTaydennyspyynto && (
        <form onSubmit={onSubmit}>
          <div className="verification-comment">
            <h2 className="verification-header">Asiatarkastus</h2>
            <textarea
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              name="information-verification"
              placeholder="Kirjaa tähän mahdolliset huomiot asiatarkastuksesta"
            />
          </div>
          <div className="verification-footer">
            <button type="submit" name="submit-verification" disabled={!message}>
              Hyväksy asiatarkastus ja lähetä taloustarkastukseen
            </button>
          </div>
        </form>
      )}
      {taloustarkastusEnabled && !showTaydennyspyynto && (
        <div>
          <div className="verification-comment">
            <h2 className="verification-header">Asiatarkastus</h2>
            <textarea
              disabled={true}
              rows={5}
              name="information-verification"
              value={hakemus['loppuselvitys-information-verification']}
            />
          </div>
          <VerificationBox
            title="Asiatarkastettu"
            date={hakemus['loppuselvitys-information-verified-at']}
            verifier={hakemus['loppuselvitys-information-verified-by']}
          />
        </div>
      )}
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
