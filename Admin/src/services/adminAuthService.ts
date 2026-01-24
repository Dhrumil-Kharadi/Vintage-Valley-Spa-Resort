import bcrypt from "bcryptjs";
import { prisma } from "../../../Backend/src/prisma/client";
import { HttpError } from "../../../Backend/src/middlewares/errorHandler";

export const adminAuthService = {
  async loginAdmin(params: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: params.email } });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    if (user.role !== "ADMIN") throw new HttpError(403, "Forbidden");

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },
};
