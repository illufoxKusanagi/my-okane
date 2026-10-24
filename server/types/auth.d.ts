declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    /** Bumped on password reset to revoke previously issued sessions. */
    credentialsVersion?: number
  }
  interface UserSession {
    user: User
  }
}

export {}
