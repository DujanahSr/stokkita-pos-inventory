const { z } = require("zod");
const s = z.object({ qty: z.number() });
const r = s.safeParse({ qty: "abc" });
console.log(r.error.issues);
