import _ from 'lodash'

export default class ResponseParser {
  constructor(props) {
    this.getFormAnswers = props.getFormAnswers || function(response) {
      return response.answers
    }
    this.getSavedVersion = props.getSavedVersion || function(response) {
      return response && response.version ? response.version : 0
    }
  }
}