import _ from 'lodash'
import React from 'react'
import ComponentFactory from '../ComponentFactory.jsx'
import {
  TextFieldEdit,
  TextAreaEdit,
  MultipleChoiceEdit,
  LinkEdit
} from './EditComponent.jsx'
import KoodistoFieldEdit from './KoodistoFieldEdit.jsx'
import TableValue from '../preview/TableValue.jsx'
import {
  TextFieldPropertyMapper,
  LinkPropertyMapper,
  KoodistoFieldPropertyMapper,
} from '../component/PropertyMapper'
import TableValuePropertyMapper from '../preview/TableValuePropertyMapper'

export default class FormEditComponent extends React.Component {

  static fieldTypeMapping(){
    return {
      "textField": TextFieldEdit,
      "textArea": TextAreaEdit,
      "link": LinkEdit,
      "radioButton": MultipleChoiceEdit,
      "checkboxButton": MultipleChoiceEdit,
      "dropdown": MultipleChoiceEdit,
      "koodistoField": KoodistoFieldEdit,
      "tableField": TableValue
    }
  }

  constructor(props) {
    super(props)
    const fieldPropertyMapping = {
      "textField": TextFieldEditPropertyMapper,
      "textArea": TextFieldEditPropertyMapper,
      "link": LinkEditPropertyMapper,
      "koodistoField": KoodistoFieldEditPropertyMapper,
      "tableField": TableValuePropertyMapper
    }

    this.componentFactory = new ComponentFactory({ fieldTypeMapping: FormEditComponent.fieldTypeMapping(), fieldPropertyMapperMapping: fieldPropertyMapping})
  }

  render() {
    const fieldType = this.props.fieldType
    const controller = this.props.controller

    if (fieldType in controller.getCustomPreviewComponentTypeMapping()) {
      return controller.createCustomPreviewComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}

class EditPropertyMapperExtender {
  static extendedMap(baseMapper, props) {
    const baseProps = baseMapper.map(props)
    return _.extend(baseProps, {
      formEditorController: props.formEditorController
    })
  }
}

class TextFieldEditPropertyMapper {
  static map(props) {
    return EditPropertyMapperExtender.extendedMap(TextFieldPropertyMapper, props)
  }
}

class LinkEditPropertyMapper {
  static map(props) {
    const baseProps = EditPropertyMapperExtender.extendedMap(LinkPropertyMapper, props)
    return _.extend(baseProps, {
      field: props.field
    })
  }
}

class KoodistoFieldEditPropertyMapper {
  static map(props) {
    const baseProps = EditPropertyMapperExtender.extendedMap(KoodistoFieldPropertyMapper, props)
    return _.extend(baseProps, {
      koodistos: props.koodistos,
      koodistosLoader: props.koodistosLoader
    })
  }
}
