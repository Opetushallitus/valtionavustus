import BasicFieldComponent, { BasicFieldComponentProps } from './BasicFieldComponent'

export interface BasicSizedComponentProps extends BasicFieldComponentProps {
  size?: string
}

export default class BasicSizedComponent<T> extends BasicFieldComponent<
  BasicSizedComponentProps & T
> {
  sizeClassName() {
    if (this.props.size && !Number.isInteger(this.props.size)) {
      return this.props.size
    } else {
      return undefined
    }
  }
}
