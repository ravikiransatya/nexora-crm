import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Nexora ERP API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs: http://localhost:${env.PORT}/api/docs`);
});
