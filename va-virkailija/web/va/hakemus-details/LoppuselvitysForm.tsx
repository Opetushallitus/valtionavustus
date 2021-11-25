import React, { useState } from 'react'
import moment from 'moment'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { fiLongDateTimeFormatWithKlo } from 'va-common/web/va/i18n/dateformat'
import { Avustushaku, Hakemus } from 'va-common/web/va/types'
import HakemustenArviointiController from '../HakemustenArviointiController'
import { Role, UserInfo } from '../types'

import './LoppuselvitysForm.less'
import _ from 'lodash'

type LoppuselvitysFormProps = {
  avustushaku: Avustushaku
  controller: HakemustenArviointiController
  hakemus: Hakemus
  userInfo: UserInfo
  presenter?: Role
}

const formatDate = (date?: string) => {
  const d = moment(date)
  return d?.format(fiLongDateTimeFormatWithKlo)
}

export const LoppuselvitysForm = ({ avustushaku, hakemus, controller, userInfo, presenter }: LoppuselvitysFormProps) => {
  const [message, setMessage] = useState('')
  const status = hakemus['status-loppuselvitys']

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    await HttpUtil.post(`/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/loppuselvitys/verify-information`, { message })
    controller.refreshHakemukset(avustushaku.id)
  }

  const allowedToDoAsiatarkastus = isPääkäyttäjä(userInfo) || (presenter?.oid && presenter?.oid === userInfo["person-oid"])

  return (
    <div className="information-verification">
      {status === 'submitted' && allowedToDoAsiatarkastus &&
        <form onSubmit={onSubmit}>
          <div className="verification-comment">
            <h2 className="verification-header">Asiatarkastus</h2>
            <textarea onChange={(e) => setMessage(e.target.value)} rows={5} name="information-verification" placeholder="Kirjaa tähän mahdolliset huomiot asiatarkastuksesta" />
          </div>
          <div className="verification-footer">
            <button type="submit" name="submit-verification" disabled={!message}>Hyväksy asiatarkastus ja lähetä taloustarkastukseen</button>
          </div>
        </form>}
      {(status === 'information_verified' || status === 'accepted') &&
        <div>
          <div className="verification-comment">
            <h2 className="verification-header">Asiatarkastus</h2>
            <textarea disabled={true} rows={5} name="information-verification" value={hakemus['loppuselvitys-information-verification']} />
          </div>
          <div className="verification-footer">
            <h3 className="verification-footer-header">Asiatarkastettu</h3>
            <span className="verification-footer-info" data-test-id="verified-at">{formatDate(hakemus['loppuselvitys-information-verified-at'])}</span>
            <span className="verification-footer-info" data-test-id="verifier">{hakemus['loppuselvitys-information-verified-by']}</span>
          </div>
        </div>}
    </div>)
}

function isPääkäyttäjä(userInfo: UserInfo): boolean {
  return _.includes(userInfo.privileges, "va-admin")
}
