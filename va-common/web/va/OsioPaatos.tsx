import React from "react";
import {PaatosStatus} from "../../../va-virkailija/web/va/hakemus-details/hakemusTypes";
import {useTranslations} from "./i18n/TranslationContext";
import {isAccepted, isRejected} from "./Muutoshakemus";
import {IconAccepted} from "./img/IconAccepted";
import {IconRejected} from "./img/IconRejected";
import {IconAcceptedWithChanges} from "./img/IconAcceptedWithChanges";

import './OsioPaatos.less'

const black = '#1A1919'


export type PaatosOsio = 'paatos-talousarvio' | 'paatos-jatkoaika' | 'paatos-sisaltomuutos'

interface Props {
  osio: PaatosOsio
  paatosStatus: PaatosStatus
}

export const OsioPaatos: React.FC<Props> = ({osio, paatosStatus}) => {
  const { t } = useTranslations()
  const text = t.muutoshakemus.paatos[osio].status[paatosStatus]
  const icon: JSX.Element = isAccepted(paatosStatus)
    ? <IconAccepted fill={black} />
    : isRejected(paatosStatus)
      ? <IconRejected fill={black} />
      : <IconAcceptedWithChanges fill={black} />
  return (
    <div data-test-id={osio} className="muutoshakemus-osio-paatos">
      {icon}
      {text}
    </div>
  )
}
