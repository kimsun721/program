import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: "postgresql://lingua:lingua@localhost:5433/linguaclass_p2",
  },
});
