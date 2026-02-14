import bcrypt from "bcryptjs";

import { prisma } from "../src/prisma/client";

const STAFF_EMAIL = "staff@vintagevalley.com";
const TEMP_PASSWORD = "123456";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: STAFF_EMAIL } });
  if (existing) {
    console.log("Staff already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);

  await prisma.user.create({
    data: {
      name: "Staff",
      email: STAFF_EMAIL,
      passwordHash,
      role: "STAFF" as any,
    },
    select: { id: true, email: true, role: true },
  });

  console.log("Staff created successfully");
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
