import { Answers } from '../va/types'

interface Props {
  getFormAnswers?: (response: any) => Answers
  getSavedVersion?: (response: any) => number
}

export default class ResponseParser {
  getFormAnswers: (response: any) => Answers
  getSavedVersion: any
  constructor(props: Props) {
    this.getFormAnswers =
      props.getFormAnswers ||
      function (response: any) {
        return response.answers
      }
    this.getSavedVersion =
      props.getSavedVersion ||
      function (response: any) {
        return response && response.version ? response.version : 0
      }
  }
}
