import React, { useEffect, useState } from 'react'
import * as Bacon from 'baconjs'

import HttpUtil from 'soresu-form/web/HttpUtil'
import DateUtil from 'soresu-form/web/DateUtil'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import { HelpTooltip } from '../../../common-components/HelpTooltip'
import { UserInfo } from '../../../types'
import { useHakemustenArviointiDispatch } from '../../arviointiStore'
import { updateHakemusStatus } from '../../arviointiReducer'

type ChangeRequestProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  userInfo: UserInfo
  allowEditing?: boolean
}

type Mail = {
  subject: string
  sender: string
  content: string
}

export const ChangeRequest = ({
  avustushaku,
  hakemus,
  allowEditing,
  userInfo,
}: ChangeRequestProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const [mail, setMail] = useState<Mail>()
  const [preview, setPreview] = useState(false)
  const [newChangeRequest, setNewChangeRequest] = useState(false)
  const [changeRequest, setChangeRequest] = useState('')
  useEffect(() => {
    setPreview(false)
    setNewChangeRequest(false)
    setChangeRequest('')
    setMail(undefined)
  }, [hakemus.id, hakemus.status])

  const status = hakemus.status
  const hasChangeRequired = status === 'pending_change_request' || status === 'officer_edit'
  const changeRequestTitle =
    status === 'pending_change_request'
      ? 'Täydennyspyyntö lähetetty'
      : 'Virkailijan muokkaus avattu'
  const lastChangeRequest = hakemus.changeRequests?.length
    ? hakemus.changeRequests[hakemus.changeRequests.length - 1]
    : undefined
  const lastChangeRequestText = lastChangeRequest?.['status-comment']
  const lastChangeRequestTime = `${DateUtil.asDateString(
    lastChangeRequest?.['version-date']
  )} ${DateUtil.asTimeString(lastChangeRequest?.['version-date'])}`
  const canCancelChangeRequest =
    status === 'pending_change_request' &&
    (lastChangeRequest?.['user-oid'] === userInfo['person-oid'] ||
      userInfo.privileges.includes('va-admin'))

  const onPreview = () => {
    const sendS = Bacon.fromPromise<{ mail: Mail }>(
      HttpUtil.post(`/api/avustushaku/${avustushaku.id}/change-request-email`, {
        text: changeRequest,
      })
    )
    sendS.onValue((res) => {
      setMail(res.mail)
      setPreview(true)
    })
  }

  return (
    <div key={`changerequest-${hakemus.id}-${hakemus.status}`} className="value-edit">
      {newChangeRequest || hasChangeRequired ? (
        <label>Täydennyspyyntö</label>
      ) : (
        <button
          onClick={() => setNewChangeRequest(true)}
          disabled={!allowEditing}
          data-test-id="request-change-button"
        >
          Pyydä täydennystä
        </button>
      )}
      <HelpTooltip
        testId={'tooltip-taydennys'}
        textKey="hankkeen_sivu__arviointi___pyydä_täydennystä"
        direction="arviointi"
      />
      <div hidden={!newChangeRequest || !allowEditing}>
        <span onClick={() => setNewChangeRequest(false)} className="close"></span>
        <textarea
          placeholder="Kirjoita tähän hakijalle täydennyspyyntö ja määräaika, johon mennessä hakijan tulee vastata täydennyspyyntöön"
          onChange={(e) => setChangeRequest(e.target.value)}
          rows={4}
          disabled={!allowEditing}
          value={changeRequest}
        />
        <button
          disabled={!changeRequest.length}
          onClick={() => {
            dispatch(
              updateHakemusStatus({
                hakemusId: hakemus.id,
                status: 'pending_change_request',
                comment: changeRequest,
              })
            )
          }}
        >
          Lähetä
        </button>
        <a onClick={onPreview} style={{ position: 'relative' }}>
          Esikatsele
        </a>
        {preview && mail && (
          <div className="panel email-preview-panel">
            <span className="close" onClick={() => setPreview(false)}></span>
            <div data-test-id="change-request-preview-subject">
              <strong>Otsikko:</strong> {mail.subject}
              <br />
            </div>
            <div data-test-id="change-request-preview-sender">
              <strong>Lähettäjä:</strong> {mail.sender}
              <br />
              <br />
            </div>
            <div data-test-id="change-request-preview-content" style={{ whiteSpace: 'pre-line' }}>
              {mail.content}
            </div>
          </div>
        )}
      </div>
      <div hidden={!hasChangeRequired}>
        <div className="change-request-title">
          * {changeRequestTitle} {lastChangeRequestTime}
        </div>
        <pre className="change-request-text">{lastChangeRequestText}</pre>
      </div>
      {canCancelChangeRequest && (
        <button
          onClick={() => {
            dispatch(
              updateHakemusStatus({
                hakemusId: hakemus.id,
                status: 'submitted',
                comment: 'Täydennyspyyntö peruttu',
              })
            )
          }}
        >
          Peru täydennyspyyntö
        </button>
      )}
    </div>
  )
}
