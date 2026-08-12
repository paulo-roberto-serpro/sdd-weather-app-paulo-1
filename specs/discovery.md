# Discovery — Weather App

## Contexto

A aplicação de Weather App é um projeto de treinamento em **Spec-Driven Development (SDD) com GitHub Copilot**. O objetivo é construir uma aplicação web que forneça previsões meteorológicas em tempo real, seguindo o fluxo completo: Brief → Spec → Plan → Tasks → Code → Test → Review → Ship.

A aplicação será desenvolvida em **React + TypeScript** com estilo **Tailwind CSS** (tema dark glassmorphism) e utilizará a API gratuita **Open-Meteo** para dados meteorológicos e geocodificação.

---

## Escopo do MVP

### Funcionalidades incluídas:
- ✅ Busca de localização por nome de cidade/país com debounce e múltiplos resultados
- ✅ Previsão meteorológica atual (temperatura, condição, umidade, vento, "sensação térmica")
- ✅ Previsão de 7 dias
- ✅ Geolocalização automática na primeira abertura (com fallback para busca manual)
- ✅ Suporte a múltiplas unidades (°C/°F para temperatura; km/h/mph para vento)
- ✅ Favoritos via `localStorage` (máximo 10 localizações)
- ✅ Interface responsiva (mobile, tablet, desktop)
- ✅ Acessibilidade WCAG 2.1 AA
- ✅ Tratamento completo de estados (loading, erro, vazio)

### Fora do escopo (futuro):
- ❌ Mapas interativos
- ❌ Histórico de clima
- ❌ Alertas meteorológicos
- ❌ Autenticação e sincronização em nuvem
- ❌ PWA / funcionalidade offline
- ❌ Notificações push
- ❌ Previsão histórica

---

## Requisitos Funcionais

### 1. Busca de localização
- Campo de entrada com debounce de 300ms
- Mínimo de 2 caracteres para iniciar busca
- Exibir até 10 resultados com formato: **"Cidade — Estado/Região, País"**
- Diferenciar cidades homônimas (ex.: "São Paulo — São Paulo, Brazil" vs "São Paulo — Paraná, Brazil")
- Comportamento em campo vazio: limpar sugestões
- Sem resultados: exibir mensagem clara
- Busca ocorre ao digitar (não requer submissão)
- Teclado: setas para navegar, Enter para selecionar, Esc para fechar

### 2. Geolocalização
- Solicitar permissão **automaticamente** ao carregar a aplicação (decisão explícita: usuário vê intenção clara)
- Se permitido: carregar previsão automaticamente
- Se recusado: apresentar busca manual como alternativa
- Se navegador não suporta: informar e ofertar busca manual
- Se timeout (> 10s): cancelar e oferecer busca manual
- Se API meteorológica falha após localização: exibir erro sem bloquear a aplicação

### 3. Visualização de previsão atual
- Temperatura em unidade selecionada (padrão: °C)
- Descrição da condição (Ex.: "Céu limpo", "Chuva leve", "Tempestade")
- Umidade relativa (%)
- Velocidade do vento em unidade selecionada (padrão: km/h)
- Sensação térmica
- Hora/data respeitando timezone da localização
- Ícone ilustrativo da condição

### 4. Visualização de previsão de 7 dias
- Exibir próximos 7 dias
- Para cada dia: temperatura máx/mín, condição, precipitação (se houver)
- Navegação via teclado e mouse
- Layout responsivo (grid em desktop, carrossel em mobile)

### 5. Unidades e preferências
- Alternador de temperatura: °C ↔ °F
- Alternador de vento: km/h ↔ mph
- Unidade padrão: **Celsius + km/h**
- Preferências persistem em `localStorage`
- Não detectar automaticamente pela localização (decisão explícita do usuário)

### 6. Favoritos
- Botão para adicionar/remover localização atual dos favoritos
- Exibir lista de favoritos (máximo 10)
- Clicar em favorito carrega previsão imediatamente
- Armazenar: nome da cidade, país/região, latitude, longitude, timezone
- Remover favorito sem confirmação (desfaz: Ctrl+Z futuramente, se escopo permitir)

---

## Requisitos Não-Funcionais

### Performance
- **Lighthouse Performance score ≥ 90** em produção (condições de teste padronizadas)
- Carregamento inicial da UI < 2s (com skeleton loading)
- Bundle inicial < 150KB (gzipped)
- Chamadas à API devem utilizar timeout configurado (10s para geolocation, 5s para previsão)

### Acessibilidade
- ✅ WCAG 2.1 AA
- ✅ Navegação completa por teclado (Tab, Shift+Tab, Enter, Esc, setas)
- ✅ Foco visível e lógico
- ✅ Labels semânticos associados a campos
- ✅ Mensagens de erro anunciadas para screen readers (ARIA live regions)
- ✅ Contraste de cores ≥ 4.5:1 para texto
- ✅ Sem dependência apenas de cor para comunicar estado
- ✅ Suporte a `prefers-reduced-motion` (desabilitar animações)
- ✅ Roles ARIA apropriadas

### Qualidade
- **Cobertura de testes: 80–90%** para código de negócio
- **100% dos fluxos críticos** cobertos por E2E
- Testes unitários: lógica de geocoding, cálculo de unidades, favoritos, tratamento de erros
- Linting com Biome (zero warnings)
- Type safety estrita com TypeScript

### Confiabilidade
- ✅ Tratamento de todos os estados: loading, sucesso, erro, vazio
- ✅ Mensagens de erro legíveis para o usuário (não expor stack traces)
- ✅ Retry automático para falhas de rede (máximo 3 tentativas com backoff exponencial)
- ✅ Cache local de previsões (chave: `{latitude}:{longitude}:{temperatureUnit}:{windSpeedUnit}`, válido por 30 minutos)
- ✅ Debounce em buscas (300ms)
- ✅ Cancelamento de requests de geocoding anteriores para evitar race conditions (AbortController)

### Segurança
- ✅ Validação de entrada em campos de busca
- ✅ Sanitização de dados exibidos (sem XSS)
- ✅ Produção deve utilizar HTTPS para permitir geolocalização
- ✅ Sem armazenamento de dados sensíveis (favoritos apenas contêm coordenadas públicas)
- ✅ Política de CORS respeitada
- ✅ Cancelamento de requests anteriores para evitar race conditions no geocoding (AbortController)

### Compatibilidade
- ✅ Browsers modernos: Chrome ≥ 90, Firefox ≥ 88, Safari ≥ 14, Edge ≥ 90
- ✅ Responsivo: 320px width (mobile) até 1920px (desktop)
- ✅ Touch e mouse
- ✅ Sem dependências de plugins (Flash, Java, etc)

---

## Riscos e Mitigações

### 1. Indisponibilidade e throttling da API Open-Meteo
**Risco:** Serviços externos podem sofrer indisponibilidade, throttling, timeout ou alterações de política de uso.

**Mitigação:**
- Implementar cache local de previsões (válido por 30 minutos)
- Debounce em buscas (300ms) para evitar requisições redundantes
- Retry automático com backoff exponencial (máximo 3 tentativas)
- Tratamento explícito de HTTP errors (4xx, 5xx, timeout)
- Mensagem de erro legível ao usuário se API falhar
- Documentar comportamento esperado quando API está indisponível

### 2. Geolocalização recusada ou indisponível
**Risco:** Nem todos os navegadores suportam Geolocation API; usuário pode recusar; pode haver timeout.

**Mitigação:**
- Geolocation é **opcional**, nunca bloqueia a aplicação
- Fallback imediato para busca manual de localização
- Testar em navegadores sem suporte (fallback gracioso)
- Definir timeout de 10 segundos
- Mensagem clara se geolocation falhar

### 3. Qualidade dos dados de geocoding
**Risco:** Open-Meteo pode retornar múltiplas cidades com mesmo nome (ex.: vários "São Paulo").

**Mitigação:**
- Exibir país e estado/região junto com o nome da cidade
- Permitir usuário selecionar entre opções
- Armazenar coordenadas (lat/lon) junto com nome para evitar re-geocodificação

### 4. Timezone e horários
**Risco:** Exibir horários incorretos pode confundir o usuário.

**Mitigação:**
- Open-Meteo fornece timezone nas respostas
- Exibir data/hora sempre no timezone da localização consultada
- Testes específicos para localidades com timezones diferentes
- Não prescrever biblioteca neste estágio (decidir no Plan)

### 5. Scope creep
**Risco:** Tendência a adicionar features (mapas, alertas, histórico, PWA) além do MVP.

**Mitigação:**
- Seção **Out of Scope** clara (vide abaixo)
- Tarefas devem referenciar requisitos explícitos
- Pull requests verificam conformidade com MVP

---

## Decisões de MVP

As seguintes questões foram **resolvidas** como parte do Discovery:

| Decisão | Valor | Justificativa |
|---------|-------|---|
| **Escopo inicial** | Incluir previsão estendida (7 dias) | MVP completo sem complexidade desnecessária |
| **Unidade de temperatura** | Celsius como padrão | Padrão internacional; usuário pode alternar para °F |
| **Unidade de vento** | km/h como padrão | Padrão internacional; usuário pode alternar para mph |
| **Favoritos** | Local storage, máximo 10 | Suficiente para MVP; sem backend necessário |
| **Idioma** | Português (pt-BR) | Aplicação em português; sem i18n neste estágio |
| **Atualização automática** | Sem atualização automática no MVP | Usuário força atualização manualmente (botão refresh) |
| **Modo offline** | Não incluir PWA | Fora do escopo do MVP |
| **Histórico** | Não incluir | Apenas favoritos são persistidos |

---

## Notas de Implementação para Spec/Plan

### Estratégia de Unidades
A Open-Meteo suporta parâmetros de unidades na API. **Duas abordagens possíveis** (decidir no Plan):

**Opção A: Refetch ao trocar unidade**
- Chamar API novamente quando usuário muda °C → °F
- Vantagem: sempre dados canônicos da API
- Desvantagem: requisição de rede adicional

**Opção B: Conversão no frontend** (recomendado para MVP)
- Buscar dados uma vez (sempre na unidade canônica: °C, km/h)
- Armazenar modelo de domínio Weather com valores canônicos
- Converter para unidade selecionada na UI
- Vantagem: sem requisição adicional, rápido, cache simplificado
- Desvantagem: precisa de funções de conversão testadas

### Cache Strategy
Cache de previsões armazenado com chave composta:
```
forecast:{latitude}:{longitude}:{temperatureUnit}:{windSpeedUnit}
```

Ou, se usar **Opção B**, armazenar dados canônicos uma única vez:
```
forecast:{latitude}:{longitude}
```

### AbortController para Race Conditions
Implementar cancelamento de requests anteriores no geocoding:
```
usuário digita "Bras" → request A
usuário digita "Brasil" → request B (cancela A)
```
Evita exibir resultados obsoletos.

---

Questões que devem ser respondidas **durante a Spec/Plan**:

1. **Bibliotecas de data/timezone:** Qual solução usar? (date-fns, Temporal, APIs nativas, outra?)
2. **Estilo de ícones:** Qual conjunto de ícones para condições meteorológicas? (SVG inline, biblioteca externa?)
3. **Animações:** Qual ferramenta para animations? (Framer Motion, React Spring, Tailwind, CSS puro?)
4. **State management:** Context API é suficiente ou usar Zustand/Redux?
5. **Hospedagem:** Vercel, Netlify, outro? (Afeta decisões de build e CI/CD)
6. **Estratégia de unidades na API:** Refetch com parâmetros de unidade vs. conversão frontend dos dados canônicos?
7. **Mocking de APIs nos testes:** Como simular Open-Meteo e Geolocation em testes E2E?

---

## Suposições (Assumptions)

- A API Open-Meteo permanecerá acessível com as políticas atuais.
- O projeto é uma **aplicação web**, não mobile nativo (iOS/Android).
- Autenticação de usuários **não é necessária** para o MVP.
- `localStorage` é adequado para persistir favoritos e preferências.
- Os dados da Open-Meteo têm precisão suficiente para uso geral.
- A aplicação será hospedada em um **servidor estático ou serverless** (Vercel, Netlify, etc).
- CI/CD com GitHub Actions é disponível.
- A audiência é **usuários técnicos** que conseguem usar a aplicação sem onboarding extenso.
- Navegadores suportam `localStorage`, `fetch`, `geolocation API` (com fallback para os que não suportam).
- HTTPS é disponível no domínio final (requisito para Geolocation API).

---

## Critérios de Sucesso

Uma implementação bem-sucedida do MVP deve atender a:

### Funcional
- ✅ Usuário consegue buscar uma cidade e ver resultados (máximo 10)
- ✅ Ao selecionar cidade, previsão atual é exibida corretamente
- ✅ Previsão estendida (7 dias) é exibida sem erros
- ✅ Geolocalização funciona se permitida; fallback para busca manual se recusada
- ✅ Favoritos são adicionados/removidos sem erros
- ✅ Ao alternar favorito, previsão é recarregada
- ✅ Unidades (°C ↔ °F, km/h ↔ mph) mudam corretamente
- ✅ Preferências de unidades persistem após reload

### Técnico
- ✅ Cobertura de testes: 80–90% para código de negócio
- ✅ 100% dos fluxos críticos cobertos por E2E (6 cenários mínimos)
- ✅ Lighthouse Performance score ≥ 90 em produção
- ✅ Zero erros de linting (Biome)
- ✅ TypeScript sem `any` não justificado
- ✅ Sem warnings no console (produção)

### UX/Acessibilidade
- ✅ Interface funciona com teclado (navegação completa)
- ✅ Screen reader consegue ler todos os elementos críticos
- ✅ Foco é visível em todos os campos interativos
- ✅ Contraste de cores ≥ 4.5:1
- ✅ Sem dependência apenas de cor para comunicar estado
- ✅ Animações respeitem `prefers-reduced-motion`

### Confiabilidade
- ✅ Tratamento de erro quando API falha
- ✅ Tratamento de erro quando geolocation falha
- ✅ Tratamento de erro quando usuário digita caracteres inválidos
- ✅ Mensagens de erro legíveis (não expor stack traces)
- ✅ Aplicação nunca fica travada (sempre responsiva)

---

## Out of Scope (Futuro)

Explicitamente **não incluído** neste MVP:

| Feature | Motivo |
|---------|--------|
| Mapas interativos | Complexidade visual; sem benefício claro no MVP |
| Alertas meteorológicos | Requer backend e persistência de preferências |
| Histórico de clima | Sem valor agregado no MVP |
| PWA / Offline | Requer service worker e estratégia de cache complexa |
| Sincronização em nuvem | Requer autenticação e backend |
| Autenticação de usuários | Sem necessidade no MVP |
| Backend próprio | Usar Open-Meteo como único serviço |
| Notificações push | Requer backend e consentimento do navegador |
| Previsão histórica | Fora do escopo do MVP |
| Customização de temas | MVP com dark glassmorphism apenas |
| Modo light / tema dinâmico | Fora do escopo |

---

## Fluxos Críticos para Cobertura E2E

Mínimo de 6 cenários E2E que garantem qualidade:

1. **Fluxo de busca:** digitar cidade → selecionar resultado → exibir previsão atual e estendida
2. **Fluxo de geolocalização:** carregar página → permitir geolocation → previsão carrega automaticamente
3. **Fluxo de recusa de geolocation:** carregar página → recusar geolocation → busca manual como alternativa
4. **Fluxo de favoritos:** buscar cidade → adicionar aos favoritos → recarregar página → favorito persiste → clicar favorito carrega previsão
5. **Fluxo de unidades:** exibir previsão em °C → alternar para °F → valores mudam corretamente → recarregar → °F persiste
6. **Fluxo de erro:** simular API indisponível → exibir mensagem de erro → retry automático funciona
