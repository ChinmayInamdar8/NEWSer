# Redux Toolkit and RTK Query

This guide is the source of truth for client state in the Next.js apps. Use **RTK Query** for server data and **Redux Toolkit slices** for client-only UI/session state. The reference implementation lives in `apps/admin`.

## 1. When to use what


| Need                                                                        | Tool                                        | Where it lives                   |
| --------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------- |
| Fetch, cache, and invalidate API data                                       | RTK Query (`createApi` / `injectEndpoints`) | `lib/services/api/`              |
| Client-only UI or session flags (modals, selected tab, local auth UI state) | `createSlice`                               | `features/<name>/<name>Slice.ts` |


Do not put HTTP endpoints inside `features/`. Do not put client-only UI state inside the API slice.

## 2. Folder layout

Each Next.js app that uses Redux should follow this shape:

```
apps/<app>/
  app/
    storeProvider.tsx
    layout.tsx              # wraps children with StoreProvider
  lib/
    store.ts                # makeStore, RootState, AppDispatch
    hooks.ts                # typed useAppDispatch / useAppSelector
    services/api/
      api.ts                # createApi, tagTypes, empty endpoints
      posts.ts              # injectEndpoints for a resource
  features/
    auth/authSlice.ts       # createSlice only — not API endpoints
```

`apps/admin` already has the store, hooks, `StoreProvider`, and `lib/services/api`. The `features/` folder is the convention for slices; add it when the first slice is needed.

## 3. Store wiring

Next.js App Router must not share a singleton store across requests. Create the store with a `makeStore` factory and hold it in a client `StoreProvider`.

### `lib/store.ts`

```ts
import { configureStore } from "@reduxjs/toolkit"
import { api } from "@/lib/services/api/api"
// import authReducer from "@/features/auth/authSlice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      // auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
```

Register every feature reducer next to `[api.reducerPath]`. Always concat `api.middleware` so RTK Query caching and invalidation work.

### `app/storeProvider.tsx`

```tsx
"use client"

import { useRef } from "react"
import { Provider } from "react-redux"
import { makeStore, type AppStore } from "@/lib/store"

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore | null>(null)

  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
```

Wrap the app in `app/layout.tsx`:

```tsx
<ThemeProvider>
  <StoreProvider>{children}</StoreProvider>
</ThemeProvider>
```



### Typed hooks — `lib/hooks.ts`

Use these instead of plain `useDispatch` / `useSelector`:

```ts
import { useDispatch, useSelector, useStore } from "react-redux"
import type { AppDispatch, AppStore, RootState } from "./store"

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
```



## 4. RTK Query architecture

All API definitions live under `lib/services/api/`. There is **one** `createApi` instance for the app. Domain endpoints are added with `injectEndpoints`.

### Empty API slice — `lib/services/api/api.ts`

```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),
  tagTypes: ["Post", "User", "Comment"],
  endpoints: () => ({}),
})
```

`NEXT_PUBLIC_API_URL` is the NestJS API base URL (see `apps/admin/example.env`). Add a `tagType` here before using it in `providesTags` / `invalidatesTags`.

### Inject endpoints — one file per resource

```ts
// lib/services/api/posts.ts
import { api } from "./api"

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => "/posts",
      providesTags: ["Post"],
    }),
    createPost: builder.mutation<Post, CreatePostBody>({
      query: (body) => ({
        url: "/posts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Post"],
    }),
  }),
})

export const { useGetPostsQuery, useCreatePostMutation } = postApi
```

Rules:

- Put every endpoint under `lib/services/api/` (e.g. `posts.ts`, `users.ts`).
- Export the generated hooks from that file.
- Consume hooks only in `"use client"` components.
- Do **not** define endpoints inside `features/`.



## 5. Slices architecture

Slices are for client-only state. Create them at `features/<name>/<name>Slice.ts`.

```ts
// features/auth/authSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type AuthState = {
  isSidebarOpen: boolean
  selectedOrgId: string | null
}

const initialState: AuthState = {
  isSidebarOpen: true,
  selectedOrgId: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen
    },
    setSelectedOrgId(state, action: PayloadAction<string | null>) {
      state.selectedOrgId = action.payload
    },
  },
})

export const { toggleSidebar, setSelectedOrgId } = authSlice.actions
export default authSlice.reducer
```

Then register the reducer in `makeStore`:

```ts
import authReducer from "@/features/auth/authSlice"

reducer: {
  [api.reducerPath]: api.reducer,
  auth: authReducer,
}
```

Do not fetch from the network inside a slice. Use RTK Query for that.

## 6. Component usage

Query (server data):

```tsx
"use client"

import { useGetPostsQuery } from "@/lib/services/api/posts"

export function PostList() {
  const { data, error, isLoading } = useGetPostsQuery()

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load posts.</p>

  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

Slice (client state):

```tsx
"use client"

import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { toggleSidebar } from "@/features/auth/authSlice"

export function SidebarToggle() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((state) => state.auth.isSidebarOpen)

  return (
    <button onClick={() => dispatch(toggleSidebar())}>
      {isOpen ? "Close" : "Open"} sidebar
    </button>
  )
}
```



## 7. TODO: add the same setup to `apps/web`

`apps/web` does not yet have Redux Toolkit or RTK Query. Mirror the admin setup so both apps share the same conventions. `NEXT_PUBLIC_API_URL` is already listed in `apps/web/example.env`.

- [ ] Add `@reduxjs/toolkit` and `react-redux` to `apps/web/package.json` (same versions as admin)
- [ ] Add `apps/web/lib/store.ts` (`makeStore`, `RootState`, `AppDispatch`)
- [ ] Add `apps/web/lib/hooks.ts` (typed `useAppDispatch` / `useAppSelector` / `useAppStore`)
- [ ] Add `apps/web/lib/services/api/api.ts` (empty `createApi` + `tagTypes` + `fetchBaseQuery`)
- [ ] Add `apps/web/app/storeProvider.tsx` and wrap `apps/web/app/layout.tsx` with `StoreProvider`
- [ ] Keep API endpoints in `lib/services/api/` via `injectEndpoints`
- [ ] Keep slices in `features/<name>/<name>Slice.ts` and register them in `makeStore`