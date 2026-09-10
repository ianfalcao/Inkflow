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

* MySQL (planejado; integração ainda não implementada)

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
│   ├── tests/              # Testes do backend
│   └── requirements.txt    # Dependências Python
├── frontend/
│   ├── assets/
│   │   ├── css/            # Estilos
│   │   └── js/             # Scripts das páginas, dados simulados e utilitários
│   ├── auth/               # Login e cadastro
│   ├── dashboard/          # Painéis de administrador, artista e cliente
│   └── pages/              # Páginas públicas; entrada em pages/home/index.html
└── README.md
```

As pastas `models/`, `schemas/`, `routers/`, `services/` e `tests/` ainda estão vazias e não são preservadas pelo Git enquanto não contiverem arquivos. Os arquivos de configuração, segurança e conexão com o banco também aguardam implementação.

## Status

Em desenvolvimento, com frontend em estágio de protótipo e backend em estrutura inicial.

* O frontend utiliza dados simulados e `localStorage` para persistência local, incluindo a simulação de autenticação.
* A camada `frontend/assets/js/utils/api.js` ainda não faz requisições HTTP ao backend.
* O backend FastAPI possui uma rota inicial `GET /`, que retorna uma mensagem de funcionamento.
* A integração entre frontend, API e MySQL, assim como a autenticação no backend, ainda será implementada.

O projeto também está sendo utilizado como forma de estudo e prática em **Python, FastAPI, HTML, CSS, JavaScript e banco de dados**.

## Licença

Projeto desenvolvido para fins de estudo e portfólio.
