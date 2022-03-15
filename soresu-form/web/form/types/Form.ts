import {Language} from "soresu-form/web/va/types";
import UrlCreator from "soresu-form/web/form/UrlCreator";
import ResponseParser from "soresu-form/web/form/ResponseParser";

export interface UrlContent {
  parsedQuery: any
  location: Location
}

export interface FormOperations {
  "chooseInitialLanguage": (urlContent: UrlContent) => Language,
  "containsExistingEntityId": (urlContent: UrlContent) => boolean,
  "isFieldEnabled": (saved: any) => any,
  "onFieldUpdate": (state: any, field: any) => void,
  "isSaveDraftAllowed": (state: any) => boolean,
  "isNotFirstEdit": (state: any) => boolean,
  "createUiStateIdentifier": (state: any) => string,
  "urlCreator": UrlCreator,
  "responseParser": ResponseParser,
  "printEntityId": (state: any) => number
}

export interface InitialValues {
  language: Language
}
