import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateTokens(payload: TokenPayload): {
  token: string;
  refreshToken: string;
  expiresAt: number;
} {
  const expiresIn = '1h';
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  return { token, refreshToken, expiresAt };
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
