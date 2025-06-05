import { restaurants, users } from "@/db/schema";
import { db } from "@/db/connection";
import Elysia, { t } from "elysia";
import { hash } from "bcryptjs";

export const registerRestaurant = new Elysia().post(
  "/restaurants",
  async ({ body, set }) => {
    const { restaurantName, managerName, email, password, phone } = body;

    const passwordHash = await hash(password, 6);

    const [manager] = await db
      .insert(users)
      .values({
        name: managerName,
        email,
        password_hash: passwordHash,
        phone,
        role: "manager",
      })
      .returning();

    await db.insert(restaurants).values({
      name: restaurantName,
      managerId: manager.id,
    });

    set.status = 204;
  },
  {
    body: t.Object({
      restaurantName: t.String(),
      managerName: t.String(),
      phone: t.String(),
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
  }
);
