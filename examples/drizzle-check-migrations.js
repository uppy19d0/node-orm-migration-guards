import { assertDrizzleMigrationDirectory } from "drizzle-migration-guard";

assertDrizzleMigrationDirectory("drizzle", {
  failOnWarnings: true
});

console.log("Drizzle migrations passed safety checks.");

