# 🎮 COMPT — Plataforma de Cursos de Jogos Competitivos

<div align="center">

**Aprimore suas habilidades nos games competitivos mais populares do mundo.**

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.11-764ABC?logo=redux&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![JSON Server](https://img.shields.io/badge/JSON_Server-1.0-000?logo=json&logoColor=white&style=for-the-badge)

</div>

---

## 📋 Sobre o Projeto

O **COMPT** é um projeto acadêmico que simula uma plataforma de cursos voltada para **jogos competitivos** como Fortnite, League of Legends, Rainbow Six Siege e Clash Royale. A aplicação permite que os usuários acessem módulos de aprendizagem, acompanhem seu progresso, visualizem estatísticas de desempenho e interajam em uma comunidade de jogadores.

O projeto foi desenvolvido como parte de uma disciplina acadêmica com o objetivo de aplicar conceitos de **desenvolvimento web front-end moderno** utilizando React, Redux e arquitetura SPA (Single Page Application).

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
| **React Router DOM** | Navegação entre páginas sem recarregamento |
| **React Redux** | Integração do Redux com os componentes React |
| **Vite** | Bundler e servidor de desenvolvimento |
| **JSON Server** | API REST mock para servir dados de cursos, módulos e estatísticas |
| **Concurrently** | Execução simultânea do front-end e da API |
| **CSS Modular** | Estilização por página/componente com arquivos `.css` separados |
| **LocalStorage** | Persistência local de autenticação e cadastro de usuários |

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- npm (incluído com o Node.js)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/henriqueswid/compt-html.git

# Entre na pasta do projeto
cd compt-react

# Instale as dependências
npm install
```

### Executar

```bash
# Inicia o front-end (Vite) e a API (JSON Server) simultaneamente
npm run start
```

O projeto ficará disponível em:
- **Front-end:** http://localhost:5173
- **API (JSON Server):** http://localhost:3001

### Outros comandos

```bash
npm run dev      # Inicia apenas o front-end
npm run api      # Inicia apenas a API
npm run build    # Gera o build de produção
npm run lint     # Executa o ESLint
```

---
