import { db } from "../../db/index.js";
import { users, sessions } from "./schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    restaurantId: string;
    role?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const [user] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      restaurantId: data.restaurantId,
      role: data.role as any || "waiter",
    }).$returningId();

    return user;
  }

  async login(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error("Credenciales inválidas");
    }

    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }

  async validateToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload;
    } catch {
      return null;
    }
  }
}