# 🎮 COMPT — Plataforma de Cursos de Jogos Competitivos

<div align="center">

**Aprimore suas habilidades nos games competitivos mais populares do mundo.**

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.11-764ABC?logo=redux&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white&style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white&style=for-the-badge)

</div>

---

## 📋 Sobre o Projeto

O **COMPT** é um projeto acadêmico que simula uma plataforma de cursos voltada para **jogos competitivos** como Fortnite, League of Legends, Rainbow Six Siege e Clash Royale. A aplicação permite que os usuários acessem módulos de aprendizagem, acompanhem seu progresso, visualizem estatísticas de desempenho e interajam em uma comunidade de jogadores.

O projeto possui um front-end moderno desenvolvido com React e Redux, e um back-end construído em Node.js com Express e MongoDB.

---

## 👥 Autores

| Nome |
|---------------|
| **Pedro Henrique Maia** |
| **Fernando Maio** |
| **Henrique Guimarães Silva** |

---

## 🚀 Tecnologias Utilizadas

| Tecnologia | Função |
|---|---|
| **React 19** | Biblioteca principal para construção da interface (SPA) |
| **Redux Toolkit** | Gerenciamento de estado global da aplicação |
| **Vite** | Bundler e servidor de desenvolvimento front-end |
| **Node.js + Express** | API REST (back-end) responsável por autenticação, cursos, módulos, etc. |
| **MongoDB + Mongoose** | Banco de dados NoSQL e ODM para modelagem de dados |
| **Concurrently** | Execução simultânea do front-end e do back-end em um só comando |
| **Passport & JWT** | Autenticação segura com JSON Web Tokens |

---

## ⚙️ Como Rodar o Projeto na Sua Máquina

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- npm (incluído com o Node.js)
- Uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (ou MongoDB rodando localmente)

### 1. Clonar o Repositório

```bash
git clone https://github.com/henriqueswid/compt-html.git
cd compt-html/compt-react
```

### 2. Instalar as Dependências

Na pasta principal do projeto (`compt-react`), rode o comando abaixo. Ele instalará automaticamente as dependências do front-end e também as do back-end (via script `postinstall`).

```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente (.env)

O back-end precisa de um arquivo `.env` para se conectar ao banco de dados e gerar os tokens de autenticação.

1. Entre na pasta `backend`:
   ```bash
   cd backend
   ```
2. Crie uma cópia do arquivo de exemplo `.env.example` e renomeie para `.env` (ou crie um arquivo chamado `.env`).
3. Preencha as informações dentro do `.env` criado. Exemplo:

   ```env
   # String de conexão com o MongoDB (Atlas ou Local)
   MONGO_URI=mongodb+srv://<seu_usuario>:<sua_senha>@cluster0.../compt?retryWrites=true&w=majority

   # Porta em que a API vai rodar
   PORT=3001

   # Chave secreta para gerar os tokens JWT (invente uma string longa e segura)
   JWT_SECRET=uma_chave_secreta_super_segura_aqui_12345
   ```
4. Volte para a pasta principal (`compt-react`):
   ```bash
   cd ..
   ```

### 4. Executar o Projeto

Com tudo instalado e o `.env` configurado, inicie a aplicação completa (front-end e back-end juntos):

```bash
npm run start
```

A aplicação ficará disponível em:
- **Front-end:** [http://localhost:5173](http://localhost:5173)
- **API (Back-end):** [http://localhost:3001](http://localhost:3001)

### Outros Comandos Úteis

No diretório raiz (`compt-react`), você pode usar os seguintes scripts:

```bash
npm run dev      # Inicia apenas o front-end
npm run api      # Inicia apenas a API (Node.js)
npm run build    # Gera o build de produção do front-end
npm run lint     # Executa o linter (ESLint)
```

---
