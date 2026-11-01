# Como colocar o site no ar

O site tem três partes:

| Parte | Onde fica | O que faz |
|---|---|---|
| Página | `site/` | Tudo o que o convidado vê. Os dados do casamento ficam no bloco `CONFIG`, perto do fim do `site/index.html`. |
| Funções | `netlify/functions/` | Mural de recados (salvo no Netlify Blobs) e a ponte da confirmação com a planilha. |
| Script da planilha | `apps-script/Code.gs` | Roda dentro da planilha do Google, busca o convite pelo nome e grava as respostas. |

## 1. Ligar a confirmação de presença na planilha (5 minutos)

1. Abra a planilha **Planilha_Organizacao_Casamento May e Diego**.
2. Clique em **Extensões > Apps Script**. Apague o que estiver lá e cole todo o conteúdo de `apps-script/Code.gs`. Salve.
3. Clique na engrenagem (**Configurações do projeto**). Em **Propriedades do script**, adicione:
   - Propriedade: `TOKEN`
   - Valor: uma senha longa qualquer, por exemplo `casamento-2027-` seguido de umas 20 letras e números aleatórios.
4. Clique em **Implantar > Nova implantação**. Escolha o tipo **App da Web** e preencha:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Autorize o acesso quando o Google pedir. Copie a URL que termina em `/exec`.

O que o script faz na planilha:
- Lê a aba **👥 Convidados** e usa a coluna **Grupo de convite** para saber quem está no mesmo convite.
- Na primeira resposta, cria cinco colunas no lugar das "Coluna 1" a "Coluna 5", que estão vazias: **Presença (site)**, **Restrição alimentar (site)**, **Recado (site)**, **Respondido por (site)** e **Respondido em (site)**.
- Cada pessoa recebe **Vai** ou **Não vai** na própria linha. Se alguém responder de novo, a última resposta é a que vale.
- Não mexe em nenhuma outra coluna.

**Se o convite de alguém precisar ser diferente do "Grupo de convite"**, crie uma coluna chamada `Convite (site)` e escreva o nome do convite nessa linha. Quando essa coluna está preenchida, ela tem prioridade.

## 2. Criar o site no Netlify

1. Em app.netlify.com, clique em **Add new project > Import an existing project > GitHub** e escolha o repositório `mayararayne/Diego-Mayara`.
2. O Netlify lê o `netlify.toml` sozinho: a pasta publicada é `site` e as funções ficam em `netlify/functions`.
3. Em **Project configuration > Environment variables**, crie estas três variáveis (escopo: Functions):

| Variável | Valor |
|---|---|
| `RSVP_SCRIPT_URL` | a URL `/exec` do passo 1 |
| `RSVP_TOKEN` | a mesma senha do `TOKEN` do passo 1 |
| `RECADOS_ADMIN_TOKEN` | outra senha, para apagar recados |

4. Faça um novo deploy (**Deploys > Trigger deploy**) para as variáveis valerem.

## 3. Apagar um recado do mural

Abra o site com `#admin=` e a senha do `RECADOS_ADMIN_TOKEN` no fim do endereço, por exemplo `https://seu-site.netlify.app/#admin=SUA_SENHA`. Cada recado ganha um botão **Apagar recado**. A senha some da barra de endereço e só vale naquela aba.

## 4. Prazo da confirmação

O prazo é `prazo: "2027-03-01"` no `CONFIG` do `site/index.html` e `PRAZO_RSVP` em `netlify/lib/planilha.mts`. **Se mudar a data, mude nos dois lugares.** Depois do prazo:
- o site esconde a busca e mostra os botões de WhatsApp da Mayara e do Diego;
- o servidor recusa qualquer confirmação, mesmo que alguém tente enviar por fora do site.

## Arquivos de mídia

O `index.html` procura fotos, vídeos e música em `site/media/`. Os nomes que faltam estão em `docs/midia-faltando.txt`.
