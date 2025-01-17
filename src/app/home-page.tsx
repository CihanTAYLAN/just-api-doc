import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Home from "./page"

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  return <Home session={session} />
}
