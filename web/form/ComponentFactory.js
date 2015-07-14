import React from 'react'

export default class ComponentFactory {
  constructor(fieldTypeMapping) {
    this.fieldTypeMapping = fieldTypeMapping
  }

  createComponent(componentProps) {
    const field = componentProps.field
    const displayAs = field.displayAs

    var element = <span>{this.constructor.name} : Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      element = React.createElement(this.fieldTypeMapping[displayAs], componentProps)
    }
    return element
  }
}