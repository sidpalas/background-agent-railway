import "dotenv/config";

import app from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
});
