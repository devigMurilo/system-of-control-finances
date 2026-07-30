const { PrismaClient } = require("@prisma/client");
async function main() {
  const p = new PrismaClient();
  const cats = await p.category.findMany({ orderBy: { name: "asc" } });
  cats.forEach((c) => console.log(c.name));
  await p.$disconnect();
}
main();
