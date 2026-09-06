import { useGetUserQuery } from "@/lib/services/api/user"
import { useSession } from "@/lib/use-session"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Header() {
  const { data, isLoading } = useGetUserQuery();
  console.log("userImage", data?.image);
  const router = useRouter();
  return (
    <header className="border-header-border sticky top-0 flex h-12 w-screen items-center justify-between border-b px-1 shadow md:px-5">
      <div>
        <h1 className="text-xl font-medium text-sky-600">DailyCorner</h1>
      </div>
      <div>
        <Input
          className="hidden w-full outline-none md:block"
          placeholder="Search News..."
        ></Input>
      </div>
      <div>
        {isLoading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        ) : data ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-full p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.name || "Profile"}
                  className="h-9 w-9 rounded-full object-cover cursor-pointer"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <User className="h-5 w-5" />
                </div>
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <p className="text-sm font-medium">{data.name}</p>

                <p className="truncate text-xs text-muted-foreground">
                  {data.email}
                </p>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant={"login"} onClick={()=>router.push('/login')}>Login</Button>
        )}
      </div>
    </header>
  )
}
