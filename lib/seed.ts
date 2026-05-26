import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Stub seed script — seeding is disabled for this fresh start.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
