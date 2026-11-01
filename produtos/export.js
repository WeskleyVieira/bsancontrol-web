"use strict";
// Every value is quoted; untrusted spreadsheet formulas are forced to text.
function cell(value){let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function csv(headers,rows){return '\uFEFF'+[headers,...rows].map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';}
const amount=value=>value==null?'':(Number(value)/100).toFixed(2).replace('.',',');
module.exports={csv,amount};
