import React from 'react'

import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import { Role, UserInfo } from '../../../types'
import { isPääkäyttäjä } from '../../../authorization'
import { Taloustarkastus, Asiatarkastus } from './LoppuselvitysTarkastus'

import './LoppuselvitysForm.css'
import ViestiLista from '../ViestiLista'

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
  const approvedBeforeAsiatarkastusFeature =
    hakemus['status-loppuselvitys'] === 'accepted' &&
    !hakemus['loppuselvitys-information-verified-at'] &&
    !hakemus['loppuselvitys-information-verified-at'] &&
    !hakemus['loppuselvitys-taloustarkastettu-at'] &&
    !hakemus['loppuselvitys-taloustarkastanut-name']
  const loppuselvitysEmail = hakemus.selvitys?.loppuselvitys?.['selvitys-email']
  if (approvedBeforeAsiatarkastusFeature && loppuselvitysEmail) {
    return (
      <>
        <div className="information-verification">
          Loppuselvitys on hyväksytty ennen asiatarkastustus-toiminnallisuuden lisäämistä
          järjestelmään, jonka vuoksi asiatarkastuksen kommentteja ei voida näyttää.
        </div>
        <ViestiLista
          messages={[
            {
              id: 0,
              receivers: loppuselvitysEmail.to,
              subject: loppuselvitysEmail.subject,
              message: loppuselvitysEmail.message,
              date: loppuselvitysEmail.send,
              sender: 'no-reply@oph.fi',
              reply_to: null,
              virkailija: '',
            },
          ]}
          heading="Hyväksytty"
        ></ViestiLista>
      </>
    )
  }
  return (
    <div className="information-verification">
      {showTaydennyspyynto && (
        <Asiatarkastus disabled={!allowedToDoAsiatarkastus || taloustarkastusEnabled} />
      )}
      {showTaydennyspyynto && (
        <Taloustarkastus disabled={asiatarkastusEnabled || status === 'accepted'} />
      )}
    </div>
  )
}
