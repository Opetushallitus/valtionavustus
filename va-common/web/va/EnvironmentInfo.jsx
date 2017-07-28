import React from 'react'

export default class EnvironmentInfo extends React.Component {
  render() {
    const environment = this.props.environment

    if (!environment['show-name']) {
      return null
    }

    return <span id="environment-info">{environment.name}</span>
  }
}
