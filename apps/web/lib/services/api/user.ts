import { SessionUser } from "@workspace/types";
import { api } from "./api";

export const userApi = api.injectEndpoints({
    endpoints : (builder)=>({
        getUser : builder.query<SessionUser, void>({
            query : ()=>'/auth/me',
            providesTags:['User']
        })
    })
})

export const {useGetUserQuery, } = userApi;