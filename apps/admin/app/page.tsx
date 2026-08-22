"use client"
import { useGetHealthQuery } from "@/lib/services/api/health"
import { useGetPostsQuery } from "@/lib/services/api/posts"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  const {isLoading, data, status} = useGetHealthQuery();
  

  if(isLoading){
    return(
      <div>
        The data is laoding ...
      </div>
    )
  }
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        {data?.data?.Health}
      </div>
    </div>
  )
}
