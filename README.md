# One Piece Leader Tier List

Uma aplicação interativa para criar e compartilhar tier lists de líderes de One Piece com drag-and-drop.

## 🎯 Funcionalidades

- **Tier List Interativa**: Arraste e solte personagens para classificá-los
- **84 Personagens**: Imagens de cartas TCG de One Piece
- **5 Tiers**: S, A, B, C, F com cores vibrantes
- **Busca**: Filtro por nome ou código do personagem
- **Modal**: Visualização em tela cheia dos personagens
- **Responsivo**: Funciona perfeitamente em desktop e mobile
- **Dark Mode**: Tema minimalista moderno

## 🚀 Deploy no Vercel

### Opção 1: Conectar GitHub (Recomendado)

1. Faça push do código para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "New Project"
4. Selecione seu repositório
5. Clique em "Deploy"

### Opção 2: Deploy via CLI

```bash
npm i -g vercel
vercel
```

### Opção 3: Deploy Manual

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione "Other"
3. Faça upload desta pasta
4. Clique em "Deploy"

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Preview do build
pnpm preview
```

## 📁 Estrutura do Projeto

```
├── src/
│   ├── pages/          # Páginas da aplicação
│   ├── components/     # Componentes reutilizáveis
│   ├── lib/            # Dados e utilitários
│   ├── App.tsx         # Componente raiz
│   └── index.css       # Estilos globais
├── public/             # Arquivos estáticos
├── index.html          # HTML principal
├── vite.config.ts      # Configuração Vite
├── package.json        # Dependências
└── vercel.json         # Configuração Vercel
```

## 🛠️ Stack Tecnológico

- **React 19** - UI Framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Wouter** - Client-side routing
- **Shadcn/ui** - UI Components

## 📝 Variáveis de Ambiente

Nenhuma variável obrigatória. Opcionais:

```env
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

## 🎨 Personalizações

### Adicionar Mais Personagens

Edite `src/lib/characters.ts`:

```typescript
export const CHARACTERS: Character[] = [
  { id: "op01-001", code: "OP01-001", name: "Roronoa Zoro", image: "URL", color: "#1A3A52" },
  // Adicione mais aqui
];
```

### Mudar Cores dos Tiers

Edite `src/lib/characters.ts`:

```typescript
export const TIER_COLORS = {
  S: { bg: "#FF6B6B", label: "S", name: "Overpowered" },
  // Customize as cores
};
```

## 📞 Suporte

- [Documentação React](https://react.dev)
- [Documentação Vite](https://vitejs.dev)
- [Documentação Vercel](https://vercel.com/docs)

---

**Criado com ❤️ para fãs de One Piece**
