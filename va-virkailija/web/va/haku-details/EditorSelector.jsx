import React, { Component } from 'react'

import ClassNames from 'classnames'

import HakuEdit from './HakuEdit.jsx'
import FormEditorContainer from './FormEditorContainer.jsx'
import DecisionEditor from './DecisionEditor.jsx'

export default class EditorSelector extends React.Component {
  render() {
    const subTab = this.props.subTab
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const formDraft = this.props.formDraft
    const ldapSearch = this.props.ldapSearch
    const koodistos = this.props.koodistos
    const userInfo = this.props.userInfo
    const environment = this.props.environment
    const translations = this.props.translations

    var subTabContent
    switch (subTab) {
      case "haku-editor":
        subTabContent = <HakuEdit avustushaku={avustushaku}
                                  ldapSearch={ldapSearch}
                                  userInfo={userInfo}
                                  controller={controller} />
        break
      case "form-editor":
        subTabContent = <FormEditorContainer avustushaku={avustushaku}
                                             environment={environment}
                                             translations={translations}
                                             koodistos={koodistos}
                                             formDraft={formDraft}
                                             controller={controller} />
        break
      case "decision":
        subTabContent = <DecisionEditor avustushaku={avustushaku}
                                             controller={controller} />
        break
      default:
        throw new Error("Bad subTab selection '" + subTab + "'")
    }

    function createSubTabSelector(subTabToSelect) {
      return e => {
        e.preventDefault()
        controller.selectEditorSubtab(subTabToSelect)
      }
    }

    return <section id="editor-section">
             <div id="editor-subtab-selector" className="section-container">
               <span onClick={createSubTabSelector("haku-editor")}
                     className={ClassNames({"selected": subTab === "haku-editor"})}>Haun tiedot</span>
               <span onClick={createSubTabSelector("form-editor")}
                     className={ClassNames({"selected": subTab === "form-editor"})}>Hakulomake</span>
               <span onClick={createSubTabSelector("decision")}
                     className={ClassNames({"selected": subTab === "decision"})}>Päätös</span>
             </div>
             <div className="section-container">{subTabContent}</div>
           </section>
  }
}
