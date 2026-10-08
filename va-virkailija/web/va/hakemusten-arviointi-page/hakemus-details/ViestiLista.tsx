import React, { useState } from 'react'
import moment from 'moment/moment'
import { EnvelopeIcon } from '../../common-components/icons'

moment.locale('fi')

const formatDate = (date: string) => {
  if (moment(date).isValid()) {
    return `${moment(date).format('DD.MM.YYYY')} klo ${moment(date).format('HH.mm')}`
  }
  return date
}

export interface Message {
  id: number
  date: string
  virkailija: string
  sender: string
  reply_to?: string | null
  subject: string
  message: string
  receivers: string[]
}

interface Props {
  messages: Message[]
  heading?: string
}

type OpenedMessagesState = Record<number, boolean>

export default function ViestiLista(props: Props) {
  const [openedMessages, setOpenedMessages] = useState<OpenedMessagesState>({})
  const messages = props.messages.map((message, idx) => {
    return (
      <ViestiListaRow
        key={message.id}
        icon="envelope"
        date={message.date}
        dataTestId={`open-email-${idx}`}
        virkailija={message.virkailija}
        heading={props.heading}
        onClick={() =>
          setOpenedMessages({ ...openedMessages, [message.id]: !openedMessages[message.id] })
        }
      >
        {openedMessages[message.id] && <ViestiDetails message={message} />}
      </ViestiListaRow>
    )
  })
  return <>{messages}</>
}

export function ViestiDetails(props: { message: Omit<Message, 'virkailija' | 'date'> }) {
  const message = props.message
  return (
    <div role="table" className={'messageDetails'}>
      <EmailField name={'Lähettäjä'} address={message.sender} type={'sender'} />
      <EmailField name={'Reply-To'} address={message.reply_to} type={'reply-to'} />
      <div role="row" className={'detailRow'}>
        <div role="rowheader" className={'label'}>
          Vastaanottajat
        </div>
        <div role="cell" className={'item'}>
          {message.receivers.join(', ')}
        </div>
      </div>
      <div role="row" className={'detailRow'}>
        <div role="rowheader" className={'label'}>
          Aihe
        </div>
        <div role="cell" className={'item'}>
          {message.subject}
        </div>
      </div>
      <div className={'rowMessage'}>{message.message}</div>
    </div>
  )
}

function EmailField(props: { name: string; address: string | null | undefined; type: string }) {
  const { name, address, type } = props

  if (!address) return <React.Fragment />

  return (
    <div role="row" className={'detailRow'}>
      <div role="rowheader" className={'label'}>
        {name}
      </div>
      <div data-test-id={`viesti-details-email-${type}`} role="cell" className={'item'}>
        {address}
      </div>
    </div>
  )
}

interface RowContentProps {
  date: string
  virkailija: string
  heading?: string
  icon: 'done' | 'envelope' | 'undo'
}

interface ViestilistaRowProps extends RowContentProps {
  onClick: () => void
  dataTestId?: string
  children?: React.ReactNode
}

export function ViestiListaRow({ onClick, dataTestId, children, ...content }: ViestilistaRowProps) {
  return (
    <div role="listitem" className={'viestiListaItem'}>
      <button
        type="button"
        className={'viestiListaRow'}
        onClick={onClick}
        data-test-id={dataTestId}
      >
        <RowContent {...content} />
        <span className={'rowOpenCloseIcon'}>
          <CloseIcon />
        </span>
      </button>
      {children}
    </div>
  )
}

function RowContent({ date, virkailija, heading, icon }: RowContentProps) {
  return (
    <>
      {icon === 'envelope' ? (
        <EnvelopeIcon active />
      ) : icon === 'undo' ? (
        <UndoIcon />
      ) : (
        <DoneIcon />
      )}
      <span className={'rowDate'}>{formatDate(date)}</span>
      <span className={'rowVirkailija'}>{virkailija}</span>
      <span className={'rowHeading'}>{heading}</span>
    </>
  )
}

const CloseIcon = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.69961 0.100098L0.599609 1.2001L5.29961 5.9001L9.99961 1.2001L8.89961 0.100099L5.29961 3.6001L1.69961 0.100098Z"
      fill="#00516D"
    />
  </svg>
)

const DoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 16 16" fill="none">
    <g transform="translate(-4 -4)">
      <path
        d="M12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20ZM15.5312 10.5312L11.5312 14.5312C11.2375 14.825 10.7625 14.825 10.4719 14.5312L8.47188 12.5312C8.17813 12.2375 8.17813 11.7625 8.47188 11.4719C8.76562 11.1813 9.24062 11.1781 9.53125 11.4719L11 12.9406L14.4688 9.46875C14.7625 9.175 15.2375 9.175 15.5281 9.46875C15.8187 9.7625 15.8219 10.2375 15.5281 10.5281L15.5312 10.5312Z"
        fill="#159ECB"
      />
    </g>
  </svg>
)

const UndoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="#159ECB" />
    <path
      d="M5.2 6.2h4.3a2.4 2.4 0 0 1 0 4.8H6.8M6.9 4.3 5 6.2l1.9 1.9"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
