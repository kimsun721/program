import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: "postgresql://lingua:lingua@localhost:5434/linguaclass_p3",
  },
});
