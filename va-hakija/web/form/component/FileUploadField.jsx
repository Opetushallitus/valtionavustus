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
    const classStr = this.resolveClassName("soresu-file-upload")
    return <div className={classStr}>
             {this.label(classStr)}
             <Dropzone style={{}} id={props.htmlId} name={props.htmlId} onDrop={this.onDrop}>
               <span>TODO: Kielistä: Try dropping some files here, or click to select files to upload.</span>
             </Dropzone>
           </div>
  }

  onDrop(thing) {
    console.log('TODO: Handle dropped file', thing)
  }
}