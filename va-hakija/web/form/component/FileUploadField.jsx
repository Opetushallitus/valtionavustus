import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import Dropzone from 'react-dropzone-es6'

import BasicSizedComponent from './BasicSizedComponent.jsx'
import LocalizedString from 'va-common/web/form/component/LocalizedString.jsx'
import HelpTooltip from 'va-common/web/form/component/HelpTooltip.jsx'
import Translator from 'va-common/web/form/Translator'

export default class FileUploadField extends BasicSizedComponent {
  render() {
    const props = this.props
    const translations = this.props.translations
    const lang = this.props.lang
    const classStr = ClassNames(this.resolveClassName("soresu-file-upload"), { disabled: this.props.disabled })

    return <div className={classStr}>
             {this.label(classStr)}
             <Dropzone style={{}} id={props.htmlId} name={props.htmlId} onDrop={props.onDrop} disableClick={props.disabled}>
               <LocalizedString translations={translations.form.attachment} translationKey="uploadhere" lang={lang}/>
             </Dropzone>
           </div>
  }
}