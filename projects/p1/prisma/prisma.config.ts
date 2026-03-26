import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://lingua:lingua@localhost:5432/linguaclass",
  },
});
