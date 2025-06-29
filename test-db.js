import { db } from "./lib/db";
async function test() {
  console.log("Testing database connection...");
  try {
    await db.$connect();
    console.log(" Database connected successfully!");
    const userCount = await db.user.count();
    console.log(` Current user count: ${userCount}`);
  } catch (error) {
    console.error(" Database connection failed:", error);
  } finally {
    await db.$disconnect();
  }
}
test();
