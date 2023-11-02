## 1. Membros
Daniel Henrique Toledo Santos

## 2. Sobre o sistema

Este é um sistema bem simples de dashboard de gestão de usuários. Porém bem completo implementando funcionalidades como cadastro, gestão de usuários, níveis de permissão, fluxos de recuperação de senha e upload de imagens.

## 3. Tecnologias utilizadas

As tecnologias utilizadas foram Node.js (JavaScript) utilizando o framework Express.js para construção do servidor REST e o conjunto de Mocha (para execução dos testes), SinonJS e proxyquire (para mocking e stubbing) e Chai e sua extensão a promises Chai-as-promised (para asserções), Docker para a containerização, Redis como serviço de cache storage de tokens e MySQL para a persitência dos dados.

## 4. Como executar

Tendo docker e docker compose instalados em sua máquina basta executar o comando ```docker compose up -d``` para executar toda a aplicação e suas dependências de maneira virtualizada.
