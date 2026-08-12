# Discovery Review — Crítica do PM Cético

**Data:** 2026-08-12  
**Fase:** Discovery → Spec  
**Veredito:** Bem estruturado, MAS com **lacunas críticas** e **ambiguidades perigosas**

---

## 🚨 Seção 1: Perguntas Fundamentais de Negócio (FALTAM RESPOSTAS!)

### 1.1 Por que existir?
**Problema:** O Discovery não responde:
- Qual é o problema real que esse app resolve?
- Quem são **realmente** os usuários?
- Qual é o diferencial vs. Weather.com, AccuWeather, Apps nativas do SO?
- Qual é o modelo de negócio? (Ad-supported? Premium? Educacional?)

**Risco:** Estamos construindo um "clone de clone" sem propósito claro.

**Exemplo do PM cético:**
> "Se é 'projeto de treinamento', ótimo. Mas se é produto real, você me mostra dados de tração, crescimento esperado e ROI?"

---

### 1.2 Qual é o success metric de verdade?
**Problema:** O Discovery tem "critérios de sucesso" técnicos, mas **sem métrica de negócio**:
- Quantos usuários esperamos no ano 1?
- Qual é a taxa de retenção esperada?
- Qual é o custo de infrastructure que podemos arcar?
- Qual é o NPS esperado?

**Risco:** Você pode ter "Lighthouse 90" e "zero warnings" e ainda assim NINGUÉM USAR O APP.

**O que está faltando:**
- Métrica de MAU (Monthly Active Users)
- Session duration esperada
- Bounce rate aceitável
- Taxa de "Adicionar aos favoritos" (engagement real)
- Taxa de re-abertura da app (retention)

---

### 1.3 Audiência: "Usuários técnicos" é vago demais
**Problema:** A assumption diz:
> "A audiência é **usuários técnicos** que conseguem usar a aplicação sem onboarding extenso."

**Pergunta do PM:**
- Técnicos em quê? Devs? Designers? Cidadãos portugueses? Worldwide?
- Isso significa que **você não quer suportar usuários não-técnicos**?
- Se é "weather app", qualquer pessoa deveria conseguir usar. Isso é contraditório.

**Risco:** Seu design pode ficar muito "dev-focused" e alienar usuários comuns.

---

## 🎨 Seção 2: Ambiguidades Funcionais

### 2.1 "Previsão atual" — O que é "atual" exatamente?
**Problema:** Você diz:
> "Temperatura em unidade selecionada (padrão: °C)"

Mas não define:
- A previsão é do **momento agora** ou do **próximo horário** da API?
- Open-Meteo retorna dados horários. Qual horário você vai exibir?
- Precisa de interpolação/rounding?
- Se o usuário abrir às 23:59, mostra dados de hoje ou de amanhã?

**Risco:** A previsão pode estar desatualizada segundos depois de carregar.

**Decisão necessária:** 
- Você precisa de refresh automático silencioso? (Não está especificado)
- Ou o usuário sempre clica num botão "Atualizar"?

---

### 2.2 "Condição meteorológica" — Há quantas categorias?
**Problema:** Você menciona:
> "Descrição da condição (Ex.: 'Céu limpo', 'Chuva leve', 'Tempestade')"

Mas:
- Open-Meteo fornece **WMO Weather Codes** (números como 0, 1, 2... 99)
- Você tem que mapear isso para português
- Quantas categorias você vai mostrar? (10? 50? Todas?)
- Como vai diferenciar "Chuva moderada" de "Chuva forte"?

**Risco:** Open-Meteo pode retornar condições que você não mapeou.

---

### 2.3 Geolocalização automática — Quando exatamente?
**Problema:** Você diz:
> "Solicitar permissão **automaticamente** ao carregar a aplicação"

Mas não define:
- Primeira abertura apenas? Ou sempre?
- Se o usuário já marcou "Não perguntar novamente", a app morre? Ou oferece busca manual?
- Qual é o UX durante o loading? Tela em branco? Skeleton?
- Se geolocation demora (10s timeout), isso bloqueia a UI?

**Risco:** A UX pode ser péssima se não for bem pensada.

---

### 2.4 "Favoritos" — Qual é a experiência esperada?
**Problema:** Você diz:
> "Remover favorito sem confirmação (desfaz: Ctrl+Z futuramente, se escopo permitir)"

Mas:
- **Ctrl+Z não implementado no MVP.** Por que deixar essa expectativa?
- Qual é o UX de remover favorito? Swipe? Botão? Confirmação implícita (e.g., "favorito removido em 3s")?
- O usuário consegue ver quantos favoritos tem? (Há limite de 10)
- Como é feita a listagem? Tabs? Dropdown? Menu lateral?

**Risco:** PM vai revisar e dizer "Isso não está claro".

---

### 2.5 Unidades: E a precipitação?
**Problema:** Você especifica:
> "Alternador de temperatura: °C ↔ °F"  
> "Alternador de vento: km/h ↔ mph"

Mas não diz:
- E a **precipitação**? Mm vs. polegadas?
- E a **pressão**? hPa vs. inHg?
- E a **visibilidade**? km vs. milhas?
- A Open-Meteo fornece esses dados. Você vai exibir?

**Risco:** "Após 3 sprints, cliente quer precipitação em polegadas" = refactor.

---

### 2.6 "Previsão de 7 dias" — Qual é o detalhamento?
**Problema:** Você diz:
> "Para cada dia: temperatura máx/mín, condição, precipitação (se houver)"

Mas:
- A Open-Meteo oferece dados **por hora**. Você vai agregar em 1 ponto por dia?
- Como escolhe a hora do dia para exibir? (Máx à 14h? Mín à 3h?)
- Vai mostrar probabilidade de chuva?
- Vai mostrar umidade do dia?

**Risco:** Se você der dados muito simplificados, o app fica irrelevante.

---

## 🔌 Seção 3: Lacunas Técnicas Graves

### 3.1 Como funciona o comportamento "cache + atualização"?
**Problema:** Você diz:
> "Cache local de previsões (chave: `{latitude}:{longitude}:{temperatureUnit}:{windSpeedUnit}`, válido por 30 minutos)"

Mas:
- Se o cache é válido por 30 min, como o usuário **força atualização**?
  - Há um botão "Atualizar"? Qual o UX?
  - Se tem, fica sempre ativo ou só mostra se dados estão "desatualizados"?
- Qual é a estratégia de **invalidação**? Sempre que muda a unidade?
- Se muda de °C para °F, você rehash o cache ou converte no frontend?

**Risco:** Implementação pode ser bagunçada se não for clara.

---

### 3.2 Qual é o UX de "carregando"?
**Problema:** Você menciona:
> "Carregamento inicial da UI < 2s (com skeleton loading)"

Mas não especifica:
- Como é o skeleton? Shimmer? Blur? Placeholder?
- Qual é o estado durante timeout (5s para API)?
  - Mostra "Carregando..." ou "Demorando..." após X tempo?
- Se a busca de geocoding retorna resultados lentamente, qual é o feedback?

**Risco:** Usuário vê UI travada ou confusa.

---

### 3.3 Quais são **todas** as condições de erro?
**Problema:** Você diz:
> "Tratamento de erro quando API falha"

Mas não enumera. Cenários possíveis:
- Sem internet (fetch falha)
- API retorna 5xx
- API retorna 4xx (localização inválida?)
- API timeout
- CORS error (improvável, mas possível)
- Dados malformados (response parsing falha)
- Geolocation API recusa acesso
- Geolocation API timeout
- Geolocation retorna coordenadas inválidas
- localStorage cheio (improvável, mas possível)
- Entrada do usuário contém SQL/script injection (sanitização)

**Risco:** Cada uma dessas pode ter UX diferente.

---

### 3.4 Qual é o model de dados exato?
**Problema:** Você não fornece um data model. O que o Geocoding retorna? Como é armazenado?

**Exemplo:** Um favorito:
```json
{
  "id": "???",  // UUID? Index?
  "name": "São Paulo",
  "country": "Brazil",
  "admin1": "São Paulo",  // Sempre presente? E se não houver estado?
  "latitude": -23.5505,
  "longitude": -46.6333,
  "timezone": "America/Sao_Paulo",  // De onde vem?
  "createdAt": "???",  // Precisa disso?
  "order": "???"  // Como ordena favoritos?
}
```

**Risco:** Você vai descobrir isso durante o design, não durante a Spec.

---

### 3.5 Como é feito o mocking de geolocation nos testes?
**Problema:** Você especifica:
> "6 cenários E2E que garantem qualidade"

E um deles é:
> "Fluxo de geolocalização: carregar página → permitir geolocation → previsão carrega automaticamente"

Mas:
- Playwright consegue mockar Geolocation API?
  - Sim, mas como? Qual é a estratégia?
- Você testa em device real ou emulador?
- Como você testa "timeout"?

**Risco:** Testes E2E podem virar "flaky" se geolocation for impredizível.

---

## 📊 Seção 4: Inconsistências e Contradições

### 4.1 Open Questions vs. Decisões de MVP
**Problema:**
- Você decidiu: "Português (pt-BR)"
- Mas depois você diz "Qual ferramenta para animations?"

**Isso é inconsistente:**
- Por que não resolveu "Qual biblioteca de data"? (Isso é mais crítico que animações!)
- Por que algumas decisões foram congeladas e outras não?

---

### 4.2 "Audiência técnica" vs. "WCAG 2.1 AA"
**Problema:**
- Você diz audiência é "técnica"
- Mas depois dedica 10 requisitos a acessibilidade

**Questão do PM:**
> "Se é só para técnicos, por que acessibilidade? Técnicos também usam screen readers? Ou você quer que qualquer pessoa use?"

**Inconsistência:** Você está conflitado sobre quem é o usuário.

---

### 4.3 "Sem atualização automática" mas "Cache válido por 30 min"
**Problema:**
- Você diz: "Usuário força atualização manualmente"
- Mas você cachea por 30 min
- Se alguém busca São Paulo e daqui 20 minutos busca de novo, recebe dados antigos
- Isso é silencioso? Usuário recebe warning que dados têm X minutos?

**Risco:** Usuário vê previsão desatualizada e não percebe.

---

### 4.4 "Context API é suficiente?" MAS decisão já foi tomada
**Problema:**
- Você tem na seção "Notas de Implementação": "State management: Context API é suficiente?"
- Mas em "Escopo do MVP" você não menciona state management

**Questão:**
- Vocês já assumem que vão usar Context API?
- Ou realmente está em aberto?

---

## 🤨 Seção 5: Questões Críticas Sem Resposta

### 5.1 Qual é o workflow de onboarding?
**Pergunta:**
- Usuário abre app pela primeira vez
- O que ele vê? (Permissão de geoloc? Campo de busca? Loading?)
- Qual é a sequência de passos?

**Não está especificado.**

---

### 5.2 Qual é o comportamento em "sem internet"?
**Pergunta:**
- Usuário offline, cache está vazio
- O que mostra? 
- Uma tela com "Sem internet"? 
- Um prompt "Procure um local primeiro"?

**Não está especificado.**

---

### 5.3 Qual é o limite de requisições à API?
**Assunção diz:**
> "A API Open-Meteo permanecerá acessível com as políticas atuais."

Mas:
- Open-Meteo tem rate limit? Qual?
- Se você tem 1000 usuários fazendo 10 requisições/dia cada, são 10k requisições/dia
- Vocês vão monitorar isso?
- Qual é o plano se exceder?

**Risco:** Surpresa desagradável em produção.

---

### 5.4 Como é que a app diferencia "primeira abertura" de "reabertura"?
**Problema:**
- Você diz: "Geolocation automaticamente na primeira abertura"
- Como sabe que é primeira abertura?
- Você usa um flag no localStorage?
- Ou qual é a lógica?

**Não está claro.**

---

### 5.5 Qual é o comportamento se o usuário muda de país/continente?
**Cenário:**
- Usuário em São Paulo, favorita a localização
- Daqui 6 meses, se muda para Berlim
- Abre a app na primeira vez em Berlim
- Geolocation retorna Berlim
- Mas ele tinha favorita São Paulo
- Qual é o UX? Mostra São Paulo? Pergunta se quer atualizar?

**Não está especificado.**

---

## 🧪 Seção 6: Critérios de Sucesso Não-Verificáveis

### 6.1 "Mensagens de erro legíveis"
**Especificação:** "Mensagens de erro legíveis (não expor stack traces)"

**Problema:** O que é "legível"?
- "Erro de conexão" é legível?
- "Falha ao buscar previsão" é legível?
- "A solicitação expirou" é legível?

**Qual é o critério objetivo?**
- Máximo 100 caracteres?
- Deve conter sugestão de ação?
- Deve estar em português?

**Não há métrica clara.**

---

### 6.2 "Interface funciona com teclado"
**Especificação:** "Interface funciona com teclado (navegação completa)"

**Problema:** O que é "navegação completa"?
- Todos os elementos são alcançáveis?
- Ou todos os elementos são **funcionais** via teclado?
- Tab + Enter? Ou precisa de Shift+Tab para voltar?
- Como testa isso objetivamente?

---

### 6.3 "Sem warnings no console"
**Especificação:** "Sem warnings no console (produção)"

**Problema:**
- Isso é frágil. Warnings podem vir de bibliotecas externas.
- Você vai "suprimir" React warnings?
- Qual é exatamente a lista de warnings aceitáveis?

---

## 📈 Seção 7: Métricas Faltando

### 7.1 Performance mensurada como quê?
**Problema:**
> "Carregamento inicial da UI < 2s (com skeleton loading)"

Mas:
- 2 segundos em que métrica? First Paint? First Contentful Paint? Fully Loaded?
- Em qual rede? 4G? WiFi? Slow 3G (como o Lighthouse testa)?
- Em qual device? iPhone 12? Galaxy S5 de 2015?

**Sem contexto, a métrica é inútil.**

---

### 7.2 "Bundle < 150KB gzipped"
**Problema:**
- É um limite bom? Por quê?
- Você mediu o tamanho do bundle de uma app React + Vite moderna?
- Isso é realista?

**Nunca foi justificado.**

---

### 7.3 "Cobertura 80-90%"
**Problema:**
- Por que 80-90 e não 85?
- Qual é a consequência se for 79%?
- Qual é a consequência se for 95%?

**Arbitrário demais.**

---

## 🔐 Seção 8: Segurança e Privacy (Praticamente Ignora)

### 8.1 Privacy: Dados de Geolocation
**Problema:**
- Você rastreia geolocation do usuário
- Ele persiste no localStorage
- Isso é seguro?
- Qual é a política de privacidade?

**Requisitos:**
- Você precisa de consentimento GDPR?
- Qual é o período de retenção?
- Você vende dados?
- Como o usuário deleta tudo?

**Não está respondido.**

---

### 8.2 Sanitização de dados
**Especificação:** "Sanitização de dados exibidos (sem XSS)"

**Problema:**
- Como você vai sanitizar? DOMPurify? React's built-in escaping?
- Qual é o list de tags HTML permitidas?
- De onde vem XSS? Da API? Não, a Open-Meteo não retorna HTML...

**Risco:** Requisito artificial que não resolve um problema real.

---

## ✨ Seção 9: Coisas que Faltam Completamente

### 9.1 Tratamento de rede instável
- Qual é o comportamento durante reconexão?
- Se o usuário tira/coloca a app em background, o cache é revalidado?

### 9.2 Estratégia de logging
- Você vai logar erros?
- Para onde?
- Sentry? Console?

### 9.3 Instruções de deploy
- Como você vai deployar?
- GitHub Pages? Vercel? Netlify?
- Qual é o pipeline?

### 9.4 Instruções de monitoramento
- Como você vai monitorar a saúde da app em produção?
- Metrics qual serão? (Uptime? Error rate?)

### 9.5 Estratégia de versioning
- Como vai fazer atualizações? (Service Worker? Cache busting?)
- Qual é o suporte para browsers antigos?

### 9.6 "Sensação térmica" — De onde vem?
- Open-Meteo fornece isso?
- Você vai calcular usando Índice de Calor? Wind Chill?
- Qual é a fórmula?

### 9.7 Localização do usuário — Qual é o risco?
- E se o usuário mudar de VPN/proxy?
- E se navegador retorna localização errada?
- Há validação de sanidade?

---

## 🎯 Seção 10: Questões Retóricas do PM

1. **"Como você vai saber se o app é bem-sucedido?"**
   - Você não tem KPIs de negócio definidos

2. **"Quem vai manter isso após o lançamento?"**
   - Não está claro

3. **"Qual é o custo mensal de infraestrutura?"**
   - É free tier da Open-Meteo? Vercel free? Até quando?

4. **"Quando você vai deprecate isso?"**
   - Qual é a roadmap pós-MVP?

5. **"Como você sabe que 10 favoritos é o certo?"**
   - Por que não 5? Ou 50?

6. **"Por que dark glassmorphism especificamente?"**
   - Qual é a justificativa de design?

7. **"Se 'é um projeto de treinamento', qual é o objetivo pedagógico?"**
   - Ensinar React? SDD? Ambos?

---

## 📋 Resumo: Ambiguidades + Lacunas

| # | Tipo | Tópico | Severidade | Impacto |
|---|------|--------|-----------|--------|
| 1 | Lacuna | Objetivo de negócio | 🔴 CRÍTICA | Pode matar o projeto |
| 2 | Lacuna | KPIs reais | 🔴 CRÍTICA | Sem como medir sucesso |
| 3 | Ambiguidade | Definição de "usuário" | 🟠 ALTA | Design incoerente |
| 4 | Ambiguidade | "Condição meteorológica" — Mapeamento | 🟠 ALTA | Pode quebrar com dados reais |
| 5 | Ambiguidade | Comportamento de cache | 🟠 ALTA | Usuários confusos |
| 6 | Lacuna | Modelo de dados | 🟠 ALTA | Implementação tardia |
| 7 | Lacuna | UX de favoritos | 🟠 ALTA | Pode mudar durante dev |
| 8 | Ambiguidade | Unidades: E precipitação/pressão? | 🟡 MÉDIA | Scope creep |
| 9 | Lacuna | Rate limits da API | 🟡 MÉDIA | Surpresa em produção |
| 10 | Lacuna | GDPR/Privacy | 🔴 CRÍTICA | Problema legal |
| 11 | Lacuna | Logging/Monitoring | 🟡 MÉDIA | Debug difícil |
| 12 | Inconsistência | "Usuários técnicos" vs WCAG AA | 🟠 ALTA | Contradição |

---

## 🎬 Recomendação: Próximos Passos

**Antes de passar para SPEC:**

1. ✅ Definir claramente: Este é um projeto de **treinamento** ou um **produto real**?
   - Se treinamento: "Objetivo pedagógico é aprender SDD com React + Copilot"
   - Se produto: Precisa de business case, KPIs, usuários reais

2. ✅ Listar quem são os **usuários verdadeiros** (não "técnicos")

3. ✅ Definir o **modelo de dados** com exemplos JSON

4. ✅ Criar wireframe ou mockup da UI (mesmo que rough)

5. ✅ Enumerar **todas** as condições de erro

6. ✅ Validar com Open-Meteo API docs exatamente quais dados estão disponíveis

7. ✅ Responder: **Privacy e GDPR — é necessário?**

---

## Veredito Final

**Score: 6/10 para um projeto REAL; 8/10 para um projeto de TREINAMENTO**

| Aspecto | Situação |
|---------|----------|
| Estrutura | ✅ Excelente |
| Clareza | ⚠️ Boa, com ambiguidades |
| Completude | ❌ Sérias lacunas |
| Testabilidade | ⚠️ Critérios não são todos verificáveis |
| Viabilidade | ⚠️ Realista, mas com riscos |
| Alinhamento | ❌ Contraditório em alguns pontos |

**Recomendação:** Congelar Discovery como está, mas **documentar todas essas questões abertas** na Spec. Não deixe a Spec resolver ambiguidades que deveriam ter sido resolvidas aqui.
