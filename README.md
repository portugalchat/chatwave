# ChatLive - Plataforma de Chat Aleatório

Uma plataforma moderna de chat aleatório com design futurista, construída com React, Node.js, PostgreSQL e WebSockets em tempo real.

## Funcionalidades

- **Chat Aleatório**: Conecte-se instantaneamente com utilizadores de todo o mundo
- **Sistema de Amigos**: Adicione pessoas como amigos e mantenha conversas privadas
- **Autenticação**: Registe-se com email/password ou converse anonimamente
- **Perfis Personalizáveis**: Altere username e foto de perfil
- **Histórico de Conversas**: Veja as suas últimas conversas e envie pedidos de amizade
- **Interface Futurista**: Design dark moderno com animações suaves
- **Totalmente Responsivo**: Funciona perfeitamente em desktop e mobile

## Tecnologias

### Frontend
- React 18 com TypeScript
- Vite para build e desenvolvimento
- TailwindCSS para styling
- Framer Motion para animações
- React Query para gestão de estado
- Wouter para routing
- Radix UI para componentes acessíveis

### Backend
- Node.js com Express
- TypeScript
- WebSockets (ws) para comunicação em tempo real
- Drizzle ORM para base de dados
- PostgreSQL/Supabase para armazenamento
- bcrypt para hash de passwords

## Configuração Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL ou conta Supabase

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd chatlive
```

2. Instale dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o ficheiro `.env` com as suas credenciais:
```env
DATABASE_URL=postgresql://username:password@hostname:port/database
NODE_ENV=development
```

4. Configure a base de dados:
```bash
npm run db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## Deployment para Produção

### Railway

1. **Crie uma conta no Railway**: [railway.app](https://railway.app)

2. **Conecte o seu repositório GitHub**:
   - Faça push do código para o GitHub
   - No Railway, selecione "Deploy from GitHub repo"
   - Escolha o repositório

3. **Configure as variáveis de ambiente**:
   - Vá para Variables no dashboard do Railway
   - Adicione `DATABASE_URL` com a string de conexão da Supabase
   - Adicione `NODE_ENV=production`

4. **Deploy automático**:
   - O Railway detectará automaticamente que é uma aplicação Node.js
   - O deploy será feito automaticamente usando `npm run build` e `npm start`

### Outras Plataformas

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Heroku
```bash
git push heroku main
heroku config:set DATABASE_URL=your_supabase_url
```

#### DigitalOcean App Platform
1. Conecte o repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automaticamente

### Configuração Supabase

1. **Crie um projeto Supabase**: [supabase.com](https://supabase.com)

2. **Obtenha a DATABASE_URL**:
   - Vá para Settings > Database
   - Copie a "Connection string" 
   - Substitua `[YOUR-PASSWORD]` pela password da base de dados

3. **Execute as migrações**:
```bash
npm run db:push
```

### Configuração Upstash Redis (Opcional)

Para escalabilidade adicional dos WebSockets:

1. Crie uma conta no [Upstash](https://upstash.com)
2. Crie uma base de dados Redis
3. Adicione `REDIS_URL` às variáveis de ambiente
4. Modifique o código para usar Redis para gestão de sessões

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm start           # Inicia servidor de produção

# Base de dados
npm run db:push     # Aplica schema à base de dados
npm run db:studio   # Abre Drizzle Studio

# Linting e formatação
npm run lint        # Executa ESLint
npm run type-check  # Verifica tipos TypeScript
```

## Estrutura do Projeto

```
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilitários
│   │   └── pages/       # Páginas da aplicação
├── server/          # Backend Node.js
│   ├── index.ts     # Ponto de entrada
│   ├── routes.ts    # Rotas da API
│   ├── storage.ts   # Camada de dados
│   └── vite.ts      # Configuração Vite
├── shared/          # Código partilhado
│   └── schema.ts    # Schema da base de dados
└── package.json
```

## Funcionalidades de Produção

- **Autenticação segura** com hash de passwords
- **Validação de dados** com Zod
- **WebSockets otimizados** para milhões de utilizadores
- **Base de dados PostgreSQL** escalável
- **Gestão de estado** robusta com React Query
- **Interface acessível** seguindo padrões WCAG
- **Logs estruturados** para monitorização
- **Proteção contra XSS/CSRF**
- **Rate limiting** implementado

## Monitorização e Logs

A aplicação gera logs estruturados que podem ser integrados com:
- **Railway Logs** para monitorização básica
- **Sentry** para tracking de erros
- **LogRocket** para sessões de utilizador
- **Datadog** para métricas avançadas

## Escalabilidade

Para escalar para milhões de utilizadores:

1. **Load Balancer**: Use Nginx ou Railway's load balancing
2. **Database**: Configure read replicas no Supabase
3. **Redis**: Implemente Upstash para cache e sessões
4. **CDN**: Use Cloudflare para assets estáticos
5. **Monitoring**: Configure Prometheus + Grafana

## Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit as mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a MIT License.

## Suporte

Para suporte técnico ou questões sobre deployment:
- Abra uma issue no GitHub
- Consulte a documentação das plataformas de deploy
- Verifique os logs de aplicação para debugging