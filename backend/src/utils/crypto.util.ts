import { createHash, randomBytes, pbkdf2Sync, createHmac } from "crypto";

export class CryptoUtil {
  // Hash password using PBKDF2
  static hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString(
      "hex"
    );
    return `${salt}:${hash}`;
  }

  // Verify password
  static verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(":");
    const verifyHash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString(
      "hex"
    );
    return hash === verifyHash;
  }

  // Generate JWT token (without external library)
  static generateToken(
    payload: any,
    secret: string,
    expiresIn: number = 3600
  ): string {
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString(
      "base64url"
    );
    const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString(
      "base64url"
    );

    const signature = createHmac("sha256", secret)
      .update(`${base64Header}.${base64Payload}`)
      .digest("base64url");

    return `${base64Header}.${base64Payload}.${signature}`;
  }

  // Verify JWT token
  static verifyToken(token: string, secret: string): any {
    try {
      const [base64Header, base64Payload, signature] = token.split(".");

      const expectedSignature = createHmac("sha256", secret)
        .update(`${base64Header}.${base64Payload}`)
        .digest("base64url");

      if (signature !== expectedSignature) {
        throw new Error("Invalid signature");
      }

      const payload = JSON.parse(
        Buffer.from(base64Payload, "base64url").toString()
      );

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error("Token expired");
      }

      return payload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  // Generate random token for session
  static generateRandomToken(): string {
    return randomBytes(32).toString("hex");
  }
}
