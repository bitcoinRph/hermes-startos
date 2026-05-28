import { sdk } from './sdk'
import { setOpenAiOAuth } from './actions/setOpenAiOAuth'

export const actions = sdk.Actions.of().addAction(setOpenAiOAuth)
