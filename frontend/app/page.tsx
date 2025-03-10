import { login } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HermesLogo from "@/public/logo-transparent.png"

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md shadow-lg gap-8">
        <CardHeader className="space-y-1 text-center gap-4">
          <CardTitle className="font-serif text-5xl tracking-tight flex justify-center items-center">
          <Image
        src={HermesLogo}
        width={80}
        height={80}
        alt="Hermes logo"
      />Hermes
            </CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <form action={login} className="space-y-4">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" placeholder="Enter your username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Enter your password" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

