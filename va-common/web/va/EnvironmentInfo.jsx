import React from 'react'

export default class EnvironmentInfo extends React.Component {

  render() {
    const environment = this.props.environment
    return (
        <span className="environment" hidden={!environment['show-name']}>{environment.name}</span>
    )
  }
}
