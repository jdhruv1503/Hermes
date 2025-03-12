"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { authenticateUser, logoutUser } from "./server-auth";
import { useRouter } from "next/navigation";

// Helper function to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop().split(';').shift();
    // Decode the URL-encoded cookie value
    return decodeURIComponent(cookieValue);
  }
  return null;
}

// Auth Context
const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

// Auth Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();
  
  // Check if user is already logged in from cookies on initial load
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const userCookie = getCookie('user');
        
        if (userCookie) {
          const userData = JSON.parse(userCookie);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error checking user session:", error);
      }
    };
    
    checkUserSession();
    
    // Add event listener for storage events to sync across tabs
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        if (event.newValue) {
          setUser(JSON.parse(event.newValue));
        } else {
          setUser(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const result = await authenticateUser(username, password);
      
      if (result.success) {
        const userData = { username: result.username, isAuthenticated: true };
        setUser(userData);
        
        // Also dispatch a storage event to sync across tabs
        window.localStorage.setItem('loginSync', Date.now().toString());
        window.localStorage.removeItem('loginSync');
        
        router.refresh(); // Refresh to update middleware state
        return { success: true };
      }
      
      return { 
        success: false, 
        error: result.error || "Login failed" 
      };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: "Authentication failed. Please try again." 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      router.refresh(); // Refresh to update middleware state
      router.push('/'); // Redirect to login page
    } catch (error) {
      console.error("Logout error:", error);
      // Even if server logout fails, clear the client state
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth() {
  return useContext(AuthContext);
} 