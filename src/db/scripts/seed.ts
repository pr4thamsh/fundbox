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

const dbUrl =
  process.argv[2] === "--supabase"
    ? process.env.SUPABASE_DB_URL
    : process.env.LOCAL_DB_URL;

if (!dbUrl) {
  console.error("❌ Database URL not found in environment variables");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const db = drizzle(pool);

const FUNDRAISER_COUNT = 30;
const SUPPORTER_COUNT = 10000;
const ORDER_COUNT = 10000;
const DRAW_COUNT = 55;

const getRandomItem = <T>(array: T[]) =>
  array[faker.number.int({ min: 0, max: array.length - 1 })];

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

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // Fetch existing organizations and admins
    const orgs = await db.select().from(organizations);
    const existingAdmins = await db.select().from(admins);

    if (orgs.length === 0 || existingAdmins.length === 0) {
      throw new Error(
        "❌ No organizations or admins found in database. Please create them first.",
      );
    }

    console.log("💰 Seeding fundraisers...");
    const fundraiserInserts = [];
    for (let i = 0; i < FUNDRAISER_COUNT; i++) {
      const { startDate, endDate } = generateFundraiserDates(i);
      const pricePerTicket = faker.number.int({ min: 5, max: 50 });
      const randomOrg = getRandomItem(orgs);
      const orgAdmins = existingAdmins.filter(
        (admin) => admin.organizationId === randomOrg.id,
      );
      const randomAdmin =
        orgAdmins.length > 0
          ? getRandomItem(orgAdmins)
          : getRandomItem(existingAdmins);

      fundraiserInserts.push({
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        startDate,
        endDate,
        ticketsSold: 0,
        fundRaised: 0,
        organizationId: randomOrg.id,
        adminId: randomAdmin.id,
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
      const randomFundraiser = getRandomItem(createdFundraisers);
      const ticketCount = faker.number.int({ min: 1, max: 10 });
      const amount = ticketCount * randomFundraiser.pricePerTicket;

      orderInserts.push({
        ticketNumbers: Array.from({ length: ticketCount }, (_, i) => i + 1),
        amount,
        stripePaymentIntentId: `pi_${faker.string.alphanumeric(24)}`,
        stripePaymentStatus: "succeeded",
        fundraiserId: randomFundraiser.id,
        supporterId: getRandomItem(createdSupporters).id,
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
      const randomFundraiser = getRandomItem(createdFundraisers);
      drawInserts.push({
        drawDate: getFutureDate(3).toDateString(),
        prize: faker.commerce.product(),
        fundraiserId: randomFundraiser.id,
        supporterId: getRandomItem(createdSupporters).id,
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

seed();
