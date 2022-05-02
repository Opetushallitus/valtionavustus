import React, { ChangeEventHandler, FocusEventHandler } from "react";
import BasicSizedComponent from "./BasicSizedComponent";

interface Props {
  maxLength: number;
  onBlur: FocusEventHandler<any>;
  onChange: ChangeEventHandler<any>;
}

export default class BasicTextField<T> extends BasicSizedComponent<Props & T> {
  baseClassName() {
    return "soresu-text-field";
  }
  render() {
    const props = this.props;
    const sizeNumber = Number.isInteger(props.size) ? props.size : undefined;
    return (
      <div className={this.resolveClassName(this.baseClassName())}>
        <input
          type={"text"}
          size={sizeNumber}
          id={props.htmlId}
          name={props.htmlId}
          maxLength={props.maxLength}
          value={props.value}
          disabled={props.disabled}
          onBlur={props.onBlur}
          onChange={props.onChange}
        />
      </div>
    );
  }
}
