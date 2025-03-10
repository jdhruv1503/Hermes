"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Session duration in seconds (1 hour)
const SESSION_DURATION = 60 * 60

export async function login(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  // Check credentials against environment variables
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    // Set a secure, HTTP-only cookie
    cookies().set({
      name: "auth_session",
      value: "authenticated",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      path: "/",
    })

    return { success: true }
  }

  return { success: false, error: "Invalid credentials" }
}

export async function logout() {
  cookies().delete("auth_session")
  redirect("/")
}

export async function isAuthenticated() {
  const session = cookies().get("auth_session")
  return session?.value === "authenticated"
}

