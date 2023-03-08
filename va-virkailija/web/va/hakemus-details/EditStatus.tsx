import React from 'react'
import HttpUtil from 'soresu-form/web/HttpUtil'
import HelpTooltip from '../HelpTooltip'
import { Avustushaku, Hakemus, HakemusStatus, HelpTexts } from 'soresu-form/web/va/types'

type EditStatusProps = {
  avustushaku: Avustushaku
  hakemus: Hakemus
  allowEditing?: boolean
  status: Extract<'officer_edit' | 'cancelled', HakemusStatus>
  helpTexts: HelpTexts
}

type EditStatusState = {
  currentHakemusId?: unknown
  open: boolean
  comment: string
  submitted?: boolean
  submitting?: boolean
}

export default class EditStatus extends React.Component<EditStatusProps, EditStatusState> {
  constructor(props: EditStatusProps) {
    super(props)
    this.state = EditStatus.initialState(props)
  }

  static getDerivedStateFromProps(
    props: EditStatusProps,
    state: EditStatusState
  ): null | EditStatusState {
    if (props.hakemus.id !== state.currentHakemusId) {
      return EditStatus.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props: EditStatusProps): EditStatusState {
    return {
      currentHakemusId: props.hakemus.id,
      open: false,
      comment: '',
    }
  }

  render() {
    const { avustushaku, hakemus, allowEditing, status, helpTexts } = this.props
    const avustushakuId = avustushaku.id
    const cancelled = status === 'cancelled'
    const onOpen = () => {
      this.setState({ open: true })
    }

    const open = this.state.open

    const editUrl = `/hakemus-edit/${avustushakuId}/${hakemus['user-key']}`

    const onSubmit = () => {
      this.setState({ submitting: true })
      updateHakemusStatus(avustushakuId, hakemus.id, status, this.state.comment).then(
        (_res: UpdateStatusResponse) => {
          this.setState({ submitting: false, submitted: true })
          if (!cancelled) {
            window.open(editUrl, '_blank')
          }
        }
      )
    }

    const onStatusCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      this.setState({ comment: event.target.value })
    }

    if (!allowEditing) {
      return null
    }

    if (hakemus.status === 'officer_edit' && status === 'officer_edit') {
      return (
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-test-id="virkailija-edit-link"
        >
          Siirry muokkaamaan
        </a>
      )
    }

    const tooltip = () => {
      if (cancelled) {
        return (
          <HelpTooltip
            testId={'tooltip-peruuta-hakemus'}
            content={helpTexts['hankkeen_sivu__arviointi___peruuta_hakemus']}
            direction={'arviointi-slim'}
          />
        )
      } else {
        return (
          <HelpTooltip
            testId={'tooltip-muokkaa-hakemusta'}
            content={helpTexts['hankkeen_sivu__arviointi___muokkaa_hakemusta']}
            direction={'arviointi-slim'}
          />
        )
      }
    }

    return (
      <div className="value-edit">
        {open ? (
          <div>
            <textarea
              data-test-id="virkailija-edit-comment"
              onChange={onStatusCommentChange}
              placeholder="Kommentti"
            />
            <span>
              <button
                className={cancelled ? 'btn-danger' : ''}
                onClick={onSubmit}
                disabled={this.state.submitting}
                data-test-id="virkailija-edit-submit"
              >
                {cancelled ? 'Peruuta hakemus' : 'Siirry muokkaamaan'}
              </button>
              {tooltip()}
            </span>
            {this.state.submitted && (
              <span>{cancelled ? 'Hakemus peruutettu' : 'Tila muutettu'}</span>
            )}
          </div>
        ) : (
          <span>
            <button
              className={cancelled ? 'btn-danger' : ''}
              onClick={onOpen}
              data-test-id={cancelled ? 'virkailija-cancel-hakemus' : 'virkailija-edit-hakemus'}
            >
              {cancelled ? 'Peruuta hakemus' : 'Muokkaa hakemusta'}
            </button>
            {tooltip()}
          </span>
        )}
      </div>
    )
  }
}

type UpdateStatusResponse = {
  'hakemus-id': string
  status: string
}

async function updateHakemusStatus(
  avustushakuId: number,
  hakemusId: number,
  status: string,
  comment: string
): Promise<UpdateStatusResponse> {
  const url = `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/status`
  return await HttpUtil.post(url, { status, comment })
}
