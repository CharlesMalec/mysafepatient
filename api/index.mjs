import Fastify from "fastify";
const app = Fastify({ logger: false });

app.get("/health", async () => ({ ok: true }));

export default async (event, _context, cb) => {
  const req = { method: event.httpMethod, url: event.path, headers: event.headers };
  const res = { statusCode: 200, headers: {}, body: "",
    setHeader(k,v){ this.headers[k]=v; },
    end(payload){ this.body = typeof payload === "string" ? payload : JSON.stringify(payload); cb(null, this); }
  };
  app.routing(req, res);
};
