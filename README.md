# Folio — protótipo (front-end)

Protótipo funcional das 3 telas descritas: login, análise/seleção de repositórios
e perfil público com CV em PDF. TypeScript + Next.js (App Router) + Tailwind v4.
Dados 100% mockados em `lib/mock-data.ts` — estruturados para bater com o formato
que a API do GitHub devolve, então trocar por dados reais é trocar a *fonte*, não
a *forma*.

## Rodar localmente

```bash
npm install
npm run dev
```

- `/` — Tela 1, login
- `/connect` — Tela 2, análise (simulada) + seleção de repositórios
- `/[username]` — Tela 3, perfil público (ex: `/marinacosta`)

## O que falta plugar (backend real)

### 1. OAuth do GitHub (Tela 1 → 2)
Você não precisa construir isso do zero — use o OAuth App do próprio GitHub:
- Crie um OAuth App em `github.com/settings/developers`
- No botão "Entrar com GitHub" (`app/page.tsx`), troque o `<Link href="/connect">`
  por um redirect para
  `https://github.com/login/oauth/authorize?client_id=...&scope=read:user,repo`
- Crie uma rota `app/api/auth/callback/route.ts` (Node.js, roda nativo no Next.js)
  que troca o `code` pelo `access_token` e busca os dados via
  [API REST](https://docs.github.com/en/rest) ou
  [GraphQL](https://docs.github.com/en/graphql) do GitHub (esta segunda é melhor
  aqui — dá pra pedir repos + linguagens + commits em uma query só).

### 2. Cálculo de "impacto" e stack real (Tela 2)
O `impactScore` em `mock-data.ts` é um placeholder. Uma fórmula simples que
funciona bem: `stars*3 + forks*2 + commits_recentes + (não é fork ? 10 : 0)`.
Para stack real, a API do GitHub já devolve bytes-por-linguagem por repo
(`GET /repos/{owner}/{repo}/languages`) — dá pra agregar isso direto, sem
precisar analisar código de verdade.

### 3. PDF do currículo (Tela 3)
Implementei o botão "baixar cv (pdf)" com `window.print()` + uma folha de
estilos dedicada (`@media print` em `app/globals.css`) — funciona sem
infraestrutura extra e já gera um PDF limpo pelo próprio navegador.
Se depois vocês quiserem controle total do layout do PDF (multi-coluna,
fontes embutidas, etc.), dá pra substituir por um endpoint
`/api/resume/[username]` que chama um microserviço Python (pandas pra
organizar os dados + `weasyprint` ou `reportlab` pra renderizar) e devolve o
binário do PDF.

## Estrutura
```
app/
  page.tsx              Tela 1 — login
  connect/page.tsx       Tela 2 — análise + seleção
  [username]/page.tsx    Tela 3 — perfil público
components/
  ContributionGraph.tsx  elemento-assinatura (grid de contribuições, 3 estados)
  Logo.tsx
  GithubIcon.tsx
  DownloadCvButton.tsx
lib/
  mock-data.ts           formato de dados (troque pela API real do GitHub)
```

## Design
- Paleta: `#0A0A0A` fundo / `#141414` superfície / `#D9A65C` accent âmbar
  (evita o clichê "preto + verde-terminal")
- Tipografia: mono para dados/headlines, sans para corpo
- Elemento-assinatura: o grid de contribuições do GitHub, reaproveitado com
  três estados (esqueleto pulsando → montagem em cascata → estático) nas 3 telas
