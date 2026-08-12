# Especificação do Produto — Weather App

## Overview

O Weather App é uma aplicação web de previsão do tempo desenvolvida como projeto de treinamento em Spec-Driven Development. O objetivo principal é permitir que usuários consultem rapidamente o clima atual e a previsão dos próximos dias de qualquer localidade pesquisada, com boa experiência visual, acessibilidade e suporte a geolocalização.

A solução deve funcionar como um MVP focado em clareza, rapidez e confiabilidade. Ela deve aceitar buscas por cidade, oferecer uma visão clara de clima atual e previsão de 7 dias, suportar unidades de temperatura e vento, persistir favoritos e lidar com estados de carregamento, erro e ausência de resultados de forma explícita.

### Objetivos do produto
- Fornecer uma previsão meteorológica útil em poucos segundos.
- Permitir busca manual e geolocalização automática como entrada principal.
- Dar ao usuário controle sobre unidades de medida e locais favoritos.
- Garantir experiência responsiva e acessível em dispositivos móveis e desktop.
- Ter comportamento previsível em cenários de falha de rede, API indisponível e entrada inválida.

### Persona principal
- Usuário geral que precisa consultar o clima de uma cidade com velocidade e simplicidade.
- Usuário recorrente que quer salvar cidades de interesse e alternar entre unidades de temperatura e vento.

---

## API Contract

### Geocoding
- Provedor e endpoint: `GET https://geocoding-api.open-meteo.com/v1/search`.
- Parâmetros obrigatórios: `name=<consulta codificada>`, `count=10` e `language=pt`.
- O resultado deve ser convertido para a entidade Localidade definida em FR-01. Resultados sem latitude, longitude ou timezone não devem ser exibidos como selecionáveis.

### Forecast
- Provedor e endpoint: `GET https://api.open-meteo.com/v1/forecast`.
- Parâmetros obrigatórios: `latitude`, `longitude`, `timezone=auto`, `forecast_days=7`, `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` e `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`.
- A requisição não deve enviar parâmetros de unidade. A resposta é tratada como Celsius e km/h canônicos e convertida somente na apresentação, conforme FR-05.
- A camada de integração deve rejeitar a resposta como incompatível se `current_units.temperature_2m` não for `°C`, se `current_units.wind_speed_10m` não for `km/h`, se `daily_units.temperature_2m_max` ou `daily_units.temperature_2m_min` não forem `°C`, ou se `daily_units.precipitation_probability_max` não for `%`.
- Deve usar o modelo padrão disponibilizado pelo provedor; a seleção de modelo meteorológico específico não faz parte do MVP.
- `current.apparent_temperature` representa sensação térmica, `current.wind_speed_10m` representa vento atual, `current.weather_code` representa a condição atual e `daily.precipitation_probability_max` representa a probabilidade máxima diária de precipitação.
- `timezone=auto` é a fonte dos timestamps meteorológicos. Para Localidade de geocoding, o timezone retornado deve coincidir com o timezone da Localidade antes de os dados serem aceitos; em caso de divergência, a resposta deve ser tratada como inválida. Na primeira consulta por geolocalização, o timezone retornado deve preencher a Localidade sintética; em consultas posteriores, deve coincidir com o timezone já salvo.
- Campos estruturais obrigatórios são `current.time` e a lista `daily.time`; a ausência ou invalidade de qualquer um torna a resposta de forecast inválida. Os demais campos contratados são meteorológicos opcionais e seguem o tratamento de resposta parcial.
- Os arrays de cada variável diária usam o mesmo índice de `daily.time`. Para os índices de 0 a 6, campo ausente, índice ausente ou valor inválido deve afetar somente o respectivo campo daquele dia. Se `daily.time` tiver mais de sete posições, somente as sete primeiras devem ser consideradas.

### Apresentação de condições meteorológicas
| Código WMO | Texto pt-BR | Categoria visual |
| --- | --- | --- |
| 0 | Céu limpo | Céu limpo |
| 1 | Predominantemente limpo | Parcialmente nublado |
| 2 | Parcialmente nublado | Parcialmente nublado |
| 3 | Encoberto | Nublado |
| 45, 48 | Nevoeiro | Nevoeiro |
| 51, 53, 55 | Garoa | Garoa |
| 56, 57 | Garoa congelante | Garoa congelante |
| 61, 63, 65 | Chuva | Chuva |
| 66, 67 | Chuva congelante | Chuva congelante |
| 71, 73, 75, 77 | Neve | Neve |
| 80, 81, 82 | Pancadas de chuva | Pancadas de chuva |
| 85, 86 | Pancadas de neve | Pancadas de neve |
| 95 | Tempestade | Tempestade |
| 96, 99 | Tempestade com granizo | Tempestade com granizo |
- Cada categoria visual deve usar um ícone semanticamente correspondente. Texto apresentado e categoria visual são conceitos independentes. Valores fora do catálogo devem usar o fallback `Condição indisponível` de FR-03.

---

## Functional Requirements

### FR-01 — Localidade e busca
- Uma **localidade de geocoding** contém `id`, `name`, `latitude`, `longitude`, `country`, `countryCode`, `admin1` e `timezone`. `id`, latitude, longitude, `name` e timezone são obrigatórios; `country`, `countryCode` e `admin1` podem ser ausentes.
- Uma **localidade de geolocalização** contém `id` no formato `geolocation:<latitude com 4 decimais>:<longitude com 4 decimais>`, `name` igual a `Localização atual`, latitude, longitude e timezone do forecast. País, código de país e região são ausentes. Ela pode ser favoritada normalmente.
- Coordenadas que resultem no mesmo `id` após arredondamento para quatro casas decimais representam a mesma Localidade de geolocalização para favoritos e cache. Essa Localidade representa a posição no momento da criação e não acompanha mudanças posteriores da posição do usuário.
- O campo aceita nomes de cidades e localidades, incluindo acentos, espaços, hífens e apóstrofos. Antes da validação, a consulta deve remover espaços nas extremidades e comprimir espaços internos consecutivos em um único espaço. Essa normalização é aplicada somente ao valor enviado ao geocoding e não altera o texto visível enquanto o campo está em edição. Uma consulta precisa conter pelo menos duas letras Unicode para ser válida. Códigos postais, países isolados e regiões administrativas isoladas não fazem parte do MVP.
- A busca é autocomplete: inicia após pelo menos 2 caracteres não vazios, com debounce de 300 ms, sem botão de confirmação.
- O sistema deve abortar a busca anterior quando tecnicamente possível e ignorar toda resposta que não corresponda à consulta mais recente.
- A camada de integração deve converter os nomes e o casing dos campos externos para o modelo de domínio, incluindo `country_code` para `countryCode`.
- Deve exibir até 10 sugestões no formato `Cidade — Estado/Região, País`, diferenciando homônimos e preservando a ordem retornada pelo geocoding. Campo vazio, entrada composta apenas por espaços ou texto com menos de 2 caracteres não deve gerar requisição e deve limpar as sugestões.
- O usuário deve navegar pelas sugestões com seta para cima/baixo, selecionar com Enter ou clique, fechar com Escape ou clique fora do componente.

### FR-02 — Geolocalização e precedência de ações
- Na abertura, o sistema deve iniciar uma única tentativa automática de geolocalização com timeout de 10 segundos.
- Permissão negada, API não suportada, erro ou timeout devem retornar ao estado inicial, comunicar o ocorrido de forma não bloqueante e manter a busca manual disponível.
- Uma ação explícita do usuário, como iniciar uma busca, selecionar uma sugestão, abrir um favorito ou atualizar dados, tem precedência sobre a geolocalização automática. A conclusão tardia da geolocalização não pode alterar a localidade selecionada pelo usuário.

### FR-03 — Dados meteorológicos atuais
- Para uma localidade selecionada, o sistema deve exibir temperatura, umidade relativa, sensação térmica, velocidade do vento e condição meteorológica.
- “Clima atual” representa o bloco `current` da previsão da Open-Meteo para o horário mais recente disponibilizado pelo provedor; não representa necessariamente uma observação de estação meteorológica em tempo real.
- A interface deve rotular `current.time` como `Condição às HH:mm`, pois ele representa o horário do dado meteorológico. A data da previsão deve usar o formato `dia da semana, d de mês`, em pt-BR e no timezone da localidade. O MVP não deve exibir horário da consulta feita pelo cliente.
- Cada código meteorológico recebido deve ter texto em pt-BR e ícone de apresentação definidos. Um código desconhecido deve usar o texto e ícone de fallback `Condição indisponível`.

### FR-04 — Previsão de sete dias
- A previsão deve conter exatamente 7 dias de calendário, incluindo o dia atual e os 6 dias seguintes, definidos no timezone da localidade selecionada.
- Para cada dia, deve exibir condição, temperaturas máxima e mínima e a probabilidade máxima de precipitação do dia, em percentual, quando disponível.
- A previsão retornada antes da meia-noite permanece válida até uma nova solicitação manual ou seleção de localidade; não há atualização automática no MVP.
- Se um ou mais índices de `daily.time` estiverem ausentes ou se tiverem menos de sete posições, a interface deve completar as posições faltantes até sete cards, usando a data calculada no timezone da localidade e `Indisponível` para seus dados meteorológicos.
- Em larguras a partir de 768 CSS pixels, os sete dias devem ser apresentados em grade. Abaixo de 768 CSS pixels, devem permanecer acessíveis por rolagem horizontal com controle por teclado, sem ocultar dias.

### FR-05 — Unidades e atualização manual
- O domínio deve armazenar dados meteorológicos nas unidades canônicas Celsius e km/h. A apresentação deve converter imediatamente para Fahrenheit e mph sem nova requisição, usando $F = C \times 9/5 + 32$ e $mph = km/h \div 1{,}609344$.
- Temperaturas, sensação térmica e velocidades devem usar `Math.round`; probabilidades de precipitação devem usar `Math.round`, ser limitadas ao intervalo de 0 a 100 e seguidas de `%`.
- A formatação deve ter exatamente um espaço entre valor e unidade: `20 °C`, `68 °F`, `10 km/h`, `6 mph` e `65%`.
- As unidades padrão são Celsius e km/h. As preferências devem persistir localmente e ser aplicadas na próxima abertura quando válidas.
- Um comando explícito de atualização deve iniciar uma nova requisição ao endpoint de forecast para a localidade atual, independentemente da idade do cache. Não há atualização automática em segundo plano no MVP.
- O comando de atualização não deve estar disponível nos estados `INITIAL`, `SEARCHING`, `RESULTS` e `NO_RESULTS`.

### FR-06 — Favoritos e persistência
- Um favorito deve armazenar a entidade localidade completa. Duplicidade é definida exclusivamente por `location.id`.
- A lista deve manter ordem de inclusão, comportar no máximo 10 itens e recusar o 11º sem remover ou substituir favoritos existentes. Inclusão e remoção devem refletir imediatamente na interface.
- Ao selecionar um favorito, o sistema deve solicitar a previsão para suas coordenadas e exibir carregamento durante a atualização. Dados em cache válidos podem permanecer visíveis enquanto a atualização ocorre.
- Favoritos, preferências e cache devem usar, respectivamente, as chaves de `localStorage` `weather-app:favorites:v1`, `weather-app:preferences:v1` e `weather-app:forecast:v1:<location-id>`. O cache deve armazenar somente a Localidade, dados canônicos, timezone e horário de gravação.
- O horário de gravação do cache deve ser `storedAt`, obtido por `Date.now()` em milissegundos desde Unix epoch. Cache com `storedAt` ausente, inválido ou futuro deve ser descartado. Dados meteorológicos canônicos podem ser mantidos em cache local por localidade durante 30 minutos, calculados a partir de `storedAt`.
- Ao selecionar favorito com cache válido, a interface deve exibir imediatamente o cache e iniciar a revalidação em `WEATHER_LOADING`. Sem cache válido, deve exibir `WEATHER_LOADING` sem dados anteriores. Cache expirado deve ser removido antes de ser usado; seleção de favorito e atualização manual devem sempre tentar revalidar os dados.
- Se `localStorage` estiver indisponível, cheio, inválido ou contiver schema não reconhecido, o sistema deve descartar apenas o dado inválido, continuar funcional e comunicar que favoritos ou preferências não serão persistidos.

### FR-07 — Estados, erros e tentativas
- Os estados observáveis são: `INITIAL`, `SEARCHING`, `RESULTS`, `NO_RESULTS`, `LOCATING`, `WEATHER_LOADING`, `WEATHER`, `WEATHER_STALE`, `SEARCH_ERROR` e `WEATHER_ERROR`.
- `INITIAL` transita para `SEARCHING` por uma busca válida e para `LOCATING` na tentativa automática. `SEARCHING` transita para `RESULTS`, `NO_RESULTS` ou `SEARCH_ERROR`. Limpar ou invalidar a consulta retorna a `INITIAL`; selecionar uma localidade transita para `WEATHER_LOADING`; `WEATHER_LOADING` transita para `WEATHER`, `WEATHER_STALE` ou `WEATHER_ERROR`; a ação de repetir transita para o estado de carregamento da última operação. Uma nova ação do usuário cancela ou invalida a operação anterior e assume o estado correspondente.
- Geocoding e forecast expiram após 5 segundos totais, contados do início da operação, incluindo tentativas e backoff. Geolocalização expira após 10 segundos totais. Ao expirar, a operação deve ser abortada quando possível e qualquer resposta posterior deve ser ignorada.
- Falhas transitórias de rede e respostas 5xx devem ser repetidas automaticamente até três vezes após a falha inicial, com esperas de 250 ms, 500 ms e 1.000 ms. O agendador não deve iniciar retry se restarem menos de 250 ms para o deadline da operação; toda tentativa em andamento deve ser abortada no deadline. Respostas 4xx, inclusive 429, não devem ser repetidas automaticamente; em 429, todas as novas tentativas manuais de geocoding e forecast devem ser bloqueadas globalmente por 60 segundos, sem contador obrigatório.
- Se uma atualização falhar com dados válidos já exibidos, os dados anteriores devem permanecer visíveis e um erro não bloqueante deve ser apresentado (`WEATHER_STALE`), indicando que os dados são anteriores e mostrando `Condição às HH:mm` quando disponível. Sem dados anteriores, deve ser exibido erro completo (`WEATHER_ERROR`) com comando de tentar novamente a última operação.
- Respostas parciais devem apresentar os campos disponíveis; campos ausentes devem mostrar `Indisponível`, sem impedir a exibição dos demais dados válidos.

### FR-08 — Acessibilidade e interação
- O campo de busca deve possuir `label` associado e seguir o padrão de combobox acessível, com item ativo exposto de forma equivalente a `aria-activedescendant`.
- Todo botão deve ter nome acessível; o botão de favorito deve anunciar se a localidade está ou não salva; alternadores de unidade devem expor a opção selecionada.
- Resultados de busca, carregamento, ausência de resultados e erros devem ser anunciados por região `aria-live` apropriada, sem movimentar o foco inesperadamente.
- O foco deve ser visível, a ordem de tabulação deve seguir a ordem visual, estados não podem depender só de cor e os alvos de toque devem ter pelo menos 24 por 24 CSS pixels.
- A interface deve continuar utilizável com zoom de 200%, reflow e orientação retrato ou paisagem. Animações devem respeitar `prefers-reduced-motion`.
- Os fluxos de busca, seleção, carregamento, erro e favoritos devem ser verificados manualmente com NVDA e Chrome estável mais recente no ambiente de QA.

### FR-09 — Privacidade e dados externos
- Coordenadas da geolocalização devem ser usadas somente no navegador para consultar a Open-Meteo; não existe servidor próprio nem armazenamento de coordenadas fora do dispositivo.
- Consultas devem ser transmitidas como parâmetros codificados, nenhum conteúdo fornecido pelo usuário deve ser interpretado como HTML e respostas externas devem ser validadas antes de compor o modelo de domínio.

---

## User Stories

### US-01 — Busca por localidade
Como usuário casual, quero pesquisar uma localidade por nome para consultar o clima de um local específico rapidamente.

### US-02 — Geolocalização
Como viajante, quero que o aplicativo tente detectar minha localização para consultar o clima local sem digitação manual.

### US-03 — Previsão
Como pessoa que planeja o dia, quero visualizar o clima atual e sete dias de previsão para decidir sobre roupa, deslocamento e atividades.

### US-04 — Unidades e atualização
Como usuário que prefere unidades próprias, quero alternar unidades e atualizar os dados exibidos para consultá-los no formato adequado.

### US-05 — Favoritos
Como usuário recorrente, quero salvar localidades para acessá-las rapidamente sem repetir buscas.

### US-06 — Uso acessível e responsivo
Como pessoa que usa teclado, leitor de tela ou tela pequena, quero usar todos os fluxos sem perda de informação ou controle.

---

## Acceptance Criteria

### AC-01 — US-01 / FR-01: autocomplete
- Dada consulta com espaços excedentes, quando ela for validada, então espaços externos devem ser removidos, espaços internos devem ser comprimidos e a solicitação deve usar o valor normalizado.
- Dado texto normalizado com ao menos duas letras Unicode, quando o usuário parar de digitar por 300 ms, então deve haver uma única operação de geocoding para a consulta mais recente, que pode realizar retries conforme FR-07.
- Dado que uma solicitação A foi iniciada antes de B, quando A responder após B, então A não deve alterar as sugestões de B.
- Dado resultado de geocoding válido, quando ele contiver mais de 10 locais, então apenas os primeiros 10 devem ser exibidos no formato definido em FR-01.
- Dado campo vazio, espaços ou menos de 2 caracteres, quando o valor mudar, então sugestões e estado de ausência devem ser limpos e nenhuma solicitação deve ser enviada.
- Dado que a API retorna lista vazia, quando a busca termina, então o estado deve ser `NO_RESULTS`, sem solicitação de forecast.
- Dada uma sugestão aberta, quando o usuário usa seta para cima/baixo, Enter, Escape ou clique fora, então a navegação, seleção ou fechamento deve ocorrer conforme FR-01.
- Dada uma sugestão selecionada, quando a seleção for confirmada por Enter ou clique, então as sugestões devem fechar, o valor visível do campo deve se tornar o `name` da Localidade, essa Localidade deve se tornar a seleção atual e uma operação de forecast deve iniciar imediatamente. Em seleção por teclado, o foco deve permanecer no campo; em seleção por clique, o foco não deve ser movido programaticamente.

### AC-02 — US-02 / FR-02: geolocalização
- Dado navegador compatível, quando a aplicação abre, então uma tentativa automática deve iniciar e encerrar em no máximo 10 segundos.
- Dada geolocalização bem-sucedida, quando o primeiro forecast for aceito, então deve ser criada uma Localidade com nome `Localização atual`, identificador baseado nas coordenadas com quatro decimais e timezone retornado pelo forecast.
- Dado permissão negada, indisponibilidade ou timeout, quando a tentativa encerra, então deve haver feedback não bloqueante e o estado deve retornar a `INITIAL`.
- Dada uma busca ou seleção manual em curso, quando a geolocalização terminar depois dela, então a localidade manual deve permanecer selecionada.

### AC-03 — US-03 / FR-03 e FR-04: previsão
- Dada uma localidade válida, quando a previsão é carregada, então devem ser exibidos temperatura, umidade, sensação térmica, vento, condição, `Condição às HH:mm` e exatamente sete dias, incluindo hoje.
- Dado dia com dados disponíveis, quando a previsão é exibida, então devem ser mostradas condição, máxima, mínima e probabilidade máxima diária de precipitação em percentual.
- Dada localidade em timezone diferente do dispositivo, quando datas, horas e dias forem exibidos, então devem usar exclusivamente o timezone da localidade.
- Dada resposta parcial, quando um campo estiver ausente, então esse campo deve exibir `Indisponível` e os demais dados válidos devem permanecer visíveis.
- Dada resposta com menos de sete posições em `daily.time`, quando a previsão for exibida, então devem existir exatamente sete cards, com as posições ausentes marcadas como `Indisponível`.
- Dada resposta com arrays diários de comprimentos diferentes, quando um índice de variável não corresponder a `daily.time`, então somente esse campo do dia correspondente deve exibir `Indisponível`.

### AC-04 — US-04 / FR-05: unidades e atualização
- Dado dado canônico carregado, quando o usuário alterna para Fahrenheit ou mph, então os valores convertidos devem ser exibidos sem uma nova solicitação de forecast.
- Dados $20$ °C e $16{,}09344$ km/h, quando Fahrenheit e mph forem selecionados, então a interface deve exibir, respectivamente, `68 °F` e `10 mph`.
- Dado valor de temperatura de $-0{,}5$ °C, quando ele for apresentado, então deve usar `Math.round` e exibir `0 °C`.
- Dada preferência válida salva, quando a aplicação reabre, então Celsius/Fahrenheit e km/h/mph devem ser restaurados.
- Dada localidade atual, quando o usuário aciona atualização, então uma nova solicitação de forecast deve ser enviada para suas coordenadas.
- Dados os estados `INITIAL`, `SEARCHING`, `RESULTS` ou `NO_RESULTS`, quando a interface for exibida, então o comando de atualização não deve estar disponível.

### AC-05 — US-05 / FR-06: favoritos
- Dada localidade atual válida, quando o usuário a adiciona, então a localidade completa deve ser persistida e o controle deve indicar que ela está salva.
- Dado favorito existente pela identidade definida em FR-06, quando o usuário tenta adicioná-lo novamente, então a lista não deve ganhar item duplicado.
- Dados 10 favoritos, quando o usuário tenta incluir o 11º, então a inclusão deve ser recusada sem remover item existente e com feedback claro.
- Dado favorito salvo, quando ele é selecionado, então o forecast deve ser requisitado para suas coordenadas e a interface deve exibir carregamento.
- Dado `localStorage` indisponível ou inválido, quando favorito ou preferência for manipulado, então o app deve continuar funcional e avisar que não haverá persistência.
- Dado cache com até 30 minutos de gravação, quando um favorito for aberto, então seus dados podem ser mostrados durante o carregamento e uma revalidação deve ser solicitada. Dado cache expirado, ele deve ser removido e não deve ser mostrado.
- Dada Localidade de geolocalização favoritada, quando a posição do usuário mudar, então o favorito deve continuar apontando para as coordenadas e o identificador criados originalmente.

### AC-06 — US-06 / FR-07 e FR-08: estados e acessibilidade
- Dada falha de forecast com dados anteriores, quando as tentativas previstas se esgotarem, então os dados devem permanecer visíveis em `WEATHER_STALE` com erro não bloqueante e ação de tentar novamente.
- Dado `WEATHER_STALE`, quando dados anteriores estiverem visíveis, então a interface deve informar que os dados são anteriores e mostrar `Condição às HH:mm` se `current.time` estiver disponível.
- Dada falha de forecast sem dados anteriores, quando as tentativas previstas se esgotarem, então deve ser exibido `WEATHER_ERROR` com ação de tentar novamente.
- Dada resposta 429, quando a operação encerrar, então não deve haver retry automático e todas as novas tentativas manuais de geocoding ou forecast devem permanecer bloqueadas por 60 segundos.
- Dado uso apenas por teclado, quando o usuário percorre busca, sugestões, unidades, favorito e atualização, então todos os controles devem ter foco visível e ação disponível.
- Dados novos resultados, carregamento, ausência de resultados ou erro, quando o estado mudar, então a mudança deve ser anunciada sem mover o foco inesperadamente.
- Dada largura entre 320 e 1920 CSS pixels, zoom de 200% ou orientação paisagem, quando a interface for usada, então não pode haver perda de conteúdo, controles ou acesso aos sete dias.

### AC-07 — FR-09: privacidade e validação de dados externos
- Dada uma geolocalização bem-sucedida, quando coordenadas forem usadas, então elas devem ser enviadas somente ao endpoint da Open-Meteo e nunca a backend próprio.
- Dada consulta contendo caracteres que possam ser interpretados como HTML, quando ela for exibida ou enviada, então deve ser tratada somente como texto e parâmetro codificado.
- Dado payload externo com campos estruturais inválidos, unidades incompatíveis ou timezone divergente da invariante de domínio, quando ele for recebido, então não deve compor o modelo de domínio e deve produzir erro de integração.

---

## Non-Functional Requirements

### Performance
- A interface inicial deve estar utilizável em até 2 segundos em conexão 4G simulada. “Utilizável” significa que shell, campo de busca e controles principais estão renderizados e interativos, independentemente de respostas de APIs externas.
- A versão de produção deve atingir Lighthouse Performance de pelo menos 90 em modo mobile, usando Chrome estável mais recente, build de produção servido localmente, cache frio e as configurações padrão de simulação 4G do Lighthouse.
- O JavaScript inicial enviado no primeiro carregamento não deve exceder 150 KB compactados em gzip; CSS e módulos carregados sob demanda são excluídos desse limite.
- Geocoding e forecast devem expirar após 5 segundos totais; geolocalização, após 10 segundos totais.

### Acessibilidade
- O produto deve atender WCAG 2.1 AA, incluindo contraste mínimo de 4,5:1 para texto e sem comunicação de estado apenas por cor. Como requisito adicional de produto, alvos de toque devem ter pelo menos 24 por 24 CSS pixels.
- As exigências verificáveis de teclado, foco, anúncios, reflow, zoom e redução de movimento estão em FR-08 e AC-06.

### Responsividade
- O produto deve suportar larguras de 320 a 1920 CSS pixels, dispositivos de toque e mouse, em orientação retrato e paisagem.
- A previsão deve usar grade em tela ampla e rolagem horizontal acessível em tela estreita, conforme FR-04.

### Confiabilidade
- Todas as operações devem obedecer a FR-07 quanto a expiração, aborto, repetição, concorrência e preservação de dados anteriores.
- O cache local tem validade máxima de 30 minutos e não substitui a tentativa de revalidação exigida por FR-06.

### Qualidade
- A lógica de domínio deve ser isolada de rendering e testável; TypeScript deve operar em modo estrito e o lint não deve produzir avisos.
- Testes unitários devem cobrir validação de busca, mapeamento/parsing de API, conversão de unidades, weather codes, timezone e deduplicação/persistência de favoritos.
- Testes de integração devem cobrir busca-seleção-forecast, geolocalização, erros de geocoding e forecast, resposta parcial, concorrência e cache/persistência.
- Testes E2E devem cobrir busca, seleção, unidades, favoritos, abertura de favorito, fluxo sem geolocalização e erro de forecast. Os fluxos críticos devem ter cobertura E2E.

### Compatibilidade
- O produto deve suportar Chrome 90 ou superior, Firefox 88 ou superior, Safari 14 ou superior e Edge 90 ou superior, incluindo Safari e Chrome em dispositivos móveis compatíveis, sem perda de funcionalidades do escopo. APIs indisponíveis devem seguir os fallbacks definidos nesta especificação.

---

## Edge Cases

### Cidade inexistente
- **Cenário:** o usuário digita `Xyzcidadeinexistente` e interrompe a digitação por 300 ms.
- **Comportamento esperado:** quando o geocoding retornar lista vazia, o sistema deve entrar em `NO_RESULTS`, não selecionar localidade nem solicitar forecast e manter o campo disponível para nova busca.

### String vazia
- **Cenário:** o usuário apaga todo o conteúdo do campo após ter digitado uma busca.
- **Comportamento esperado:** o sistema deve limpar sugestões, mensagens de ausência de resultado associadas à busca anterior e qualquer estado de carregamento pendente; não deve iniciar uma requisição de geocoding.

### Caracteres especiais
- **Cenário:** o usuário pesquisa por nomes válidos com acentos, hífens, apóstrofos ou espaços, como `São Paulo`, `D'Ávila` ou `Belo Horizonte`.
- **Comportamento esperado:** o sistema deve aceitar e enviar o texto sem corromper os caracteres, retornando resultados compatíveis quando existirem. Uma entrada composta apenas por espaços ou símbolos sem significado de localidade deve ser tratada como busca inválida, sem requisição, com orientação clara ao usuário.

### Falha de API
- **Cenário:** o serviço de geocoding ou previsão responde com erro HTTP, fica indisponível ou ocorre uma falha de rede.
- **Comportamento esperado:** falhas transitórias ou 5xx devem obedecer às três tentativas com backoff de FR-07. Sem dados anteriores, o sistema deve mostrar `SEARCH_ERROR` ou `WEATHER_ERROR`; com dados meteorológicos anteriores, deve manter os dados em `WEATHER_STALE`. Erros 4xx não devem ser repetidos automaticamente.

### Timeout
- **Cenário:** uma solicitação de geocoding, previsão ou geolocalização excede o tempo limite definido pelo produto.
- **Comportamento esperado:** geocoding e forecast expiram após 5 segundos, enquanto geolocalização expira após 10 segundos. A operação deve ser abortada quando possível, respostas tardias devem ser ignoradas e uma nova busca ou tentativa deve permanecer disponível.

### Sem resultados de geocoding
- **Cenário:** o usuário pesquisa por uma string normalizada com pelo menos duas letras Unicode, mas a API de geocoding retorna uma lista vazia.
- **Comportamento esperado:** o sistema deve mostrar uma mensagem específica de que nenhum local correspondente foi encontrado, não exibir uma lista de sugestões vazia e não solicitar dados de previsão.

### Resposta parcial
- **Cenário:** a API de previsão retorna a localidade selecionada, mas omite um ou mais campos, como umidade atual, sensação térmica, probabilidade de precipitação ou dados de um dia da previsão.
- **Comportamento esperado:** o sistema deve exibir os dados disponíveis, identificar os campos indisponíveis de forma compreensível e manter a estrutura visual consistente. A ausência de um campo opcional não deve impedir a exibição do clima atual ou dos demais dias válidos.

### Outros cenários relevantes
- **Consulta curta:** menos de duas letras Unicode não inicia geocoding e limpa sugestões.
- **Homônimos:** resultados usam cidade, região e país; a identidade e os favoritos usam exclusivamente `id`, nunca apenas o nome.
- **Geolocalização recusada ou não suportada:** deve retornar a `INITIAL` com busca manual disponível.
- **Timezone divergente:** forecast cujo timezone divergir da Localidade deve ser rejeitado como resposta inválida.
- **Persistência indisponível:** favoritos, preferências e cache deixam de persistir, mas o fluxo de consulta continua funcional com aviso não bloqueante.
- **Limite de favoritos:** o 11º item é recusado sem substituir os 10 existentes.
- **Mudança de unidade durante carregamento ou erro:** deve afetar apenas a apresentação de dados canônicos já disponíveis e não alterar a operação pendente ou o estado de erro.

---

## Matriz de Rastreabilidade

| Requisito | Story | Critérios de aceite | Cobertura mínima |
| --- | --- | --- | --- |
| FR-01 | US-01 | AC-01 | Unitário, integração e E2E de busca/concorrência |
| FR-02 | US-02 | AC-02 | Integração e E2E de geolocalização/fallback |
| FR-03, FR-04 | US-03 | AC-03 | Unitário de parsing/timezone e E2E de previsão |
| FR-05 | US-04 | AC-04 | Unitário de conversão e E2E de unidades/atualização |
| FR-06 | US-05 | AC-05 | Unitário de persistência/deduplicação e E2E de favoritos |
| FR-07, FR-08 | US-06 | AC-06 | Integração de erros e E2E de teclado/acessibilidade |
| FR-09 | US-01 a US-06 | AC-07 | Revisão de contratos e validação de entrada |

### Verificação de Requisitos Não Funcionais

| Requisito não funcional | Verificação |
| --- | --- |
| Interface utilizável em até 2 s | Lighthouse mobile com as condições fixadas em Performance |
| Lighthouse Performance >= 90 | Execução Lighthouse mobile em build de produção com cache frio |
| JavaScript inicial <= 150 KB gzip | Análise do artefato de build em CI |
| WCAG 2.1 AA e alvos de 24 px | `axe` automatizado, inspeção visual e teste manual NVDA/Chrome |
| Larguras de 320 a 1920 px | E2E visual em 320 px, 768 px e 1920 px, retrato e paisagem quando aplicável |
| Compatibilidade de navegadores | Matriz CI em Chrome, Firefox, Safari e Edge nas versões mínimas suportadas |
| TypeScript estrito e lint sem avisos | `tsc --noEmit` e `pnpm lint` em CI |
| Fluxos críticos E2E | Relatório Playwright em CI para os cenários definidos em Qualidade |

---

## Assumptions

- O projeto será entregue como aplicação web em React + TypeScript.
- A API de dados será a Open-Meteo, usada conforme suas condições de uso aplicáveis ao projeto de treinamento. Uma publicação comercial exige reavaliação de licença, limites e estratégia de acesso.
- O MVP será entregue em português e com foco em uso geral.
- A geolocalização é opcional e não deve bloquear a aplicação.
- Usuários podem usar a aplicação em mobile e desktop com nível básico de experiência digital.
- `localStorage` é a camada de persistência prevista, com degradação graciosa definida em FR-06.
- O público-alvo é amplo e não exclusivo de usuários técnicos.
- O projeto prioriza valor de uso imediato sobre funcionalidade avançada como mapas, alertas ou histórico.

---

## Risks

### Risco 1: indisponibilidade ou lentidão da API externa
- O serviço meteorológico pode falhar, demorar ou responder com dados incompletos.
- Mitigação: timeout, aborto, retry, cache, estados `WEATHER_STALE`/`WEATHER_ERROR` e resposta parcial conforme FR-06 e FR-07.

### Risco 2: geolocalização inconsistente entre navegadores
- A geolocalização pode falhar em alguns navegadores ou ambientes restritivos.
- Mitigação: timeout de 10 segundos, fallback explícito para busca manual e precedência de ações do usuário conforme FR-02.

### Risco 3: cidades com nomes repetidos
- A busca pode retornar várias localidades com mesmo nome e diferentes países ou regiões.
- Mitigação: exibir contexto da localidade e usar a identidade formal definida em FR-01 e FR-06.

### Risco 4: scope creep de funcionalidades extras
- A funcionalidade pode crescer para mapas, histórico, alertas e outros recursos fora do escopo.
- Mitigação: manter o MVP centrado em previsão atual, 7 dias, busca, favoritos e unidades.

### Risco 5: UX pouco clara em cenários de erro
- Se o erro não for bem explicado, o usuário pode perder confiança no aplicativo.
- Mitigação: padronizar transições, mensagens e anúncios acessíveis conforme FR-07 e FR-08.

---

## Open Questions

Não há decisões de produto bloqueantes em aberto. Biblioteca de datas, conjunto concreto de ícones, gerenciamento de estado e ferramentas de mock devem ser definidos no plano sem alterar os contratos desta especificação.

---

## Out of Scope

O MVP não inclui explicitamente:
- Mapas interativos.
- Histórico de clima.
- Alertas meteorológicos.
- Autenticação e sincronização em nuvem.
- PWA ou instalação como aplicativo.
- Funcionamento offline.
- Notificações push.
- Previsão histórica.
- Configuração de múltiplos temas ou personalização avançada.
- Backend próprio ou armazenamento centralizado de dados de usuário.
- Atualização automática em segundo plano.

---

## Resumo executivo

O Weather App deve ser um MVP funcional, rápido, acessível e visualmente consistente, capaz de entregar clima atual e previsão dos próximos 7 dias para cidades pesquisadas ou detectadas pela geolocalização. O foco não é cobrir todos os recursos do mercado, mas entregar uma experiência útil e confiável com interfaces bem definidas, tratamento de erro e persistência mínima de favoritos e preferências.
