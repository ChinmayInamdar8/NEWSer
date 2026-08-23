import { api } from "./api"
import type { SessionUser } from "@workspace/types"

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<SessionUser, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    logout: builder.mutation<{ ok: boolean }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
  }),
})

export const { useGetMeQuery, useLogoutMutation } = authApi
