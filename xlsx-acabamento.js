// xlsx-acabamento.js — corrige o .xlsx gravado pelo xlsx-populate para o Excel abrir sem "reparo". 12/11/2026.
// Usado pelo relatorio-gerencial.js e pelo custos-powerfull-online-montar.js. Três defeitos conhecidos do xlsx-populate 1.21:
//   1. <pane> gravado DEPOIS de <selection> no <sheetView> (o Excel exige antes) — aba de modelo que já tinha <selection>;
//   2. lista de opções (dataValidation) com os campos não informados como ="undefined" (o Excel recusa);
//   3. <fill/> vazio nos estilos sem preenchimento (o Excel tolera; outros leitores não) → <fill><patternFill/></fill>.
"use strict";
const path = require("path"), os = require("os");
const dep = n => { try { return require(n); } catch (e) { return require(path.join(os.homedir(), ".bsancontrol", "deps", "node_modules", n)); } };
const JSZip = dep("jszip");

async function corrigirZip(zip) {
  for (const f of Object.keys(zip.files).filter(f => /^xl\/worksheets\/sheet\d+\.xml$/.test(f))) {
    const x = await zip.file(f).async("string");
    const y = x.replace(/(<selection[^>]*\/>)(<pane[^>]*\/>)/g, "$2$1").replace(/ [A-Za-z]+="undefined"/g, "");
    if (y !== x) zip.file(f, y);
  }
  const st = zip.file("xl/styles.xml");
  if (st) zip.file("xl/styles.xml", (await st.async("string")).replace(/<fill\/>/g, "<fill><patternFill/></fill>"));
  return zip;
}
async function corrigir(buffer) { const zip = await corrigirZip(await JSZip.loadAsync(buffer)); return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }); }
module.exports = { corrigir, corrigirZip, JSZip };
