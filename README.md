# InkFlow

Plataforma web para descoberta e divulgação de tatuadores, permitindo que artistas apresentem seus trabalhos e que clientes encontrem profissionais de acordo com seus estilos e preferências.

## Sobre o projeto

O InkFlow busca funcionar como uma rede de portfólios para tatuadores, reunindo artistas, trabalhos e agendamentos em um único lugar.

### Funcionalidades previstas

* Cadastro e login de usuários
* Perfis de clientes e tatuadores
* Portfólio de trabalhos
* Busca e filtros de tatuadores
* Tags e estilos de tatuagem
* Sistema de agendamentos
* Painel administrativo
* Aprovação de novos tatuadores

## Tecnologias

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Python
* FastAPI
* Uvicorn

### Banco de dados

* MySQL 

### Outros

* Git
* GitHub
* Docker (futuramente)

## Estrutura

```text
InkFlow/
├── backend/
│   ├── app/
│   │   ├── main.py          # Entrada da API FastAPI
│   │   ├── core/            # Configuração e segurança
│   │   ├── database/        # Conexão com o banco de dados
│   │   ├── models/          # Modelos de persistência
│   │   ├── schemas/         # Validação de entrada e saída de dados
│   │   ├── routers/         # Rotas da API
│   │   └── services/        # Regras de negócio
│   ├── tests/              # Testes da API, segurança e configuração
│   ├── .env.example        # Exemplo de configuração local
│   ├── pytest.ini          # Configuração dos testes
│   ├── requirements.txt    # Dependências da aplicação
│   └── requirements-dev.txt # Dependências de desenvolvimento e testes
├── frontend/
│   ├── index.html          # Entrada; redireciona para pages/home/
│   ├── assets/
│   │   ├── css/            # Estilos
│   │   └── js/             # Scripts das páginas: home.js, login.js, etc.
│   │       ├── services/   # API e autenticação
│   │       ├── mocks/      # Dados simulados do protótipo
│   │       └── utils/      # Auxiliares genéricos de DOM e armazenamento
│   ├── auth/               # Login e cadastro
│   ├── dashboard/          # Painéis de administrador, artista e cliente
│   └── pages/              # Páginas públicas; entrada em pages/home/index.html
└── README.md
```

Arquivos e pastas usam nomes em inglês. No frontend, palavras são separadas por hífens (`kebab-case`, como `dashboard-client.js`); nos módulos Python, por sublinhados (`snake_case`, como `init_db.py`). Os textos da interface permanecem em português. As páginas públicas ficam em `pages/home/`, `pages/artists/`, `pages/community/` e `pages/styles/`.

O módulo inicial de usuários exemplifica o fluxo entre as camadas:

```text
routers/users.py → schemas/user.py → services/user.py → models/user.py
                                          ↓
                                 database/connection.py
```

As rotas traduzem requisições e erros HTTP; os schemas validam os dados; os serviços executam as regras de negócio; os modelos descrevem as tabelas. `core/config.py` lê as configurações e `core/security.py` concentra o hash e a verificação de senhas.

## Executar o backend localmente

O backend foi validado com Python 3.14.7. Com essa versão instalada, execute a partir da raiz do projeto em Linux/macOS:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload
```

Se `backend/.venv/` já existir, pule a criação. Na IDE, selecione `backend/.venv/bin/python`. Para instalar apenas as dependências da aplicação, use `requirements.txt`.

A API fica em `http://127.0.0.1:8000`, com documentação interativa em `http://127.0.0.1:8000/docs`. A rota inicial e a documentação funcionam sem banco configurado.

## Executar o frontend localmente

Em outro terminal, a partir da raiz do projeto:

```bash
python3 -m http.server 5500 --bind 127.0.0.1 --directory frontend
```

Abra `http://127.0.0.1:5500/`. A entrada redireciona para a página inicial. Sirva os arquivos por HTTP, pois os scripts usam módulos JavaScript; abrir os HTML diretamente por `file://` não é o fluxo suportado.

A origem `http://127.0.0.1:5500` já está listada em `backend/.env.example`. Se usar outra porta ou origem, ajuste `CORS_ORIGINS` ao integrar o frontend à API. Use a mesma origem durante a navegação, pois o armazenamento local é separado por origem.

O protótipo funciona sem iniciar o backend. Todas as páginas inicializam os dados por `assets/js/mocks/init.js`, incluindo estilos e posts. Coleções existentes, mesmo vazias após exclusões, são preservadas; para reiniciar a demonstração, limpe o armazenamento local dessa origem nas ferramentas do navegador e recarregue a página.

## Banco de dados e testes

### Configurar o MySQL

Com um servidor MySQL disponível, crie o banco `inkflow` com charset `utf8mb4` e um usuário com permissões nesse banco. Dentro de `backend/`, copie o exemplo:

```bash
cp .env.example .env
```

Edite `DATABASE_URL` com as credenciais locais. Caracteres especiais no usuário e na senha devem ser codificados para URL. `CORS_ORIGINS` recebe uma lista JSON das origens permitidas para o frontend. Variáveis do ambiente têm prioridade sobre o arquivo `.env`; reinicie a API após alterar a configuração.

Com o ambiente virtual ativado, crie as tabelas iniciais:

```bash
python -m app.database.init_db
```

Esse comando cria tabelas ausentes, sem alterar tabelas existentes. Migrações de esquema ainda não foram configuradas. A aplicação não cria tabelas automaticamente ao iniciar.

### Cadastro inicial de clientes

`POST /api/v1/users` recebe:

```json
{
  "name": "Ana Silva",
  "email": "ana@example.com",
  "password": "senha-de-exemplo-123"
}
```

O cadastro retorna `201` com `id`, `name`, `email`, `role` e `created_at` em UTC. O e-mail é normalizado para minúsculas; duplicidades retornam `409` e dados inválidos retornam `422`. Sem `DATABASE_URL`, a rota retorna `503`.

O cadastro público inicial cria somente clientes e rejeita campos extras, como `role`. A senha deve ter entre 8 e 128 caracteres e é persistida apenas como hash Argon2. Cadastro de artistas, aprovação, login, tokens e autorização ainda serão implementados.

### Testes

Dentro de `backend/`, com as dependências de desenvolvimento instaladas:

```bash
python -m pytest -q
```

Os testes usam SQLite em memória com uma base nova por teste, sem acessar o MySQL local. Cobrem cadastro, duplicidade de e-mail, validação, proteção dos campos de senha, hash, configuração e funcionamento sem banco. A conexão com uma instância real de MySQL precisa ser validada no ambiente configurado.

## Status

Em desenvolvimento, com frontend em estágio de protótipo e backend em estrutura inicial.

* O frontend utiliza dados simulados e `localStorage` para persistência local, incluindo a simulação de autenticação.
* A camada `frontend/assets/js/services/api.js` ainda não faz requisições HTTP ao backend; os dados simulados ficam em `frontend/assets/js/mocks/`.
* O backend FastAPI possui `GET /` e cadastro de clientes em `POST /api/v1/users`, com separação entre rotas, schemas, serviços e modelos.
* A persistência usa SQLAlchemy, com conexão MySQL configurável e criação explícita das tabelas iniciais.
* A integração do frontend com a API e a autenticação no backend ainda serão implementadas.

O projeto também está sendo utilizado como forma de estudo e prática em **Python, FastAPI, HTML, CSS, JavaScript e banco de dados**.

## Referências técnicas

* [Configuração com Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
* [Sessões do SQLAlchemy](https://docs.sqlalchemy.org/en/20/orm/session_basics.html)
* [Hash de senhas com pwdlib no FastAPI](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)

## Licença

Projeto desenvolvido para fins de estudo e portfólio.
