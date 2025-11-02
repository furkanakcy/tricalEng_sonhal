'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate auth check - replace with real auth logic
    const checkAuth = async () => {
      try {
        // For now, simulate a logged-in user
        const mockUser: User = {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin'
        }
        
        setUser(mockUser)
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate login - replace with real auth logic
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email,
        role: 'admin'
      }
      
      setUser(mockUser)
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setUser(null)
  }

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  }
}