import bcrypt from "bcryptjs";
import { User } from "@workspace/db";
import { logger } from "./logger";

const ADMIN_EMAIL = "rationadmin@karnataka.gov.in";
const ADMIN_PASSWORD = "Ration@2024";

export async function seedAdmin() {
  try {
    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (!existing) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({
        name: "Ration Admin",
        email: ADMIN_EMAIL,
        password: hashed,
        address: "Karnataka Government Office, Vidhana Soudha, Bengaluru",
        role: "admin",
      });
      logger.info("Admin user created");
    } else if (existing.role !== "admin") {
      await User.updateOne(
        { email: ADMIN_EMAIL },
        { role: "admin" }
      );
      logger.info("Admin role updated");
    } else {
      const passwordMatch = await bcrypt.compare(ADMIN_PASSWORD, existing.password);
      if (!passwordMatch) {
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await User.updateOne(
          { email: ADMIN_EMAIL },
          { password: hashed, name: "Ration Admin" }
        );
        logger.info("Admin password updated");
      } else {
        logger.info("Admin user already exists and credentials match");
      }
    }
  } catch (error) {
    logger.error("Error seeding admin:", error);
  }
}
