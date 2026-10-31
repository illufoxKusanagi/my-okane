declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    periodStartDay?: number
  }
  interface UserSession {
    user: User
    loggedInAt?: number
  }
}

export {}
