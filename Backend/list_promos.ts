
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const promos = await prisma.promoCode.findMany();
  console.log(JSON.stringify(promos, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
