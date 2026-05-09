import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-in-production-use-a-long-random-string'
)

export const SESSION_COOKIE = 'tenant_os_session'
export const MAX_AGE_SECONDS = 30 * 60  // 30 minutes inactivity

export interface SessionPayload {
  userId:   string
  email:    string
  username: string
  role:     string
  tenantId: string | null
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}