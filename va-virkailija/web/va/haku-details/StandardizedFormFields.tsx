import React from 'react'

import { StandardizedFormValues } from 'va-common/web/va/standardized-form-fields/types'

interface StandardizedFormFieldsProps {
  controller: any
  environment: any
  standardizedFormValues: StandardizedFormValues
}

export const StandardizedFormFields = ({controller, standardizedFormValues, environment}: StandardizedFormFieldsProps) => {
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
                      data-test-id="standardized-help-text-fi"
                      onChange={(e) => controller.handleStandardizedFormChange("help-text-fi", e.target.value)}
                      value={standardizedFormValues["help-text-fi"]}/>
                  </td>
                  <td>
                    <textarea
                      className="larger-textarea"
                      name="help-text-sv"
                      data-test-id="standardized-help-text-sv"
                      onChange={(e) => controller.handleStandardizedFormChange("help-text-sv", e.target.value)}
                      value={standardizedFormValues["help-text-sv"]}/>
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
