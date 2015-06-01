import React from 'react'

export default class LocalizedString extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    var value = this.props.data[this.props.lang]
    return (<span>{value}</span>)
  }
}
