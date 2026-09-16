# Auditoria do projeto — Dashboard Financeiro

Data da auditoria: 2026-09-15
Escopo: estado do projeto logo após a primeira versão funcional (leitura do Google
Sheets, KPIs, gráficos, tabela filtrável). Nenhuma alteração de comportamento foi
feita nesta etapa — este documento é só leitura/registro.

---

## 1. Estrutura de pastas e arquivos

```
dashboard-financeiro/
├── .env.local              # segredos locais (API key + spreadsheet id) — nunca commitado
├── .env.local.example      # template sem a chave real
├── AUDITORIA.md            # este documento
├── README.md               # instruções de setup/execução
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs      # gerado pelo create-next-app (Tailwind v4 via @tailwindcss/postcss)
└── src/
    ├── app/
    │   ├── layout.tsx              # shell HTML, metadata, fontes Geist
    │   ├── page.tsx                # única página do dashboard (client component)
    │   ├── globals.css             # paleta de cores (tokens light/dark) + reset Tailwind
    │   └── api/
    │       └── sheet-data/
    │           └── route.ts        # rota server-side que busca e parseia a planilha
    ├── components/
    │   ├── StatTile.tsx            # cartão de KPI (label + valor + hint opcional)
    │   ├── RefreshButton.tsx       # botão "Atualizar dados"
    │   ├── MonthlyTrendChart.tsx   # gráfico de linha (total geral por mês)
    │   ├── BreakdownBarChart.tsx   # gráfico de barras reutilizável (por titular / por tipo)
    │   ├── UpcomingEndings.tsx     # lista de compromissos que terminam em breve
    │   └── ComprasTable.tsx        # tabela filtrável de lançamentos
    └── lib/
        ├── googleSheets.ts         # integração com a Google Sheets API + parsing das abas
        ├── parsers.ts               # parsing de moeda BRL e datas "mmm./aaaa"
        ├── colors.ts                 # paleta categórica (titular/tipo/status)
        ├── useIsDark.ts              # hook que expõe o tema claro/escuro do SO
        ├── format.ts                  # formatação de moeda (BRL)
        └── types.ts                   # tipos compartilhados (Compra, ResumoMensal, SheetData)
```

Não há testes automatizados, não há repositório git inicializado (`.git` não existe
ainda) e não há CI configurado.

---

## 2. Como os dados são buscados no Google Sheets

- A leitura acontece **só no servidor**, na rota `GET /api/sheet-data`
  ([route.ts](src/app/api/sheet-data/route.ts)). O browser nunca vê a API key.
- `route.ts` lê `GOOGLE_SHEETS_API_KEY` e `GOOGLE_SPREADSHEET_ID` de
  `process.env` e chama `fetchSheetData(spreadsheetId, apiKey)`
  ([googleSheets.ts](src/lib/googleSheets.ts)).
- `fetchSheetData` dispara **duas chamadas em paralelo** (`Promise.all`) para o
  endpoint `GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}?key={apiKey}`,
  uma por aba:
  - `'Compras Parceladas'!A1:K300`
  - `'Resumo Mensal'!A1:R60`
- Cada resposta é uma matriz de arrays de strings (`values: string[][]`) — a
  Sheets API não devolve tipos, tudo vem como texto formatado igual à célula
  exibida na planilha (ex.: `"R$ 30,96"`, `"out./2026"`).
- A rota usa `export const dynamic = "force-dynamic"` e o fetch usa
  `cache: "no-store"` — ou seja, **nunca há cache** entre requisições; toda
  chamada ao endpoint bate na API do Google de novo.
- A aplicação **nunca escreve** na planilha — só `values.get`, nenhum `update`/`append`.

## 3. Quais abas da planilha são utilizadas

| Aba | Uso |
|---|---|
| `Compras Parceladas` | Dados brutos, uma linha por lançamento (compra parcelada, à vista, assinatura ou combustível). Fonte da tabela detalhada e dos filtros. |
| `Resumo Mensal` | Agregações pré-calculadas pela própria planilha (fórmulas), uma linha por mês, para os próximos ~24 meses. Fonte dos KPIs e dos gráficos. |

Duas outras abas existem na planilha ("Como usar esta planilha" e a aba de
listas de apoio — Titulares/Cartões/Tipos) mas **não são lidas pelo código** —
os valores de titulares/cartões/tipos são derivados dinamicamente dos próprios
dados de `Compras Parceladas` (ver seção 4).

## 4. Como cada campo da planilha é transformado

Todo o parsing vive em [googleSheets.ts](src/lib/googleSheets.ts) e
[parsers.ts](src/lib/parsers.ts).

### Mecanismo genérico de leitura de tabela

`extractTable(rows, headerMarker)`:
1. Procura a linha cuja **primeira célula** é exatamente igual ao `headerMarker`
   (`"Titular"` para Compras Parceladas, `"Mês"` para Resumo Mensal) — isso pula
   as linhas de título/descrição mescladas que ficam acima do cabeçalho real.
2. A partir da linha seguinte, coleta linhas de dados até encontrar a primeira
   linha cuja primeira célula está vazia (fim da tabela).
3. `rowsToObjects(header, dataRows)` transforma cada linha num objeto
   `{ [nomeDaColuna]: valorDaCelula }`, usando o texto do cabeçalho como chave.

Esse mecanismo é **genérico** (não depende de índice de coluna, só do nome do
cabeçalho) — colunas podem ser reordenadas na planilha sem quebrar o parsing,
desde que o **texto do cabeçalho não mude**.

### Aba "Compras Parceladas" → `Compra`

| Coluna na planilha | Campo em `Compra` | Transformação |
|---|---|---|
| Titular | `titular` | string direta |
| Tipo de Compra | `tipoCompra` | string direta (cast para `TipoCompra`) |
| Cartão | `cartao` | string direta |
| Descrição | `descricao` | string direta |
| Valor da Parcela/Mensalidade | `valorParcela` | `parseBRL()` → number \| null |
| Qtd. Parcelas | `qtdParcelas` | `Number()` se não vazio, senão `null` |
| Mês da 1ª Parcela / Início | `mesInicio` | string direta (`"out./2026"`, sem parsing de data) |
| Mês da Última Parcela | `mesFim` | string direta |
| Valor Total da Compra | `valorTotal` | `parseBRL()` → number \| null (`null` quando o texto é `"Recorrente"`) |
| Valor Total da Compra | `isRecorrente` | `true` se o texto literal for `"Recorrente"` |
| Meses Restantes | `mesesRestantes` | `Number()`, ou `null` se o texto for `"Recorrente"` |
| Status | `status` | string direta (`"Em andamento"` \| `"Quitado"` \| `"Ativa"`) |

`parseBRL("R$ 1.234,56")` → remove `"R$"`, remove pontos de milhar, troca `,`
por `.`, `Number()`. Retorna `null` para valores vazios ou que não começam com
`"R$"` (cobre o caso `"Recorrente"`).

### Aba "Resumo Mensal" → `ResumoMensal`

| Coluna(s) na planilha | Campo em `ResumoMensal` |
|---|---|
| Mês | `mes` (string, ex. `"set./2026"`) |
| Total Geral | `totalGeral` (`parseBRL` ?? 0) |
| Iago / Esposa / Cícero / Sandra / Alessandra | `porTitular: Record<string, number>` |
| Parcelado / À vista / Assinatura / Combustível | `porTipo: Record<string, number>` |
| Termina Neste Mês (Total) | `terminaTotal` |
| Termina Neste Mês (Parcelado) | `terminaParcelado` |
| Termina - Iago / Termina - Esposa / ... | `terminaPorTitular: Record<string, number>` |

Os nomes de titular/tipo usados para montar `porTitular`/`porTipo` vêm de duas
constantes **hardcoded** no topo de `googleSheets.ts`:

```ts
const TITULARES = ["Iago", "Esposa", "Cícero", "Sandra", "Alessandra"];
const TIPOS: TipoCompra[] = ["Parcelado", "À vista", "Assinatura", "Combustível"];
```

Isso é diferente de `titulares`/`cartoes`/`tipos` no objeto `SheetData` final,
que são **derivados dinamicamente** com `Array.from(new Set(...))` a partir das
linhas de `Compras Parceladas` — ou seja, existem *duas fontes* para "quais
titulares existem": uma fixa (usada só para ler as colunas do Resumo Mensal) e
uma dinâmica (usada nos filtros e nos gráficos de breakdown). Ver seção 12/13.

## 5. KPIs e cálculos existentes

Todos os KPIs usam `mesAtual = data.resumo[0]` — **a primeira linha da aba
Resumo Mensal**, assumida como o mês corrente (ver seção 13, é uma suposição
implícita, não uma verificação de data real).

| KPI / gráfico | Cálculo | Onde |
|---|---|---|
| Total do mês | `mesAtual.totalGeral` (já vem pronto da planilha) | `StatTile` em `page.tsx` |
| Termina este mês | `mesAtual.terminaTotal` (já vem pronto da planilha) | `StatTile` em `page.tsx` |
| Lançamentos ativos | `compras.filter(c => status === "Em andamento" || status === "Ativa").length` — calculado no cliente | `StatTile` em `page.tsx` |
| Assinaturas ativas | `compras.filter(c => tipoCompra === "Assinatura").length` — calculado no cliente | `StatTile` em `page.tsx` |
| Tendência mensal (24 meses) | `resumo.map(r => ({ mes: r.mes, total: r.totalGeral }))` — sem cálculo, só leitura direta | `MonthlyTrendChart` |
| Por titular (mês atual) | `mesAtual.porTitular[titular]` para cada titular | `BreakdownBarChart` |
| Por tipo de gasto (mês atual) | `mesAtual.porTipo[tipo]` para cada tipo | `BreakdownBarChart` |
| Compromissos terminando em breve | `resumo.filter(r => r.terminaTotal > 0).slice(0, 6)` | `UpcomingEndings` |

**Importante:** nenhum KPI é calculado a partir das linhas brutas de
`Compras Parceladas` somando valores — todos os totais/agregados vêm prontos
da aba `Resumo Mensal` (que já tem as fórmulas). O único cálculo feito no
cliente é uma **contagem** de linhas (`.filter().length`), não uma soma
financeira.

## 6. Componentes e o que cada um exibe

| Componente | Exibe | Recebe de `page.tsx` |
|---|---|---|
| `StatTile` | Um cartão de KPI (label, valor, hint opcional) | valor já formatado, string |
| `RefreshButton` | Botão que dispara `load()` de novo; mostra "Atualizando..." enquanto `loading` | `onRefresh`, `loading` |
| `MonthlyTrendChart` | Gráfico de linha, `total` por `mes`, 24 meses | `resumo: ResumoMensal[]` |
| `BreakdownBarChart` | Gráfico de barras genérico (usado 2x: por titular e por tipo) | `title`, `data: {name, value}[]`, `colorMap` |
| `UpcomingEndings` | Lista dos próximos 6 meses com `terminaTotal > 0`, com o detalhamento por titular | `resumo`, `monthsAhead` (default 6) |
| `ComprasTable` | Tabela completa de lançamentos + 2 filtros (titular, tipo) | `compras`, `titulares`, `tipos` |

`page.tsx` é o único componente com estado de fetch (`data`, `loading`,
`error`) — todos os outros são "burros" (recebem props já prontas, sem fetch
próprio).

## 7. Como funciona o filtro dos lançamentos

Implementado inteiramente em [ComprasTable.tsx](src/components/ComprasTable.tsx),
client-side, sem chamada de rede:

- Dois `<select>` controlados por `useState`: `titular` e `tipo` (default
  `"Todos"` para ambos).
- `useMemo` recalcula a lista filtrada sempre que `compras`, `titular` ou
  `tipo` mudam: `compras.filter(c => (titular === ALL || c.titular === titular) && (tipo === ALL || c.tipoCompra === tipo))`.
- É um filtro **E** (AND) simples entre as duas dimensões — não há filtro por
  cartão, status, período ou texto livre hoje.
- As opções dos `<select>` vêm de `data.titulares`/`data.tipos` (listas
  derivadas dinamicamente, não hardcoded).

## 8. Como funciona o botão "Atualizar dados"

- `page.tsx` define `load()` (via `useCallback`): seta `loading=true`, limpa
  erro, faz `fetch("/api/sheet-data")`, e no fim seta `data` ou `error`, e
  `loading=false` no `finally`.
- `useEffect(() => { load(); }, [load])` chama `load()` **uma vez ao montar a
  página** — ou seja, os dados já carregam sozinhos na primeira visita.
- `RefreshButton` chama a mesma função `load` quando clicado — não existe
  polling nem revalidação automática em background; a única forma de atualizar
  é o clique (ou recarregar a página).
- Cada clique repete as duas chamadas à Sheets API do zero (sem cache, ver
  seção 2) — ou seja, o custo de quota da API é proporcional ao número de
  cliques + carregamentos de página.

## 9. Variáveis de ambiente necessárias

Definidas em `.env.local` (não versionado; `.env.local.example` documenta o
formato):

| Variável | Necessária para | Observação |
|---|---|---|
| `GOOGLE_SHEETS_API_KEY` | Autenticar as chamadas à Sheets API | API Key do Google Cloud com a Sheets API habilitada; exige que a planilha esteja com link de visualização público |
| `GOOGLE_SPREADSHEET_ID` | Identificar qual planilha ler | Já preenchido com o ID da planilha atual no `.env.local.example` |

Sem essas duas, `GET /api/sheet-data` retorna `500` com uma mensagem de erro
explícita (não quebra silenciosamente).

## 10. Como executar o projeto localmente

```bash
npm install
# editar .env.local com a API key real (GOOGLE_SPREADSHEET_ID já vem preenchido)
npm run dev
# abrir http://localhost:3000
```

## 11. Como fazer o build de produção

```bash
npm run build   # gera o build otimizado (Next.js + Turbopack)
npm run start   # serve o build gerado
```

`npm run build` também roda o type-check do TypeScript como parte do processo
(`Running TypeScript...`) — um erro de tipos falha o build.

`npm run lint` roda o ESLint (`eslint-config-next` + regras do
`react-hooks`/React Compiler) separadamente do build.

## 12. Limitações técnicas atuais

- **Sem cache** — cada carregamento de página ou clique em "Atualizar" bate na
  Google Sheets API de novo. Em uso normal isso é seguro (quota generosa), mas
  não escala para múltiplos usuários simultâneos nem para automações que
  chamem a rota com frequência.
- **Ranges fixos com teto implícito** — `A1:K300` (Compras Parceladas) e
  `A1:R60` (Resumo Mensal). Se a aba de compras ultrapassar 300 linhas de
  dados (hoje tem 66), linhas além disso são **silenciosamente ignoradas** —
  não há erro, só dados faltando.
- **Sem paginação na tabela** — hoje renderiza todas as linhas filtradas de
  uma vez (66 linhas, ok; centenas ficariam pesadas).
- **Sem testes automatizados** — nenhum teste unitário ou de integração;
  qualquer regressão só é percebida manualmente.
- **Sem git inicializado** — não há histórico de versão nem forma de reverter
  mudanças além de backups manuais.
- **Chave de API exige planilha com link público** — trade-off aceito
  conscientemente (ver conversa inicial), mas é uma limitação de segurança:
  qualquer pessoa com o `GOOGLE_SPREADSHEET_ID` + uma API key própria
  conseguiria ler os dados.
- **`mesAtual = resumo[0]`** — o "mês atual" do dashboard é sempre a primeira
  linha da aba Resumo Mensal, não uma comparação com a data real do sistema.
  Funciona hoje porque a fórmula da planilha sempre começa no mês corrente,
  mas é uma suposição implícita, não uma garantia verificada em código.
- **Erros da API do Google são repassados quase crus para a UI** — a mensagem
  de erro (`err.message`) do Google aparece diretamente na tela; pode vazar
  detalhes técnicos (nomes de projeto, etc.) para quem estiver usando o
  dashboard.
- **Sem acessibilidade formal nos filtros** — os `<select>` da tabela não têm
  `<label>` associado (só ficam ao lado do texto "Lançamentos (N)"), o que é
  uma barreira leve para leitores de tela.

## 13. Pontos do código que exigem cuidado ao alterar

- **`extractTable`/`rowsToObjects` em `googleSheets.ts`** — dependem de
  correspondência **exata de texto** com os cabeçalhos da planilha (`"Titular"`,
  `"Mês"`, `"Valor da Parcela/Mensalidade"`, etc.) e com o **nome literal das
  abas** (`'Compras Parceladas'`, `'Resumo Mensal'`). Renomear uma coluna ou
  aba na planilha quebra o parsing (com erro explícito, não silencioso — mas
  quebra).
- **`TITULARES`/`TIPOS` hardcoded em `googleSheets.ts`** — usados só para ler
  as colunas de `porTitular`/`porTipo`/`terminaPorTitular` do Resumo Mensal.
  Adicionar uma 6ª pessoa ou um 5º tipo de gasto na planilha **não aparece
  automaticamente** nesses agregados até essas duas listas serem atualizadas
  no código — mesmo que `titulares`/`tipos` (as listas dinâmicas usadas nos
  filtros) já reflitam o novo valor.
- **`TITULAR_HEX`/`TITULAR_COLORS`/`TIPO_HEX` em `colors.ts`** — mapas de cor
  fixos por nome. Um titular ou tipo fora dessas listas cai no `FALLBACK_HEX`
  (por índice, não por identidade), o que quebra a garantia de "a mesma
  pessoa sempre tem a mesma cor em todo gráfico" quando há mais de 5
  titulares ou 4 tipos.
- **`isAnimationActive={false}` em `MonthlyTrendChart` e `BreakdownBarChart`**
  — **não remover sem entender o motivo.** Foi adicionado depois de um bug
  real e bem confirmado: com a animação de entrada padrão do Recharts
  habilitada, as barras/linha eram computadas corretamente no DOM (geometria e
  cor certas) mas **não eram pintadas na tela** (bug de commit de pintura
  ligado à animação via `requestAnimationFrame`). Reintroduzir a animação
  reintroduz o bug.
- **Cores passadas ao Recharts precisam ser hex literal, nunca `var(--token)`**
  — é por isso que existe `hexFor()` + `useIsDark()` em vez de simplesmente
  usar os tokens CSS de `globals.css` (que funcionam bem em elementos HTML
  comuns, como os pontinhos de legenda, mas não são confiáveis quando passados
  como atributo `fill`/`stroke` de um `<path>` do Recharts).
- **`.env.local`** — contém a API key real. Nunca deve ser commitado; o
  `.gitignore` gerado pelo `create-next-app` já ignora `.env*`, mas isso deve
  ser conferido de novo no dia em que o git for inicializado.
- **`mesAtual = data.resumo[0]`** — ver limitação acima; qualquer refatoração
  que reordene ou filtre `resumo` antes desse ponto muda silenciosamente todos
  os KPIs do topo da página.

## 14. Recomendações de arquitetura para o futuro (não implementadas)

Só recomendações — nenhuma foi aplicada nesta etapa.

1. **Unificar a fonte de titulares/tipos.** Hoje há 3 listas paralelas
   (`TITULARES`/`TIPOS` em `googleSheets.ts`, os `Set` dinâmicos em
   `fetchSheetData`, e os mapas de cor em `colors.ts`). Valeria a pena ter uma
   única fonte de verdade (por exemplo, sempre derivar do que a Sheets API
   retorna) e deixar as cores caírem por um esquema estável (hash do nome →
   slot), eliminando o risco de dessincronia ao adicionar uma pessoa/tipo novo.
2. **Remover ou usar o código morto em `parsers.ts`.** `parseMesAno`,
   `formatMesAno` e `isSameMonth` existem mas não são chamados em lugar
   nenhum. Ou eliminá-los, ou usá-los para resolver a limitação do
   `mesAtual = resumo[0]` (comparando a data real do sistema com `mesInicio`/
   `mes` em vez de assumir que a primeira linha é sempre o mês corrente).
3. **Adicionar um cache leve na rota `/api/sheet-data`** (ex.: `revalidate`
   de alguns segundos, ou memória de processo com TTL curto) para proteger
   contra cliques repetidos no botão "Atualizar" sem perder o modelo
   "atualização sob demanda".
4. **Extrair um schema/validação para a resposta da Sheets API** (ex. zod)
   em vez de `as string[][]`/casts diretos — hoje um erro de formato na
   planilha (célula fora do esperado) só aparece como `NaN`/`undefined`
   silencioso em vez de um erro claro.
5. **Testes automatizados dos parsers** (`parseBRL`, `parseMesAno`,
   `extractTable`) — são funções puras, fáceis de testar, e são justamente o
   ponto mais frágil (acoplado a texto exato da planilha).
6. **Inicializar git** assim que possível, mesmo antes de novas features, para
   ter histórico e poder reverter com segurança.
7. **Paginação ou virtualização da `ComprasTable`** antes que o número de
   lançamentos cresça muito.
8. **Mensagens de erro amigáveis na UI** — hoje qualquer erro da Sheets API é
   mostrado quase cru; vale mapear para mensagens mais humanas (ex.: "não foi
   possível conectar com o Google Sheets, tente novamente").

---

## Mapa da arquitetura atual

```
┌──────────────────────────┐
│   Google Sheets           │
│   (fonte de verdade)      │
│   ├─ aba "Compras         │
│   │   Parceladas"          │
│   └─ aba "Resumo Mensal"   │
└────────────┬──────────────┘
             │ GET values (API Key, somente leitura)
             ▼
┌──────────────────────────────────────────┐
│ src/lib/googleSheets.ts                    │
│  fetchRange() → extractTable() →            │
│  rowsToObjects() → parseCompras()/          │
│  parseResumo() → SheetData                  │
└────────────┬───────────────────────────────┘
             │ chamado por
             ▼
┌──────────────────────────────────────────┐
│ src/app/api/sheet-data/route.ts (server)   │
│  lê env vars → fetchSheetData() →           │
│  devolve JSON (SheetData) ou erro 500/502   │
└────────────┬───────────────────────────────┘
             │ fetch("/api/sheet-data") a partir do browser
             ▼
┌──────────────────────────────────────────┐
│ src/app/page.tsx (client component)        │
│  estado: data / loading / error             │
│  load() no mount + no clique do             │
│  RefreshButton                              │
└──┬────────┬────────┬────────┬─────────┬───┘
   │        │        │        │         │
   ▼        ▼        ▼        ▼         ▼
StatTile  Monthly  Breakdown Upcoming  Compras
(x4)      Trend    BarChart  Endings   Table
          Chart    (x2:              (filtro
                    titular/           titular+tipo,
                    tipo)              client-side)

Suporte transversal:
- src/lib/colors.ts     → paletas categóricas (hex + var(), light/dark)
- src/lib/useIsDark.ts  → tema do SO (para cor literal nos gráficos Recharts)
- src/lib/format.ts     → formatação de moeda BRL
- src/lib/parsers.ts    → parseBRL (usado) + parseMesAno/formatMesAno/
                          isSameMonth (não usados hoje)
- src/lib/types.ts      → Compra, ResumoMensal, SheetData
```

---

Nenhum arquivo de código foi alterado durante esta auditoria. Aguardando
aprovação antes de qualquer mudança.
