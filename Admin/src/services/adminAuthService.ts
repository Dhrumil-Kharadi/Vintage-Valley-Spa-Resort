import bcrypt from "bcryptjs";
import { prisma } from "../../../Backend/src/prisma/client";
import { HttpError } from "../../../Backend/src/middlewares/errorHandler";

export const adminAuthService = {
  async loginAdmin(params: { email: string; password: string }) {
    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (envEmail && envPassword && params.email === envEmail && params.password === envPassword) {
      const passwordHash = await bcrypt.hash(envPassword, 10);

      const user = await prisma.user.upsert({
        where: { email: envEmail },
        create: {
          name: "Admin",
          email: envEmail,
          passwordHash,
          role: "ADMIN",
        },
        update: {
          role: "ADMIN",
          passwordHash,
        },
        select: { id: true, name: true, email: true, role: true },
      });

      return user;
    }

    const user = await prisma.user.findUnique({ where: { email: params.email } });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    if (user.role !== "ADMIN") throw new HttpError(403, "Not an admin");

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },
};
