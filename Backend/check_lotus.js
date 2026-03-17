const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const rs = await prisma.room.findMany();
  console.log("Rooms DB:", rs.map(r => ({id: r.id, title: r.title, pricePerNight: r.pricePerNight})));

  const cached = await prisma.roomCache.findMany();
  console.log("Cached rooms:", cached.map(r => ({id: r.roomtypeunkid, title: r.roomName, pricePerNight: r.pricePerNight})));
}

check().finally(() => prisma.$disconnect());
