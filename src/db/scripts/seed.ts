import { faker } from "@faker-js/faker";
import { sql, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { admins } from "../schema/admins";
import { draws } from "../schema/draws";
import { fundraisers } from "../schema/fundraisers";
import { orders } from "../schema/orders";
import { organizations } from "../schema/organization";
import { supporters } from "../schema/supporters";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "fundbox_user",
  password: "test123",
  database: "fundbox",
});

const db = drizzle(pool);

const FUNDRAISER_COUNT = 15;
const SUPPORTER_COUNT = 5000;
const ORDER_COUNT = 5000;
const DRAW_COUNT = 30;

const generatePostalCode = () => {
  const letters = "ABCEFGHIJKLMNPRSTVWXYZ";
  return `${faker.string.fromCharacters(letters, 1)}${faker.number.int({
    min: 0,
    max: 9,
  })}${faker.string.fromCharacters(letters, 1)} ${faker.number.int({
    min: 0,
    max: 9,
  })}${faker.string.fromCharacters(letters, 1)}${faker.number.int({
    min: 0,
    max: 9,
  })}`;
};

const getFutureDate = (monthsAhead: number = 6) => {
  const date = new Date();
  date.setMonth(
    date.getMonth() + faker.number.int({ min: 1, max: monthsAhead }),
  );
  return date;
};

const generateFundraiserDates = (index: number) => {
  const now = new Date();

  if (index < 5) {
    return {
      startDate: now.toDateString(),
      endDate: getFutureDate(3).toDateString(),
    };
  } else if (index < 10) {
    const futureStart = getFutureDate(1);
    return {
      startDate: futureStart.toDateString(),
      endDate: getFutureDate(6).toDateString(),
    };
  } else {
    const pastStart = new Date(now);
    pastStart.setMonth(pastStart.getMonth() - 2);
    const pastEnd = new Date(now);
    pastEnd.setMonth(pastEnd.getMonth() - 1);
    return {
      startDate: pastStart.toDateString(),
      endDate: pastEnd.toDateString(),
    };
  }
};

async function seedOrganizationsAndAdmins() {
  console.log("🏢 Seeding organizations...");
  const orgInserts = [
    {
      name: "Test Organization 1",
      street: faker.location.streetAddress(),
      postalCode: generatePostalCode(),
    },
    {
      name: "Test Organization 2",
      street: faker.location.streetAddress(),
      postalCode: generatePostalCode(),
    },
  ];
  const orgs = await db.insert(organizations).values(orgInserts).returning();

  console.log("👤 Seeding admins...");
  const adminEmails = ["test1@example.com", "test2@example.com"];
  const adminInserts = adminEmails.map((email, i) => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email,
    phone: faker.phone.number({ style: "national" }),
    password: "password123",
    organizationId: orgs[i].id,
  }));
  const createdAdmins = await db
    .insert(admins)
    .values(adminInserts)
    .returning();

  return { orgs, admins: createdAdmins };
}

async function seed(includeAuth = false) {
  try {
    console.log("🌱 Starting database seed...");

    let orgs = [];
    let createdAdmins = [];

    if (includeAuth) {
      const authData = await seedOrganizationsAndAdmins();
      orgs = authData.orgs;
      createdAdmins = authData.admins;
    } else {
      orgs = await db.select().from(organizations);
      createdAdmins = await db.select().from(admins);
    }

    if (orgs.length === 0 || createdAdmins.length === 0) {
      throw new Error(
        "❌ No organizations or admins found. Run with --with-auth flag to seed them.",
      );
    }

    console.log("💰 Seeding fundraisers...");
    const fundraiserInserts = [];
    for (let i = 0; i < FUNDRAISER_COUNT; i++) {
      const { startDate, endDate } = generateFundraiserDates(i);
      const pricePerTicket = faker.number.int({ min: 5, max: 50 });

      fundraiserInserts.push({
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        startDate,
        endDate,
        ticketsSold: 0,
        fundRaised: 0,
        organizationId:
          orgs[faker.number.int({ min: 0, max: orgs.length - 1 })].id,
        adminId:
          createdAdmins[
            faker.number.int({ min: 0, max: createdAdmins.length - 1 })
          ].id,
        pricePerTicket,
      });
    }
    const createdFundraisers = await db
      .insert(fundraisers)
      .values(fundraiserInserts)
      .returning();

    console.log("👥 Seeding supporters...");
    const supporterInserts = [];
    for (let i = 0; i < SUPPORTER_COUNT; i++) {
      supporterInserts.push({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: "national" }),
        street: faker.location.streetAddress(),
        postalCode: generatePostalCode(),
      });
    }

    const createdSupporters = [];
    for (let i = 0; i < supporterInserts.length; i += 500) {
      const batch = supporterInserts.slice(i, i + 500);
      const inserted = await db.insert(supporters).values(batch).returning();
      createdSupporters.push(...inserted);
    }

    console.log("🎫 Seeding orders...");
    const orderInserts = [];
    for (let i = 0; i < ORDER_COUNT; i++) {
      const fundraiser =
        createdFundraisers[
          faker.number.int({ min: 0, max: createdFundraisers.length - 1 })
        ];
      const ticketCount = faker.number.int({ min: 1, max: 10 });
      const amount = ticketCount * fundraiser.pricePerTicket;

      orderInserts.push({
        ticketNumbers: Array.from({ length: ticketCount }, (_, i) => i + 1),
        amount,
        stripePaymentIntentId: `pi_${faker.string.alphanumeric(24)}`,
        stripePaymentStatus: "succeeded",
        fundraiserId: fundraiser.id,
        supporterId:
          createdSupporters[
            faker.number.int({ min: 0, max: createdSupporters.length - 1 })
          ].id,
      });
    }

    for (let i = 0; i < orderInserts.length; i += 500) {
      const batch = orderInserts.slice(i, i + 500);
      await db.insert(orders).values(batch);
    }

    console.log("📊 Updating fundraiser statistics...");
    for (const fundraiser of createdFundraisers) {
      const fundraiserOrders = await db
        .select({
          totalAmount: sql<number>`COALESCE(SUM(amount), 0)::integer`,
          ticketCount: sql<number>`COALESCE(SUM(array_length(ticket_numbers, 1)), 0)::integer`,
        })
        .from(orders)
        .where(eq(orders.fundraiserId, fundraiser.id));

      await db
        .update(fundraisers)
        .set({
          ticketsSold: fundraiserOrders[0].ticketCount,
          fundRaised: fundraiserOrders[0].totalAmount,
        })
        .where(eq(fundraisers.id, fundraiser.id));
    }

    console.log("🎲 Seeding draws...");
    const drawInserts = [];
    for (let i = 0; i < DRAW_COUNT; i++) {
      const fundraiser =
        createdFundraisers[
          faker.number.int({ min: 0, max: createdFundraisers.length - 1 })
        ];
      drawInserts.push({
        drawDate: getFutureDate(3).toDateString(),
        prize: faker.commerce.product(),
        fundraiserId: fundraiser.id,
        supporterId:
          createdSupporters[
            faker.number.int({ min: 0, max: createdSupporters.length - 1 })
          ].id,
      });
    }
    await db.insert(draws).values(drawInserts);

    console.log("✨ Seeding completed successfully!");
    await pool.end();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    await pool.end();
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const includeAuth = args.includes("--with-auth");
seed(includeAuth);
