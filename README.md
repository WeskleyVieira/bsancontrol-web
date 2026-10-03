# BsanControl · Acompanhamento online

Serviço web (Node puro + Postgres) que serve o **Acompanhamento** com **login por perfil**.
Gerado por `build-online.js` a partir do BsanControl (fonte única do módulo `ac2`).

## Deploy no Render
1. Suba esta pasta para um repositório no GitHub.
2. No Render: **New → Blueprint** (ou Web Service) apontando pro repo.
3. Variáveis de ambiente (aba Environment):
   - `AUTH_REQUIRED` = `1`
   - `DATABASE_URL` = string do pooler da Supabase (porta 6543)
   - `JWT_SECRET` = segredo forte (gere um aleatório)
4. Deploy. O link abre direto no **login** — nada aparece sem autenticar.

O banco é carregado pelo PC (`node db-sync.js` com `DATABASE_URL`), não por aqui.
