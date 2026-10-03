// dbx.js — camada de banco DUAL-MODE: SQLite local (node:sqlite) OU Postgres (se DATABASE_URL). Interface async.
// Local (dev/teste): nada a instalar. Nuvem (Render): DATABASE_URL setado → usa Postgres (dep 'pg').
const path = require("path");
// credencial: env DATABASE_URL, ou arquivo git-ignored db_config.json (a senha NUNCA no código/git)
if (!process.env.DATABASE_URL) { try { const c = require("./db_config.json"); if (/^postgres/i.test(c.DATABASE_URL || "")) process.env.DATABASE_URL = c.DATABASE_URL; } catch (e) {} }
const IS_PG = !!process.env.DATABASE_URL;
let impl;

if (IS_PG) {
  // 'pg' normalmente vem do node_modules (Render). Local: o npm trava no Drive, então instalamos em
  // ~/.bsancontrol/deps/node_modules — fallback acha lá sem precisar de NODE_PATH.
  const { Pool } = (() => { try { return require("pg"); }
    catch (e) { return require(path.join(require("os").homedir(), ".bsancontrol", "deps", "node_modules", "pg")); } })();
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "0" ? false : { rejectUnauthorized: false },
    max: 6,
  });
  const conv = sql => { let i = 0; return sql.replace(/\?/g, () => "$" + (++i)); }; // ?,?  →  $1,$2
  impl = {
    pg: true,
    all: async (sql, p = []) => (await pool.query(conv(sql), p)).rows,
    get: async (sql, p = []) => (await pool.query(conv(sql), p)).rows[0] || null,
    run: async (sql, p = []) => { await pool.query(conv(sql), p); },
    exec: async (sql) => { await pool.query(sql); },
    // insert em lote (chunks de 500) com cláusula de conflito configurável
    bulk: async (baseInsert, rows, conflict = "") => {
      if (!rows.length) return;
      const cols = rows[0].length;
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const vals = chunk.map((_, r) => "(" + Array.from({ length: cols }, (_, c) => "$" + (r * cols + c + 1)).join(",") + ")").join(",");
        await pool.query(baseInsert + " VALUES " + vals + " " + conflict, chunk.flat());
      }
    },
    begin: async () => {}, commit: async () => {}, // no-op (o bulk já é transacional por statement)
    close: () => pool.end(),
  };
} else {
  const { DatabaseSync } = require("node:sqlite");
  const os = require("os"), fs = require("fs");
  // IMPORTANTE: fora do Google Drive (o Drive trava o arquivo durante o sync → EBUSY). Disco local.
  const DBFILE = process.env.SQLITE_FILE || path.join(os.homedir(), ".bsancontrol", "bsan.db");
  fs.mkdirSync(path.dirname(DBFILE), { recursive: true });
  const db = new DatabaseSync(DBFILE);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;");
  impl = {
    pg: false, raw: db,
    all: async (sql, p = []) => db.prepare(sql).all(...p),
    get: async (sql, p = []) => db.prepare(sql).get(...p) || null,
    run: async (sql, p = []) => { db.prepare(sql).run(...p); },
    exec: async (sql) => { db.exec(sql); },
    // no SQLite o bulk é feito com prepared stmt em transação (quem chama usa dbx.raw p/ velocidade)
    bulk: async (baseInsert, rows, conflict = "") => {
      const cols = rows[0] ? rows[0].length : 0;
      const ph = "(" + Array.from({ length: cols }, () => "?").join(",") + ")";
      const st = db.prepare(baseInsert + " VALUES " + ph + " " + conflict.replace(/EXCLUDED\./g, "excluded."));
      db.exec("BEGIN"); for (const r of rows) st.run(...r); db.exec("COMMIT");
    },
    begin: async () => db.exec("BEGIN"), commit: async () => db.exec("COMMIT"),
    close: () => db.close(),
  };
}
impl.IS_PG = IS_PG;
module.exports = impl;
