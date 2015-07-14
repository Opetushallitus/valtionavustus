import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import ComponentFactory from '../form/ComponentFactory.js'

export default class VaPreviewComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaProjectDescription": VaProjectDescriptionPreview
    }
    super(fieldTypeMapping)
  }
}

class VaProjectDescriptionPreview extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const classNames = ClassNames("va-big-fieldset", {hidden: this.isHidden()})
    return (
      <li className={classNames} id={htmlId}>
        <div className="fieldset-elements">
          {children}
        </div>
      </li>
    )
  }

  isHidden() {
    return this.props.renderingParameters && this.props.renderingParameters.valueIsEmpty === true;
  }
}