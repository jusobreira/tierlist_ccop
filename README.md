# One Piece Leader Tracker

Uma aplicação interativa de tier list para classificar os líderes do anime One Piece. Arraste e solte cartas de personagens para criar sua própria classificação personalizada.

## Características

- **Drag and Drop**: Arraste cartas de personagens para as tiers (S, A, B, C, F)
- **Busca**: Procure por personagens pelo nome ou código
- **Redimensionável**: Ajuste o tamanho da tier list e da área de personagens não classificados
- **Visualização em Fullscreen**: Clique em qualquer carta para ver a imagem em tamanho completo
- **Edição de Rótulos**: Customize os nomes das tiers
- **Estatísticas**: Veja quantos personagens estão em cada tier
- **Reset**: Limpe toda a tier list com um clique

## Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **UI Components**: Radix UI
- **Drag & Drop**: HTML5 Drag and Drop API
- **Styling**: Tailwind CSS com animações personalizadas

## Instalação Local

### Pré-requisitos

- Node.js 18+
- npm ou pnpm

### Passos

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd one-piece-leader-tracker-final
```

2. Instale as dependências:
```bash
npm install --legacy-peer-deps
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra seu navegador em `http://localhost:3000`

## Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão em `dist/public`.

## Deploy na Vercel

### Opção 1: Via CLI

1. Instale a CLI da Vercel:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

### Opção 2: Via GitHub

1. Faça push do código para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "New Project"
4. Selecione seu repositório
5. Configure as variáveis de ambiente se necessário
6. Clique em "Deploy"

### Configuração Recomendada para Vercel

- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Install Command**: `npm install --legacy-peer-deps`
- **Output Directory**: `dist/public`

## Estrutura do Projeto

```
one-piece-leader-tracker-final/
├── client/                 # Código do frontend
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── lib/           # Utilitários e dados
│   │   ├── App.tsx        # Componente raiz
│   │   └── main.tsx       # Ponto de entrada
│   └── index.html
├── server/                 # Código do backend (Express)
├── shared/                 # Código compartilhado
├── vite.config.ts         # Configuração do Vite
├── tailwind.config.ts     # Configuração do Tailwind
├── tsconfig.json          # Configuração do TypeScript
└── package.json           # Dependências do projeto
```

## Dados dos Personagens

Os dados dos personagens estão em `client/src/lib/characters.ts`. Cada personagem possui:

- `id`: Identificador único
- `code`: Código da carta (ex: OP01-001)
- `name`: Nome do personagem
- `image`: URL da imagem da carta
- `color`: Cor representativa

## Correções Implementadas

### Bug de "Artes Fantasmas"

O bug onde imagens fantasmas de cartas apareciam na tier list foi corrigido alterando a implementação do container de imagem:

**Antes:**
```tsx
<div className="card-image-container">
  <img src={...} />
</div>
```

**Depois:**
```tsx
<div className="relative w-full h-[140px] overflow-hidden rounded-md">
  <img src={...} className="w-full h-full object-contain" />
</div>
```

As mudanças incluem:
- Remoção do `padding-bottom: 150%` que causava espaço vazio
- Altura fixa de 140px para consistência
- `object-contain` para manter proporção das imagens
- `overflow-hidden` para evitar transbordamento

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila para produção
- `npm start` - Inicia o servidor de produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run check` - Verifica tipos TypeScript
- `npm run format` - Formata o código com Prettier

## Navegadores Suportados

- Chrome/Chromium (últimas versões)
- Firefox (últimas versões)
- Safari (últimas versões)
- Edge (últimas versões)

## Licença

MIT

## Suporte

Para reportar bugs ou sugerir melhorias, abra uma issue no repositório.
