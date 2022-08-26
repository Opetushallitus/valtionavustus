import { Locator } from "@playwright/test";

export const createReactSelectLocators = (
  containerLocator: Locator,
  classNamePrefix: string
) => {
  return {
    value: containerLocator.locator(`.${classNamePrefix}__single-value`),
    placeholder: containerLocator.locator(`.${classNamePrefix}__placeholder`),
    option: containerLocator.locator(`.${classNamePrefix}__option`),
    input: containerLocator.locator(`.${classNamePrefix}__input`),
  };
};
