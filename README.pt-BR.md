<p align="right"><a href="README.md">English</a> · <strong>Português</strong></p>

# Hazard Tape

[![version](https://img.shields.io/badge/version-1.0.0-111111?style=flat-square)](manifest.json)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-F5C518?style=flat-square&labelColor=111111)
![Chrome](https://img.shields.io/badge/Chrome-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Brave](https://img.shields.io/badge/Brave-FB542B?style=flat-square&logo=brave&logoColor=white)
![Edge](https://img.shields.io/badge/Edge-0078D7?style=flat-square&logo=microsoftedge&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=flat-square&logo=firefox&logoColor=white)

Tarja colorida para Brave, Chrome, Edge e Firefox. Teste, homologação, local e produção ficam visualmente distintos, para que o ambiente errado apareça antes de qualquer alteração.

Manifest V3. A tarja é desenhada num Shadow DOM fechado, com `pointer-events: none`: o layout da página permanece intacto e os cliques passam direto.

## Em relação ao Environment Indicator

| | Environment Indicator | Hazard Tape |
| --- | --- | --- |
| Caminho da URL | Só o host | Host e caminho |
| Isolamento | CSS injetado na página | Shadow DOM fechado |
| Aplicações de página única | | Reavalia na troca de rota |
| Título da aba | | Prefixo, como `[HML] ` |
| Selo no ícone | | Sim |
| Moldura e listras | | Sim |
| Ocultar numa aba | | Pelo popup |
| Importar e exportar | JSON | JSON |

## Permissões

| Permissão | O que faz |
| --- | --- |
| `storage` | Guarda as regras no navegador. Nada sai da máquina. |
| `activeTab` | O popup lê o endereço da aba atual quando o ícone é clicado. |
| Content script | Roda em `http` e `https` para testar as regras. Não envia dados. |

## Instalação

Mantenha esta pasta no disco. O navegador carrega a extensão a partir dela. A página de regras abre com três exemplos: Local, Homologação e Produção. Produção começa desligada.

**Brave, Chrome ou Edge**

1. Abra `brave://extensions`, `chrome://extensions` ou `edge://extensions`.
2. Ligue o **Modo de desenvolvedor**.
3. Clique em **Carregar sem compactação** e escolha a pasta `hazard-tape`.

Depois de alterar o código, recarregue a extensão pelo card nessa página.

**Firefox 121 ou mais novo**

1. Abra `about:debugging#/runtime/this-firefox`.
2. Clique em **Carregar extensão temporária** e escolha o `manifest.json` dentro de `hazard-tape`.

Essa carga dura até o Firefox fechar. Depois de alterar o código, recarregue a extensão nessa página. A instalação permanente é um pacote assinado no addons.mozilla.org.

## Regras

| Ajuste | Comportamento |
| --- | --- |
| Comparar com | Só o domínio (`staging.empresa.com.br`, com a porta) ou a URL completa: domínio, caminho, `?query` e `#hash`. |
| Tipo | Contém, começa com, termina com, igual a, curinga (`*-stg.*.com.br`) ou expressão regular. |
| Padrões | Um por linha. Basta um casar. |
| Prioridade | Vale a primeira regra ativa que casar. Reordene com ↑ ↓. |

**Testar um endereço** mostra na hora se a regra casa e se outra está na frente.

**Aparência.** Fita diagonal, faixa no topo ou no rodapé, triângulo no canto, ou só a moldura. Cor de fundo e de texto, opacidade, listras de alerta, moldura em volta da tela e prefixo no título da aba.

## Para o time

| Forma | Como |
| --- | --- |
| Arquivo de regras | Configure uma vez, clique em **Exportar** e envie `tarja-ambiente-regras.json`. Cada pessoa usa **Importar**. |
| Pasta descompactada | Siga a instalação acima. |
| Chrome Web Store, não listada | Só quem tem o link instala. A atualização é automática. O cadastro de desenvolvedor tem taxa única. |
| Política do navegador | Brave e Chrome aceitam `ExtensionInstallForcelist` via GPO ou MDM, em todas as máquinas. |
| addons.mozilla.org | Pacote assinado para instalar no Firefox de forma permanente. Pode ficar não listado. |

## Desenvolvimento

A lógica de casamento das regras também roda em Node.

```bash
node --test tests/rules.test.js
```

| Arquivo | Função |
| --- | --- |
| `manifest.json` | Manifest V3 |
| `background.js` | Instala os exemplos e cuida do selo no ícone |
| `content.js` | Decide se a página casa e desenha a tarja |
| `lib/rules.js` | Modelo de regra e lógica de casamento |
| `lib/render.js` | Desenho da tarja em Shadow DOM |
| `popup.html`, `popup.js` | Popup do ícone |
| `options.html`, `options.js` | Tela de regras |
| `ui.css` | Estilos do popup e das opções, claro e escuro |
| `tests/` | Testes da lógica de casamento |

---

**Keiko Solutions** · Mantenedor: Keiko Mori
