import Elysia, { t } from "elysia";
import { db } from "@/db/connection";
import { env } from "@/env";
import { UnauthorizedError } from "./errors/unauthorized-error";
import { compare } from "bcryptjs";
import { authentication } from "../authentication";

export const authenticate = new Elysia().use(authentication).post(
  "/authenticate",
  async ({ body, signUser, set }) => {
    const { email, password } = body;

    const userFromEmail = await db.query.users.findFirst({
      where(fields, { eq }) {
        return eq(fields.email, email);
      },
    });

    if (!userFromEmail) {
      throw new UnauthorizedError();
    }

    // Verify password
    const isValidPassword = await compare(
      password,
      userFromEmail.password_hash
    );

    if (!isValidPassword) {
      throw new UnauthorizedError();
    }

    // Get managed restaurant (same logic as before)
    const managedRestaurant = await db.query.restaurants.findFirst({
      where(fields, { eq }) {
        return eq(fields.managerId, userFromEmail.id);
      },
    });

    // Sign the user directly
    await signUser({
      sub: userFromEmail.id,
      restaurantId: managedRestaurant?.id,
    });

    return { success: true };
  },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
  }
);
