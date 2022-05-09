import React from "react";
import _ from "lodash";
import HelpTooltip from "../HelpTooltip";

export default class AllowVisibilityInExternalSystem extends React.Component {
  constructor(props) {
    super(props);
  }

  onHakemusAllowVisibilityInExternalSystem(event) {
    this.props.controller.setHakemusAllowVisibilityInExternalSystem(
      this.props.hakemus,
      event.target.value
    )();
  }
  render() {
    const helpText = this.props.helpText;
    const hakemus = this.props.hakemus;
    const allowEditing = this.props.allowEditing;
    const arvio = hakemus.arvio;
    const selectedAllowVisibilityInExternalSystem =
      arvio["allow-visibility-in-external-system"] !== false;
    this.onHakemusAllowVisibilityInExternalSystem =
      this.onHakemusAllowVisibilityInExternalSystem.bind(this);

    const options = _.flatten(
      [
        {
          htmlId: "set-allow-visibility-in-external-system-true",
          value: true,
          label: "Kyllä",
          testId: "set-allow-visibility-in-external-system-true",
        },
        {
          htmlId: "set-allow-visibility-in-external-system-false",
          value: false,
          label: "Ei",
        },
      ].map((spec) => [
        <input
          id={spec.htmlId}
          key={spec.htmlId}
          type="radio"
          name="allow-visibility-in-external-system"
          value={spec.value}
          onChange={this.onHakemusAllowVisibilityInExternalSystem}
          checked={spec.value === selectedAllowVisibilityInExternalSystem}
          disabled={!allowEditing}
        />,
        <label
          key={spec.htmlId + "-label"}
          data-test-id={spec.testId}
          htmlFor={spec.htmlId}
        >
          {spec.label}
        </label>,
      ])
    );

    return (
      <div id="set-allow-visibility-in-external-system">
        <h3>
          Salli näkyvyys ulkoisessa järjestelmässä:
          <HelpTooltip content={helpText} direction={"salli-nakyvyys"} />
        </h3>
        <fieldset className="soresu-radiobutton-group">{options}</fieldset>
      </div>
    );
  }
}
