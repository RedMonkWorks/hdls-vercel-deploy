import { useCallback } from 'react'
import type { MutationHook } from '@vercel/commerce/utils/types'
import useLogout, { UseLogout } from '@vercel/commerce/auth/use-logout'
import type { LogoutHook } from '../types/logout'
import useCustomer from '../customer/use-customer'
import customerAccessTokenDeleteMutation from '../utils/mutations/customer-access-token-delete'
import { getCustomerToken, setCustomerToken } from '../utils/customer-token'

import {
  hdls_SwymConfig,
  hdls_SetLocalStorage,
} from './../../../../site/lib/swym'

export default useLogout as UseLogout<typeof handler>

export const handler: MutationHook<LogoutHook> = {
  fetchOptions: {
    query: customerAccessTokenDeleteMutation,
  },
  async fetcher({ options, fetch }) {
    await fetch({
      ...options,
      variables: {
        customerAccessToken: getCustomerToken(),
      },
    })
    setCustomerToken(null)

    console.log('Hdls - customer log off in Vercel')

    hdls_SwymConfig(null).then((data) => {
      hdls_SetLocalStorage(data)
    })

    return null
  },
  useHook:
    ({ fetch }) =>
    () => {
      const { mutate } = useCustomer()

      return useCallback(
        async function logout() {
          const data = await fetch()
          await mutate(null, false)
          return data
        },
        [fetch, mutate]
      )
    },
}
