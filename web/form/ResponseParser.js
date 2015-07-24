import _ from 'lodash'

export default class ResponseParser {
  constructor(props) {
    this.getFormAnswers = props.getFormAnswers || function(response) {
      return response.answers
    }
  }
}