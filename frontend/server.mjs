import { createServer } from "https";
import { readFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const next = require("next");

const dev = true;

const hostname = "local.sports.kptmangaluru.in";
const port = 443;

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

const httpsOptions = {
  key: readFileSync(
    "./certs/local.sports.kptmangaluru.in-key.pem"
  ),

  cert: readFileSync(
    "./certs/local.sports.kptmangaluru.in.pem"
  ),
};

app.prepare().then(() => {
  createServer(
    httpsOptions,
    async (req, res) => {
      try {
        await handle(req, res);
      } catch (error) {
        console.error(error);

        res.statusCode = 500;
        res.end("Internal server error");
      }
    }
  ).listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log("");
    console.log(
      "=============================================="
    );
    console.log(
      " KPT SPORTS LOCAL HTTPS SERVER"
    );
    console.log(
      "=============================================="
    );
    console.log("");
    console.log(
      ` https://${hostname}`
    );
    console.log("");
    console.log(
      " Running on HTTPS port 443"
    );
    console.log(
      "=============================================="
    );
    console.log("");
  });
});