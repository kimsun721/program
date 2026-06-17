import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // 도커에선 DATABASE_URL(postgres:5432) 주입, 로컬은 기본값(localhost:5434)
    url:
      process.env.DATABASE_URL ??
      "postgresql://lingua:lingua@localhost:5434/linguaclass_p3",
  },
});
