import {test} from "@playwright/test";
import { switchUserIdentityTo } from "../utils/util"

export interface RootTestFixture {
  isLoggedInAsValtionavustus: boolean
}

export const rootTest = test.extend<RootTestFixture>({
  isLoggedInAsValtionavustus: async ({page}, use) => {
    await switchUserIdentityTo(page, "valtionavustus")
    await use(true)
  },
})
