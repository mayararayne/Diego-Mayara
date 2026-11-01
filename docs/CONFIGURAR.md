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
- O site lê e grava **só na aba Confirmação**. As outras abas não são alteradas.
- A pessoa digita o nome e o site mostra todo mundo que tem o mesmo **Convite** (coluna C), para ela responder por todos.
- Cada pessoa recebe **Vai** ou **Não vai** na coluna Presença, junto com restrição alimentar, recado, quem respondeu e quando. Se responder de novo, vale a última resposta.
- O resumo ao lado (colunas N e O) conta sozinho quantos vão, quantos não vão e quantos faltam.

**Para mudar quem aparece junto**, edite a coluna **Convite**: pessoas com o mesmo texto ficam no mesmo convite. **Para mudar como o nome aparece no site**, edite a coluna **Nome (aparece no site)**.

**Convidado novo:** inclua na aba Convidados, como sempre, e depois use o menu **Casamento > Trazer convidados novos da aba Convidados**. O menu aparece depois de instalar o script e recarregar a planilha. Ele só acrescenta quem ainda não está na Confirmação; não apaga nem muda ninguém. Não edite a coluna **Origem**: é por ela que o script sabe quem já foi copiado.

## 2. Ligar o site do Netlify ao GitHub

O site já existe: **diegoemayara** (endereço `https://diegoemayara.netlify.app`). O endereço principal é público; as versões de teste pedem login da equipe.

1. Abra app.netlify.com/projects/diegoemayara > **Project configuration > Build & deploy > Link repository**.
2. Escolha **GitHub** > `mayararayne/Diego-Mayara` e o branch `ccr-d3b7acd9-bit47r`. O Netlify lê o `netlify.toml` sozinho: publica a pasta `site` e as funções de `netlify/functions`.
3. Em **Project configuration > Environment variables**, crie estas três variáveis (escopo: Functions):

| Variável | Valor |
|---|---|
| `RSVP_SCRIPT_URL` | a URL `/exec` do passo 1 |
| `RSVP_TOKEN` | a mesma senha do `TOKEN` do passo 1 |
| `RECADOS_ADMIN_TOKEN` | outra senha, para apagar recados |

4. Faça um novo deploy (**Deploys > Trigger deploy**) para as variáveis valerem. A partir daí, cada envio para o branch atualiza o site sozinho.

Enquanto `RSVP_SCRIPT_URL` não estiver configurada, a confirmação mostra os botões de WhatsApp no lugar da busca. O mural de recados funciona desde o primeiro deploy.

## 3. Apagar um recado do mural

Abra o site com `#admin=` e a senha do `RECADOS_ADMIN_TOKEN` no fim do endereço, por exemplo `https://diegoemayara.netlify.app/#admin=SUA_SENHA`. Cada recado ganha um botão **Apagar recado**. A senha some da barra de endereço e só vale naquela aba.

## 4. Pix dos presentes

O QR code e o "copia e cola" são gerados no próprio site, com o valor de cada cota, a partir da chave em `pix.chave` no `CONFIG`. **Use uma chave aleatória** (no app do banco: Pix > Minhas chaves > Cadastrar chave > Chave aleatória). Nunca use o CPF: qualquer chave vai dentro do QR code e aparece para quem pagar. Enquanto `pix.chave` estiver vazia, o site mostra "o Pix fica pronto em breve".

## 5. Prazo da confirmação

O prazo é `prazo: "2027-03-01"` no `CONFIG` do `site/index.html` e `PRAZO_RSVP` em `netlify/lib/planilha.mts`. **Se mudar a data, mude nos dois lugares.** Depois do prazo:
- o site esconde a busca e mostra os botões de WhatsApp da Mayara e do Diego;
- o servidor recusa qualquer confirmação, mesmo que alguém tente enviar por fora do site.

## Arquivos de mídia

O `index.html` procura fotos, vídeos e música em `site/media/`. Os nomes que faltam estão em `docs/midia-faltando.txt`.
