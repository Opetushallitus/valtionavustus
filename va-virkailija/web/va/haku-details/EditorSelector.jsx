import React, { Component } from 'react'

import ClassNames from 'classnames'

import HakuEdit from './HakuEdit.jsx'
import FormEditorContainer from './FormEditorContainer.jsx'
import DecisionEditor from './DecisionEditor.jsx'
import SelvitysFormEditor from './SelvitysFormEditor.jsx'

export default class EditorSelector extends React.Component {
  render() {
    const {subTab, controller, avustushaku, formDraft, ldapSearch, koodistos, userInfo, environment, translations, valiselvitysFormDraft, loppuselvitysFormDraft} = this.props
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
                                        controller={controller}
                                        translations={translations}

        />
        break
      case "valiselvitys":
        subTabContent = <SelvitysFormEditor selvitysType="valiselvitys"
                                        environment={environment}
                                        avustushaku={avustushaku}
                                        controller={controller}
                                        koodistos={koodistos}
                                        translations={translations}
                                        valiselvitysFormDraft={valiselvitysFormDraft}
                                        loppuselvitysFormDraft={loppuselvitysFormDraft}
                                        translations={translations}

        />
        break
      case "loppuselvitys":
        subTabContent = <SelvitysFormEditor selvitysType="loppuselvitys"
                                            environment={environment}
                                            avustushaku={avustushaku}
                                            controller={controller}
                                            koodistos={koodistos}
                                            translations={translations}
                                            valiselvitysFormDraft={valiselvitysFormDraft}
                                            loppuselvitysFormDraft={loppuselvitysFormDraft}
                                            translations={translations}

        />
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
               <span onClick={createSubTabSelector("valiselvitys")}
                     className={ClassNames({"selected": subTab === "valiselvitys"})}>Väliselvityslomake</span>
               <span onClick={createSubTabSelector("loppuselvitys")}
                     className={ClassNames({"selected": subTab === "loppuselvitys"})}>Loppuselvityslomake</span>
             </div>
             <div className="section-container">{subTabContent}</div>
           </section>
  }
}
