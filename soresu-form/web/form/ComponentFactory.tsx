import React from 'react'

export default class ComponentFactory {
  fieldTypeMapping: any
  fieldPropertyMapperMapping: any

  constructor(props: any) {
    this.fieldTypeMapping = props.fieldTypeMapping
    this.fieldPropertyMapperMapping = props.fieldPropertyMapperMapping
  }

  createComponent(componentProps: any) {
    const fieldType = componentProps.fieldType
    if (fieldType in this.fieldTypeMapping) {
      const fieldPropertyMapper = this.fieldPropertyMapperMapping[fieldType]
      const effectiveProps = fieldPropertyMapper
        ? fieldPropertyMapper.map(componentProps)
        : componentProps
      return React.createElement(this.fieldTypeMapping[fieldType], effectiveProps)
    }
    return (
      <span key={componentProps.htmlId}>
        {this.constructor.name} : Unsupported field type {fieldType}
      </span>
    )
  }
}
