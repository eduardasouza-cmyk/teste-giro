# Giro Rápido — estrutura modular

Antes: 1 arquivo `index.html` com 1,77 MB e 3.219 linhas.
Agora: `index.html` com 548 linhas (28 KB) + módulos separados.

## Onde mexer em cada coisa

| Quero mudar... | Abro este arquivo |
|---|---|
| Layout/estilo geral (cores, cards, botões) | `css/base.css` |
| Tela de login / gate de acesso (visual) | `css/auth.css` |
| Estrutura da página (HTML, header, campos) | `index.html` |
| Temas por empresa, cálculo, geração de PDF, INIT | `js/app-core.js` |
| Gate de acesso e definição de limite (Mesa) | `js/mesa-limite.js` |
| Calculadora de aporte (Mesa) | `js/mesa-aporte.js` |
| Menu sanduíche da Mesa | `js/mesa-menu.js` |
| Lâminas comerciais (comportamento do modal) | `js/comercial-materiais.js` |
| Comparador bandeira × vencimento | `js/comparador-v3.js` |
| Logos (base64) — **arquivo gerado, não editar** | `js/data/logos.js` |
| Lâminas em PNG (base64) — **arquivo gerado** | `js/data/materiais.js` |

## Imagens soltas
Os PNGs também foram salvos em `assets/logos/` e `assets/laminas/`, com os mesmos
conteúdos que estão em base64. Servem para você trocar/editar a arte sem caçar
base64 no meio do código. Cada item de `MATERIAIS` ganhou um campo `src` com o
caminho do arquivo, além do `img` em base64 que continua sendo o usado.

## Como rodar
Precisa de um servidor local (não abra por `file://`, senão o PDF e os módulos
podem falhar por CORS):

    python3 -m http.server 8000

e acesse http://localhost:8000

## Ordem dos scripts
A ordem no final do `index.html` importa: `data/` primeiro (logos e materiais),
depois `app-core.js`, depois os módulos. Cada módulo continua isolado em IIFE,
então não há colisão de variáveis globais (verificado).
