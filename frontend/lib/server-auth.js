"use server";

import { cookies } from 'next/headers';

// Server-side authentication function
export async function authenticateUser(username, password) {
  // Get credentials from environment variables (these are server-side only)
  const validUsername = process.env.AUTH_USERNAME || "admin";
  const validPassword = process.env.AUTH_PASSWORD || "kernel2024";
  
  // Check if credentials match
  if (username === validUsername && password === validPassword) {
    // Set a cookie for authentication
    const userData = { username, isAuthenticated: true };
    
    // Store the user data in a cookie (expires in 24 hours)
    // Don't need to encode manually as cookies() handles this
    cookies().set({
      name: 'user',
      value: JSON.stringify(userData),
      httpOnly: false, // Allow JavaScript access
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax', // Allow cross-site requests in specific scenarios
    });
    
    // Also set a separate HTTP-only cookie for security validation
    cookies().set({
      name: 'auth_token',
      value: 'authenticated',
      httpOnly: true, // Cannot be accessed by JavaScript
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax',
    });
    
    return { 
      success: true,
      username
    };
  }
  
  return { 
    success: false, 
    error: "Invalid username or password" 
  };
}

// Server-side logout function
export async function logoutUser() {
  cookies().delete('user');
  cookies().delete('auth_token');
  return { success: true };
} 