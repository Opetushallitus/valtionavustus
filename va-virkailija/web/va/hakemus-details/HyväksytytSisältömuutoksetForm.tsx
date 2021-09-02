import React from 'react'

import { Muutoshakemus } from 'va-common/web/va/types/muutoshakemus'

import 'va-common/web/va/muutoshakemus/talous.less'
import { isError } from '../formikHelpers'
import { translationsFi } from '../../../../va-common/web/va/i18n/translations'
import {MuutoshakemusPaatosFormValues} from "./hakemusTypes"

type HyväksytytSisältömuutoksetFormProps = {
  f: MuutoshakemusPaatosFormValues
  muutoshakemus: Muutoshakemus
}

export const HyväksytytSisältömuutoksetForm = ({ f, muutoshakemus }: HyväksytytSisältömuutoksetFormProps) => {
  return (
    <React.Fragment>
      <section className="muutoshakemus-section">
        <div className="muutoshakemus-row">
          <h4 className="muutoshakemus__header">{translationsFi.sisaltomuutos.appliedChange}</h4>
          <div className="muutoshakemus__reason" data-test-id="sisaltomuutos-perustelut">{muutoshakemus['sisaltomuutos-perustelut']}</div>
        </div>
        <div className="muutoshakemus-row">
          <h4 className="muutoshakemus__header">
            Kuvaa hyväksytyt muutokset hankkeen sisältöön tai toteutustapaan
          </h4>
          <textarea id="hyvaksytyt-sisaltomuutokset"
                    name="hyvaksytyt-sisaltomuutokset"
                    rows={5} cols={53}
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    value={f.values['hyvaksytyt-sisaltomuutokset']}
                    className={isError(f, 'hyvaksytyt-sisaltomuutokset') ? "muutoshakemus__error" : undefined} />
          {isError(f, "hyvaksytyt-sisaltomuutokset") && <div className="muutoshakemus__error">Hyväksytyt muutokset hankkeen sisältöön tai toteutustapaan on pakollinen kenttä!</div>}
        </div>
      </section>
    </React.Fragment>
  )
}
