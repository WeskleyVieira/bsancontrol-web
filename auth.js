// auth.js — senha (scrypt) + JWT (HMAC-SHA256) usando SÓ node:crypto. Zero dependência.
const crypto = require("node:crypto");
const SECRET = process.env.JWT_SECRET || "dev-secret-trocar-em-producao";
const b64 = o => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const unb64 = s => JSON.parse(Buffer.from(s, "base64url").toString());

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(senha, salt, 32).toString("hex");
  return salt + ":" + h;
}
function verificaSenha(senha, armazenado) {
  if (!armazenado || !armazenado.includes(":")) return false;
  const [salt, h] = armazenado.split(":");
  try { return crypto.timingSafeEqual(Buffer.from(h, "hex"), crypto.scryptSync(senha, salt, 32)); }
  catch (e) { return false; }
}
function assinaToken(payload, horas = 12) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ ...payload, exp: Date.now() + horas * 36e5 });
  const sig = crypto.createHmac("sha256", SECRET).update(head + "." + body).digest("base64url");
  return head + "." + body + "." + sig;
}
function verificaToken(token) {
  try {
    const partes = String(token || "").split(".");
    if (partes.length !== 3 || !partes[0] || !partes[1] || !partes[2]) return null;
    const [h, b, s] = partes;
    const sig = crypto.createHmac("sha256", SECRET).update(h + "." + b).digest();
    const got = Buffer.from(s, "base64url");
    if (got.length !== sig.length || !crypto.timingSafeEqual(got, sig)) return null;
    const p = unb64(b);
    if (typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return p;
  } catch (e) { return null; }
}
module.exports = { hashSenha, verificaSenha, assinaToken, verificaToken };
