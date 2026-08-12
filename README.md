<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## External APIs

O app usa duas APIs da Open-Meteo, sem chave de autenticação.

### Geocoding

- URL: `https://geocoding-api.open-meteo.com/v1/search`
- Método: `GET`
- Objetivo: transformar o nome de uma cidade em coordenadas geográficas.

Parâmetros principais:

- `name`: nome da cidade ou localidade, por exemplo `São Paulo`
- `count`: quantidade máxima de resultados, por exemplo `5`
- `language`: idioma das respostas, por exemplo `pt`
- `format`: formato da resposta, normalmente `json`
- `countryCode`: filtro opcional por país, por exemplo `BR`

Exemplo:

```text
https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo&count=5&language=pt&format=json
```

Exemplo de resposta:

```json
{
  "results": [
    {
      "id": 3448439,
      "name": "São Paulo",
      "latitude": -23.5489,
      "longitude": -46.6388,
      "country": "Brazil",
      "country_code": "BR",
      "admin1": "São Paulo",
      "timezone": "America/Sao_Paulo"
    }
  ],
  "generationtime_ms": 11.54
}
```

### Forecast

- URL: `https://api.open-meteo.com/v1/forecast`
- Método: `GET`
- Objetivo: buscar o clima atual e a previsão diária para uma latitude e longitude.

Parâmetros principais:

- `latitude`: latitude da localidade, por exemplo `-23.5489`
- `longitude`: longitude da localidade, por exemplo `-46.6388`
- `current`: campos do clima atual que devem ser retornados
- `daily`: campos da previsão diária que devem ser retornados
- `timezone`: normalmente `auto`, para respeitar o fuso local
- `forecast_days`: quantidade de dias da previsão, por exemplo `7`
- `temperature_unit`: unidade da temperatura, opcional (`celsius` ou `fahrenheit`)
- `wind_speed_unit`: unidade da velocidade do vento, opcional (`kmh`, `mph`, etc.)

Exemplo:

```text
https://api.open-meteo.com/v1/forecast?latitude=-23.5489&longitude=-46.6388&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7
```

Exemplo de resposta:

```json
{
  "latitude": -23.55,
  "longitude": -46.64,
  "generationtime_ms": 188.72,
  "timezone": "America/Sao_Paulo",
  "timezone_abbreviation": "-03",
  "current": {
    "time": "2026-08-12T15:00",
    "temperature_2m": 28.1,
    "relative_humidity_2m": 62,
    "apparent_temperature": 30.2,
    "weather_code": 1,
    "wind_speed_10m": 9.4
  },
  "daily": {
    "time": [
      "2026-08-12",
      "2026-08-13",
      "2026-08-14"
    ],
    "weather_code": [1, 2, 3],
    "temperature_2m_max": [29.4, 28.6, 27.9],
    "temperature_2m_min": [20.5, 19.7, 18.9],
    "precipitation_probability_max": [12, 18, 25]
  }
}
```

### Fluxo do app

1. Usuário digita o nome da cidade.
2. A API de geocoding resolve a cidade e retorna latitude/longitude.
3. O app usa essas coordenadas na API de forecast.
4. O frontend exibe o clima atual e a previsão diária conforme o timezone local.

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
