import React, { useState } from "react";

import ComponentFactory from "../ComponentFactory";
import Translator from "../Translator";
import DateUtil from "../../DateUtil";
import {
  InfoElementPropertyMapper,
  AccordionElementPropertyMapper,
  LinkPropertyMapper,
} from "./PropertyMapper";
import {
  FieldType,
  LegacyTranslations,
  Language,
} from "soresu-form/web/va/types";

function asDateTimeString(
  translations: LegacyTranslations,
  lang: Language,
  date: Date
) {
  const timeLimiter = new Translator(translations["misc"]).translate(
    "time",
    lang,
    "KLO"
  );
  return (
    DateUtil.asDateString(date) +
    " " +
    timeLimiter +
    " " +
    DateUtil.asTimeString(date)
  );
}

interface Props {
  values: any;
  htmlId: string;
  lang: Language;
}

function translatedValue(props: Props, valueId: "text" | "href" | "label") {
  const lang = props.lang;
  const values = props.values;
  const value = values[props.htmlId];
  if (value && value[valueId]) {
    return new Translator(value).translate(valueId, lang);
  } else {
    return new Translator(values).translate(props.htmlId, lang);
  }
}

export function H1InfoElement(props: Props) {
  return <h1>{translatedValue(props, "text")}</h1>;
}

export function H3InfoElement(props: Props) {
  return <h3>{translatedValue(props, "text")}</h3>;
}

export function LinkInfoElement(props: Props) {
  const translatedText = translatedValue(props, "text");
  const translatedHref = translatedValue(props, "href");
  const text = translatedText ? translatedText : translatedHref;
  return (
    <a
      hidden={!translatedHref}
      target="_blank"
      rel="noopener noreferrer"
      href={translatedHref}
    >
      {text}
    </a>
  );
}

export function ParagraphInfoElement(props: Props) {
  return (
    <p className="soresu-info-element">{translatedValue(props, "text")}</p>
  );
}

interface AccordionInfoElementProps extends Props {
  renderingParameters: {
    initiallyOpen: boolean;
  };
}

function AccordionInfoElement(props: AccordionInfoElementProps) {
  const [state, setState] = useState({
    open: props.renderingParameters.initiallyOpen,
  });

  const handleClick = () => {
    setState({
      open: !state.open,
    });
  };

  const values = props.values;
  const key = props.htmlId;
  const lang = props.lang;
  const items = [];
  const infoObject = values[props.htmlId];
  for (let i = 0; i < infoObject.items.length; i++) {
    const textContent = infoObject.items[i][lang];
    items.push(<li key={key + "." + i}>{textContent}</li>);
  }
  const isOpen = state.open;
  const openStateClassName = isOpen ? "open" : "closed";
  return (
    <div>
      <span
        onClick={handleClick}
        className={"soresu-opener-handle " + openStateClassName}
      >
        {translatedValue(props, "label")}
      </span>
      <div
        className="soresu-accordion"
        ref={(el) => {
          if (el) {
            // Explicitly set max-height so that hiding/showing element
            // can be animated with css transitions. Setting max-height
            // is slightly faster than setting height on IE11.
            el.style.maxHeight = isOpen ? el.scrollHeight + "px" : "0px";
          }
        }}
      >
        <ul id={key}>{items}</ul>
      </div>
    </div>
  );
}

interface DateRangeProps extends Props {
  translations: LegacyTranslations;
}

export function DateRangeInfoElement(props: DateRangeProps) {
  const values = props.values;
  const value = values[props.htmlId];
  const start = new Date(value.start);
  const startDateTime = asDateTimeString(props.translations, props.lang, start);
  const end = new Date(value.end);
  const endDateTime = asDateTimeString(props.translations, props.lang, end);

  return (
    <div>
      {translatedValue(props, "label")} {startDateTime} — {endDateTime}
    </div>
  );
}

interface EndOfDateRangeProps extends Props {
  translations: LegacyTranslations;
}

function EndOfDateRangeInfoElement(props: EndOfDateRangeProps) {
  const values = props.values;
  const value = values[props.htmlId];
  const end = new Date(value.end);
  const endDateTime = asDateTimeString(props.translations, props.lang, end);
  return (
    <div>
      <label>{translatedValue(props, "label")}</label>
      <span>{endDateTime}</span>
    </div>
  );
}

export default function InfoElement(props: {
  controller: any;
  fieldType: FieldType;
  htmlId: string;
}) {
  const fieldTypeMapping = {
    h1: H1InfoElement,
    h3: H3InfoElement,
    link: LinkInfoElement,
    p: ParagraphInfoElement,
    bulletList: AccordionInfoElement,
    dateRange: DateRangeInfoElement,
    endOfDateRange: EndOfDateRangeInfoElement,
  };
  const fieldPropertyMapping = {
    h1: InfoElementPropertyMapper,
    h3: InfoElementPropertyMapper,
    link: LinkPropertyMapper,
    p: InfoElementPropertyMapper,
    bulletList: AccordionElementPropertyMapper,
    dateRange: InfoElementPropertyMapper,
    endOfDateRange: InfoElementPropertyMapper,
  };
  const componentFactory = new ComponentFactory({
    fieldTypeMapping: fieldTypeMapping,
    fieldPropertyMapperMapping: fieldPropertyMapping,
  });

  const controller = props.controller;
  const fieldType = props.fieldType;

  if (fieldType in controller.getCustomComponentTypeMapping()) {
    return controller.createCustomComponent(props);
  } else {
    return componentFactory.createComponent(props);
  }
}
