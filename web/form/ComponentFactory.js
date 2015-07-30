import React from 'react'

export default class ComponentFactory {
  constructor(fieldTypeMapping) {
    this.fieldTypeMapping = fieldTypeMapping
  }

  createComponent(componentProps) {
    const fieldType = componentProps.fieldType
    if (fieldType in this.fieldTypeMapping) {
      return React.createElement(this.fieldTypeMapping[fieldType], componentProps)
    }
    return <span key={componentProps.htmlId}>{this.constructor.name} : Unsupported field type {fieldType}</span>
  }
}