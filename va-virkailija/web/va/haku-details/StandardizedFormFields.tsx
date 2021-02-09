import React from 'react'

import { StandardizedFormHelpTexts } from 'va-common/web/va/standardized-form-fields/types'

interface StandardizedFormFieldsProps {
  controller: any
  environment: any
  standardizedFormHelpTexts: StandardizedFormHelpTexts
}

const SoresuSection = ({title, children}) => {
  return (
    <div className="soresu-form-edit soresu-edit">
      <div className="soresu-field-header"><span className="soresu-field-title"><h3>{title}</h3></span><span></span></div>
      <div className="soresu-field-content">
        {children}
      </div>
    </div>
  )
}

const SoresuTitle = ({titleFi, titleSv, name}) => {
  return (
    <table className="translation">
      <thead>
        <tr><th>Otsikko suomeksi</th><th>Otsikko ruotsiksi</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><textarea disabled={true} name={`standardized-${name}-label-fi`} value={titleFi}></textarea></td>
          <td><textarea disabled={true} name={`standardized-${name}-label-sv`} value={titleSv}></textarea></td>
        </tr>
      </tbody>
    </table>
  )
}

const SoresuField = ({title, questionFi, questionSv, name, standardizedFormHelpTexts, controller}) => {
  return (
    <div className="soresu-edit soresu-field-edit">
      <div className="soresu-field-header"><span className="soresu-field-title"><h3>{title}</h3></span></div>
      <div className="soresu-field-content">
        <SoresuQuestionField name={name} questionFi={questionFi} questionSv={questionSv}/>
        <SoresuHelpTextField name={name} standardizedFormHelpTexts={standardizedFormHelpTexts} controller={controller} disabled={false}/>
      </div>
    </div>
  )
}

const SoresuQuestionField = ({questionFi, questionSv, name}) => {
  return (
    <table className="translation">
      <thead>
        <tr><th>Kysymys suomeksi</th><th>Kysymys ruotsiksi</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><textarea disabled={true} data-test-id={`standardized-${name}-fi`} name={`standardized-${name}-fi`} value={questionFi}></textarea></td>
          <td><textarea disabled={true} data-test-id={`standardized-${name}-sv`} name={`standardized-${name}-sv`} value={questionSv}></textarea></td>
        </tr>
      </tbody>
    </table>
  )
}

const SoresuHelpTextField = ({name, standardizedFormHelpTexts, controller, disabled}) => {
  return (
    <table className="translation">
      <thead>
        <tr><th>Ohjeteksti suomeksi</th><th>Ohjeteksti ruotsiksi</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <textarea className="larger-textarea"
                      disabled={disabled}
                      name={`standardized-${name}-help-fi`}
                      data-test-id={`standardized-${name}-help-fi`}
                      onChange={(e) => controller.handleStandardizedFormChange(`${name}-fi`, e.target.value)}
                      value={standardizedFormHelpTexts[`${name}-fi`]}/>
          </td>
          <td>
            <textarea className="larger-textarea"
                      disabled={disabled}
                      name={`standardized-${name}-help-sv`}
                      data-test-id={`standardized-${name}-help-sv`}
                      onChange={(e) => controller.handleStandardizedFormChange(`${name}-sv`, e.target.value)}
                      value={standardizedFormHelpTexts[`${name}-sv`]}/>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export const StandardizedFormFields = ({controller, standardizedFormHelpTexts, environment}: StandardizedFormFieldsProps) => {
  const muutospaatosprosessiEnabled =
    (environment["muutospaatosprosessi"] &&
      environment["muutospaatosprosessi"]["enabled?"]) || false

  return (
    muutospaatosprosessiEnabled ?
    <div className="soresu-form-edit soresu-edit">
      <div className="soresu-edit soresu-field-edit">
        <div className="soresu-field-content">
          <div className="soresu-field-header"><span className="soresu-field-title"><h3>Ohjeteksti</h3></span></div>
          <SoresuHelpTextField name="ohjeteksti" controller={controller} standardizedFormHelpTexts={standardizedFormHelpTexts} disabled={false}/>
        </div>
      </div>
      <SoresuSection title="Lomakkeen osio">
        <SoresuTitle name="hakija" titleFi="Hakijan tiedot" titleSv="Uppgifter om den sökande" />
        <SoresuField title="Hakijan nimi" questionFi="Hakija" questionSv="Sökande" name="hakija" controller={controller} standardizedFormHelpTexts={standardizedFormHelpTexts}/>
        <SoresuField title="Sähköposti, johon lähetetään tiedoksi" questionFi="Hakijan virallinen sähköpostiosoite" questionSv="Sökandens officiella e-postadress" name="hakija-email" controller={controller} standardizedFormHelpTexts={standardizedFormHelpTexts}/>
      </SoresuSection>
    </div>
    : <span/>
  )
}
