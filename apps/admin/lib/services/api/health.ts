import { api } from "./api"

export const healthApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<any, void>({
      query: () => "/health/status",
      providesTags: ["Health"],
    }),
  }),
})

export const { useGetHealthQuery } = healthApi
