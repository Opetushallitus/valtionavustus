import React from 'react'

export default class EnvironmentInfo extends React.Component {

  render() {
    const avustushaku = this.props.avustushaku
    return (
        <span className="environment" hidden={!avustushaku.environment['show-name']}>{avustushaku.environment.name}</span>
    )
  }
}
