/* eslint-disable drizzle/enforce-delete-with-where */

import {
  authLinks,
  evaluations,
  orders,
  products,
  restaurants,
  users,
} from "./schema";
import { faker } from "@faker-js/faker";
import { db } from "./connection";
import chalk from "chalk";
import { orderItems } from "./schema/order-items";
import { createId } from "@paralleldrive/cuid2";

/**
 * Reset database
 */
await db.delete(orderItems);
await db.delete(orders);
await db.delete(evaluations);
await db.delete(products);
await db.delete(restaurants);
await db.delete(authLinks);
await db.delete(users);

console.log(chalk.yellow("✔ Database reset"));

/**
 * Create customers
 */
const [customer1, customer2] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password_hash: faker.internet.password(),
      role: "customer",
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password_hash: faker.internet.password(),
      role: "customer",
    },
  ])
  .returning();

console.log(chalk.yellow("✔ Created customers"));

/**
 * Create restaurant manager
 */
const [manager] = await db
  .insert(users)
  .values({
    name: "Matheus Barcelos Conceição",
    email: "matheus@example.com",
    password_hash:
      "$2a$06$roRdDA4Q92zNhPd0WaACKeoATU5/Q0XZln.E/3rYpNL2EDSvFyJqe",
    role: "manager",
  })
  .returning();

console.log(chalk.yellow("✔ Created manager"));

/**
 * Create restaurant
 */
const [restaurant] = await db
  .insert(restaurants)
  .values({
    name: "Pizzaria Exemplo",
    description: "Uma pizzaria de exemplo para o projeto pizza.shop",
    managerId: manager.id,
  })
  .returning();

console.log(chalk.yellow("✔ Created restaurant"));

/**
 * Create products
 */
const availableProducts = await db
  .insert(products)
  .values([
    {
      name: "Pizza Margherita",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
    {
      name: "Pizza Pepperoni",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
    {
      name: "Pizza Quatro Queijos",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
    {
      name: "Pizza Calabresa",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
    {
      name: "Pizza Portuguesa",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
    {
      name: "Pizza Frango com Catupiry",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
    {
      name: "Pizza Napolitana",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
    {
      name: "Pizza Vegetariana",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
    {
      name: "Pizza Bacon com Cheddar",
      priceInCents: Number(
        faker.commerce.price({
          min: 5900,
          max: 11900,
          dec: 0,
        })
      ),
      restaurantId: restaurant.id,
      description: faker.commerce.productDescription(),
    },
  ])
  .returning();

console.log(chalk.yellow("✔ Created products"));

const ordersToInsert: (typeof orders.$inferInsert)[] = [];
const orderItemsToPush: (typeof orderItems.$inferInsert)[] = [];

const today = new Date();
const daysToFill = 40;

const guaranteedOrders = [];
for (let day = 0; day < daysToFill; day++) {
  const orderDate = new Date(today);
  orderDate.setDate(today.getDate() - day);
  guaranteedOrders.push(orderDate);
}

const shuffledDates = faker.helpers.shuffle([...guaranteedOrders]);

for (let i = 0; i < 200; i++) {
  const orderId = createId();

  const orderProducts = faker.helpers.arrayElements(availableProducts, {
    min: 1,
    max: 3,
  });

  let totalInCents = 0;

  orderProducts.forEach((orderProduct) => {
    const quantity = faker.number.int({
      min: 1,
      max: 3,
    });

    totalInCents += orderProduct.priceInCents * quantity;

    orderItemsToPush.push({
      orderId,
      productId: orderProduct.id,
      priceInCents: orderProduct.priceInCents,
      quantity,
    });
  });

  ordersToInsert.push({
    id: orderId,
    customerId: faker.helpers.arrayElement([customer1.id, customer2.id]),
    restaurantId: restaurant.id,
    status: faker.helpers.arrayElement([
      "pending",
      "canceled",
      "processing",
      "delivering",
      "delivered",
    ]),
    totalInCents,
    createdAt: i < 40 ? shuffledDates[i] : faker.date.recent({ days: 40 }),
  });
}

await db.insert(orders).values(ordersToInsert);
await db.insert(orderItems).values(orderItemsToPush);

console.log(chalk.yellow("✔ Created orders"));

console.log(chalk.greenBright("Database seeded successfully!"));

process.exit();
