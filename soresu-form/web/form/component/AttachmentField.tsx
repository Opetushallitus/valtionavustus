import React from "react";
import ClassNames from "classnames";
import _ from "lodash";
// @ts-ignore
import Dropzone from "react-dropzone";

import AttachmentDisplay from "../preview/AttachmentDisplay.jsx";
import RemoveButton from "./RemoveButton.jsx";
import BasicSizedComponent from "./BasicSizedComponent";
import LocalizedString from "./LocalizedString";

interface Props {
  allAttachments: any;
  renderingParameters?: any;
  downloadUrl: any;
  onRemove: any;
  onDrop: any;
}

export default class AttachmentField extends BasicSizedComponent<Props> {
  render() {
    const props = this.props;
    const translations = this.props.translations;
    const lang = this.props.lang;
    const classStr = ClassNames(this.resolveClassName("soresu-file-upload"), {
      disabled: props.disabled,
    });
    const uploadButtonClassStr = ClassNames(
      this.resolveClassName("soresu-upload-button")
    );
    const existingAttachment = this.props.allAttachments[this.props.field.id];
    const propertiesWithAttachment = _.extend(
      { attachment: existingAttachment },
      props
    );
    const attachmentElement = existingAttachment ? (
      <ExistingAttachmentComponent {...propertiesWithAttachment} />
    ) : (
      <Dropzone
        className={classStr}
        id={props.htmlId}
        name={props.htmlId}
        onDrop={props.onDrop}
        disableClick={props.disabled}
        multiple={false}
      >
        <LocalizedString
          className={uploadButtonClassStr}
          translations={translations.form.attachment}
          translationKey="uploadhere"
          lang={lang}
        />
      </Dropzone>
    );

    return (
      <div
        className="soresu-attachment-block soresu-attachment-input-field"
        id={props.htmlId}
      >
        {this.label(classStr)}
        {attachmentElement}
      </div>
    );
  }
}

interface ExistingAttachmentComponentProps {
  attachment: any;
}

class ExistingAttachmentComponent extends React.Component<
  Props & ExistingAttachmentComponentProps
> {
  render() {
    const attachment = this.props.attachment;
    const downloadUrl = this.props.downloadUrl;
    const removeProperties = { ..._.cloneDeep(this.props) };
    removeProperties.renderingParameters = _.isObject(
      removeProperties.renderingParameters
    )
      ? removeProperties.renderingParameters
      : {};
    removeProperties.renderingParameters.removeMe = this.props.onRemove;

    const attachmentDisplay = (
      <AttachmentDisplay
        {...this.props}
        attachment={attachment}
        downloadUrl={downloadUrl}
      />
    );
    const removeButton = <RemoveButton {...removeProperties} />;
    return (
      <div>
        {attachmentDisplay}
        {removeButton}
      </div>
    );
  }
}
