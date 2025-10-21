# TavernaStream

Plataforma de streaming de filmes e séries com integração TMDB e PlayerFlix.

## Visão Geral

TavernaStream é uma aplicação web full-stack para streaming de filmes e séries. A aplicação combina dados do TMDB (The Movie Database) com URLs de vídeo armazenadas em JSONBin, oferecendo uma experiência completa de streaming.

## Arquitetura

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Estilo**: Tailwind CSS + Radix UI
- **Roteamento**: Wouter
- **Gerenciamento de Estado**: TanStack Query (React Query)
- **UI Components**: Radix UI (Dialog, Tabs, etc.)

### Backend
- **Framework**: Express.js + TypeScript
- **Runtime**: Node.js com tsx
- **API Externa**: TMDB API
- **Armazenamento**: 
  - PostgreSQL (Neon) para "Minha Lista"
  - In-memory storage (desenvolvimento)
  - JSONBin para URLs de vídeo (com cache inteligente)

## Estrutura do Projeto

```
tavernastream/
├── client/                 # Frontend React
│   └── src/
│       ├── components/     # Componentes React
│       │   ├── ui/        # Componentes UI (Radix)
│       │   ├── Header.tsx
│       │   ├── HeroBanner.tsx
│       │   ├── MediaCard.tsx
│       │   ├── MediaModal.tsx
│       │   ├── PlayerOverlay.tsx
│       │   └── ...
│       ├── pages/         # Páginas da aplicação
│       │   ├── Home.tsx
│       │   └── MyListPage.tsx
│       ├── lib/           # Utilitários
│       └── hooks/         # React Hooks customizados
├── server/                # Backend Express
│   ├── index.ts          # Entry point
│   ├── routes.ts         # API routes
│   ├── tmdb.ts           # TMDB API client
│   ├── jsonbin.ts        # JSONBin data
│   ├── storage.ts        # Armazenamento
│   └── vite.ts           # Vite dev server
└── shared/               # Código compartilhado
    └── schema.ts         # Types e interfaces
```

## Recursos Principais

### 1. Catálogo de Mídia
- Filmes e séries categorizados por gênero
- Atualização automática a cada 30 segundos
- Banner principal com a obra mais recente adicionada
- Metadados do TMDB (títulos, pôsters, sinopses, avaliações)

### 2. Player de Vídeo
- **Opção 1 (PlayerFlix)**: Player com anúncios
  - Filmes: usa IMDB ID quando disponível
  - Séries: formato `/serie/{tmdb_id}/{season}/{episode}`
- **Opção 2 (Google Drive)**: Player sem anúncios
  - URLs diretas do Google Drive
- **Funcionalidades**:
  - Trocar entre players após seleção
  - Interface completamente responsiva (desktop e mobile)
  - Navegação de episódios integrada (séries/animes)
  - Botões de episódio anterior/próximo
  - Indicador de progresso na temporada

### 3. Minha Lista
- Adicionar/remover filmes e séries
- Persistência em banco de dados
- Acesso rápido aos favoritos

### 4. Busca
- Busca em tempo real
- Integração com TMDB Search API
- Filtrado por disponibilidade no JSONBin

### 5. Interface Responsiva
- Design mobile-first
- Navegação adaptativa (desktop/mobile)
- Player de vídeo responsivo (aspect ratio 16:9)

## Configuração

### Variáveis de Ambiente
- `TMDB_API_KEY`: Chave da API do TMDB (obrigatório)
- `JSONBIN_API_KEY`: Chave da API do JSONBin (obrigatório)
- `JSONBIN_MOVIES_ID`: ID do bin de filmes no JSONBin (obrigatório)
- `JSONBIN_SERIES_ID`: ID do bin de séries no JSONBin (obrigatório)
- `DATABASE_URL`: URL do PostgreSQL (já configurado)
- `PORT`: Porta do servidor (padrão: 5000)

### Desenvolvimento
```bash
npm install
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## APIs Utilizadas

### TMDB API
- Detalhes de filmes e séries
- IDs externos (IMDB)
- Busca de mídia
- Imagens (posters, backdrops)

### PlayerFlix API
- Filmes: `https://playerflixapi.com/filme/{imdb_id}`
- Séries: `https://playerflixapi.com/serie/{tmdb_id}/{season}/{episode}`

## Sistema de Cache do JSONBin

A aplicação implementa um sistema inteligente de cache para otimizar o acesso aos dados do JSONBin:

### Características do Cache
- **TTL (Time To Live)**: 30 segundos
- **ETag Support**: Usa headers HTTP para verificar se os dados mudaram
- **Stale-if-error**: Retorna dados em cache se houver erro na API
- **Automatic Refresh**: O frontend atualiza automaticamente a cada 30 segundos

### Como Funciona
1. **Primeira requisição**: Busca dados do JSONBin e armazena em cache com ETag
2. **Requisições subsequentes** (dentro de 30s): Retorna dados do cache
3. **Após 30s**: Faz nova requisição com ETag
   - Se dados não mudaram (304 Not Modified): Atualiza timestamp do cache
   - Se dados mudaram (200 OK): Atualiza cache com novos dados
4. **Em caso de erro**: Retorna dados em cache (se disponível)

### Vantagens
- ✅ Atualização automática quando você modifica o JSONBin online
- ✅ Baixo consumo de requisições (graças ao ETag)
- ✅ Alta disponibilidade (fallback para cache em caso de erro)
- ✅ Performance otimizada (30s de cache)

## JSONBin Data Structure

### Filmes
```json
{
  "tmdb_id": "google_drive_url"
}
```

### Séries
```json
{
  "tmdb_id": {
    "titulo": "Nome da Série",
    "temporadas": {
      "1": ["url_ep1", "url_ep2", ...],
      "2": ["url_ep1", "url_ep2", ...]
    }
  }
}
```

## Últimas Alterações (20/10/2025)

### Correções Implementadas

#### Primeira Rodada
1. ✅ **Player de vídeo responsivo**: Corrigido aspect ratio 16:9 perfeito em desktop e mobile
2. ✅ **API PlayerFlix**: 
   - Filmes agora usam IMDB ID (obtido do TMDB)
   - Séries com formato correto: `/serie/{tmdb_id}/{season}/{episode}`
3. ✅ **Atualização em tempo real**: Catálogo atualiza automaticamente a cada 30 segundos
4. ✅ **Banner principal**: Mostra a obra mais recente adicionada ao JSONBin
5. ✅ **IDs corretos**: PlayerFlix usa os IDs do JSONBin corretamente

#### Segunda Rodada
6. ✅ **Player mobile completamente responsivo**: 
   - Iframe agora se adapta perfeitamente em todas as telas
   - Usa `flex` e `absolute` positioning para ocupar espaço disponível
   - Container responsivo mantém proporções corretas
7. ✅ **Botão "Trocar Player"**: 
   - Permite mudar entre PlayerFlix e Google Drive após selecionar
   - Aparece no topo esquerdo quando um player está ativo
8. ✅ **Navegação de episódios integrada**: 
   - Botões "Anterior" e "Próximo" dentro do player para séries
   - Mostra progresso (ex: "Episódio 3 de 13")
   - Exibe temporada atual
   - Desabilita botões quando não há mais episódios
   - Ao trocar episódio, reseta seleção de player para escolher novamente

#### Terceira Rodada - Sistema de Cache JSONBin
9. ✅ **Integração real com JSONBin API**:
   - Dados agora são buscados diretamente do JSONBin (não mais hardcoded)
   - Configuração via variáveis de ambiente (JSONBIN_API_KEY, JSONBIN_MOVIES_ID, JSONBIN_SERIES_ID)
   - Atualização automática quando você modifica o JSONBin online
10. ✅ **Sistema de cache inteligente**:
   - Cache em memória com TTL de 30 segundos
   - Suporte a ETag para otimizar requisições HTTP
   - Fallback para dados em cache em caso de erro na API
   - Atualização automática do catálogo a cada 30 segundos
11. ✅ **Arquitetura assíncrona**:
   - Refatoração completa do sistema de dados para ser assíncrono
   - Rotas Express otimizadas com Promise.all para paralelização
   - Melhor tratamento de erros e performance

## Tecnologias

- **TypeScript**: Tipagem estática
- **React Query**: Cache e sincronização de dados
- **Tailwind CSS**: Estilização utilitária
- **Radix UI**: Componentes acessíveis
- **Framer Motion**: Animações
- **Drizzle ORM**: Migrações de banco de dados
- **Zod**: Validação de schemas
