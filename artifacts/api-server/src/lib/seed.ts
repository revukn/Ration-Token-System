import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "./logger";

const ADMIN_EMAIL = "rationadmin@karnataka.gov.in";
const ADMIN_PASSWORD = "Ration@2024";

export async function seedAdmin() {
  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL));

    if (!existing) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await db.insert(usersTable).values({
        name: "Ration Admin",
        email: ADMIN_EMAIL,
        password: hashed,
        address: "Karnataka Government Office, Vidhana Soudha, Bengaluru",
        role: "admin",
      });
      logger.info("Admin user created");
    } else if (existing.role !== "admin") {
      await db
        .update(usersTable)
        .set({ role: "admin" })
        .where(eq(usersTable.email, ADMIN_EMAIL));
      logger.info("Admin role updated");
    } else {
      const passwordMatch = await bcrypt.compare(ADMIN_PASSWORD, existing.password);
      if (!passwordMatch) {
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await db
          .update(usersTable)
          .set({ password: hashed, name: "Ration Admin" })
          .where(eq(usersTable.email, ADMIN_EMAIL));
        logger.info("Admin password updated");
      } else {
        logger.info("Admin user already exists and credentials match");
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}
