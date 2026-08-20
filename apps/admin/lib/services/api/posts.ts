import {api} from "./api"

export const postApi = api.injectEndpoints({
    endpoints:(builder)=>({
        getPosts:builder.query<any ,void>({
            query: ()=>"/posts",
            providesTags: ["Post"]
        })
    })
})

export const {
    useGetPostsQuery
} = postApi;