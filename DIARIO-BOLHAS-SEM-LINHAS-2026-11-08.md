# Diário — nomes junto das bolhas

O posicionamento lateral dos nomes criou linhas longas atravessando o gráfico. Esta entrega remove essas ligações e a reserva de espaço lateral. Mantém somente as linhas de referência dos quadrantes e a grade dos eixos.

Os nomes usam posições próximas da própria bolha, com fundo da superfície e duas linhas para empresa/canal. O algoritmo verifica limites do gráfico, outras bolhas e nomes já posicionados; não desloca coordenadas nem altera o tamanho das bolhas. Quando nenhum espaço local comporta o nome, a bolha recebe o identificador numérico da lista de contas, que abre automaticamente. Os números identificam contas, sem representar ranking. Tooltip também informa esse identificador.

Faturamento, margens, unidades, quadrantes, cores e acesso ao Panorama permanecem iguais. Densidade do canvas e ampliação são preservadas. A margem percentual volta a ter o título no eixo vertical.

Validação: 583 testes passam. Três regressões cobrem colisões, limites, proximidade do nome, identificação de todo o aglomerado, tela estreita e imutabilidade das coordenadas. Sete scripts inline compilam; integração idempotente. Frontend real com dados sintéticos conferido em ampliação e largura de 620px, com 14 contas identificadas.

Reversão: reverter esta entrega e regenerar o HTML pelo integrador, preservando os blocos de dados locais.
