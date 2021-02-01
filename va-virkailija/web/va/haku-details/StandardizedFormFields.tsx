import React from 'react'
import { FormikHook } from 'va-common/web/va/standardized-form-fields/types'

interface StandardizedFormFieldsProps {
  f: FormikHook
  environment: any
}

export const StandardizedFormFields = ({f, environment}: StandardizedFormFieldsProps) => {
  const muutospaatosprosessiEnabled =
    (environment["muutospaatosprosessi"] &&
      environment["muutospaatosprosessi"]["enabled?"]) || false

  return (
    muutospaatosprosessiEnabled ?
    <div className="soresu-form-edit soresu-edit">
      <div className="soresu-edit soresu-field-edit">
        <div className="soresu-field-header">
          <span className="soresu-field-title">
            <h3>Ohjeteksti</h3>
          </span>
        </div>
        <div className="soresu-field-content">
          <div className="soresu-edit-wrapped-view">
            <table className="translation">
              <thead>
                <tr><th>Teksti suomeksi</th><th>Teksti ruotsiksi</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <textarea
                      className="larger-textarea"
                      name="help-text-fi"
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      value={f.values["help-text-fi"]}/>
                  </td>
                  <td>
                    <textarea
                      className="larger-textarea"
                      name="help-text-sv"
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      value={f.values["help-text-sv"]}/>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    : <span/>
  )
}
