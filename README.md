# Dashboard Financeiro

Dashboard de controle de compras parceladas, assinaturas e combustível, alimentado
por uma planilha do Google Sheets (somente leitura).

## Setup

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.local.example` para `.env.local` e preencha:
   - `GOOGLE_SHEETS_API_KEY`: sua API Key do Google Cloud (com a Google Sheets
     API habilitada).
   - `GOOGLE_SPREADSHEET_ID`: o ID da planilha (o trecho entre `/d/` e
     `/edit` na URL do Google Sheets).
3. A planilha precisa estar com compartilhamento "Qualquer pessoa com o link
   pode visualizar", já que o acesso é via API Key (sem OAuth).
4. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse http://localhost:3000 e clique em **Atualizar dados**.

`.env.local` nunca deve ser commitado — já está no `.gitignore`.

## Como os dados são lidos

- `src/lib/googleSheets.ts` busca as abas `Compras Parceladas` e `Resumo Mensal`
  via Google Sheets API (`spreadsheets.values.get`), procurando a linha de
  cabeçalho pelo nome da primeira coluna e lendo as linhas seguintes até
  encontrar uma linha em branco.
- A leitura acontece só no servidor (rota `src/app/api/sheet-data/route.ts`) —
  a API Key nunca é exposta ao navegador.
- A aplicação nunca escreve na planilha.
- Atualização é sob demanda: os dados são buscados ao carregar a página e
  sempre que o botão "Atualizar dados" é clicado.

## Estrutura

```
src/
├── app/
│   ├── page.tsx                 → dashboard principal
│   └── api/sheet-data/route.ts  → busca e parseia a planilha
├── components/                  → StatTile, gráficos, tabela, filtros
└── lib/
    ├── googleSheets.ts          → integração com a Sheets API
    ├── parsers.ts                → parsing de moeda BRL e datas "mmm./aaaa"
    ├── colors.ts                 → paleta categórica fixa (titular/tipo/status)
    ├── format.ts                  → formatação de moeda
    └── types.ts
```
