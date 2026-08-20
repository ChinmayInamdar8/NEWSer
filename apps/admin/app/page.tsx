"use client"
import { useGetPostsQuery } from "@/lib/services/api/posts"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  const {data, error, isLoading} = useGetPostsQuery();

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
        <div>
          <h1 className="font-medium">Admin ready!</h1>
          <p>You may now add components and start building.</p>
          <p>Shared UI is wired through @workspace/ui.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
        <h1>This Are your Posts</h1>
        <div className="w-screen grid grid-cols-3">
          {
          data.map((value:any,index:number)=>(
            <div className="border border-slate-200 py-6 px-5">
              <h2 className="text-2xl my-3">{value.title}</h2>
              <p>{value.body}</p>
            </div>
          ))
        }
        </div>
      </div>
    </div>
  )
}
