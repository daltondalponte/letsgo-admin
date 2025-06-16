import moment from "moment";

export const makeDocDefinition = (sales: any[]) => {

	const calcularValorTotal = (sale: any) => {
		if (sale?.CuponsAplicados?.length) {
			return sale.payment?.amount * (1 - Number(sale.CuponsAplicados[0].cupom?.descont_percent) / 100)
		}

		return sale.payment.amount as number
	};

	// Calcula o valor total geral somando o valor total de cada venda
	const valorTotalGeral = sales.reduce((total, venda) => total + calcularValorTotal(venda), 0)

	return {
		content: [
			{ text: 'Lista de Vendas', style: 'header' },
			{ text: `Data de Emissão: ${moment().format("LLL")}`, style: 'subheader' },
			{ text: '\n' }, // Adiciona uma quebra de linha
			{
				marginTop: 20,
				marginBottom: -1,
				table: {
					// headers are automatically repeated if the table spans over multiple pages
					// you can declare how many rows should be treated as headers
					headerRows: 1,
					widths: ['*'],

					body: [
						[{ text: `Evento ${sales[0]?.event?.name}`, fontSize: 16, alignment: 'center' }],
					]
				}
			},
			// Loop sobre cada venda para criar a tabela
			{
				table: {
					headerRows: 1,
					widths: ['auto', 'auto', 'auto', 'auto', '*'],
					body: [
						['Descrição do Bilhete', 'Valor do Bilhete', 'Desconto %', 'Cliente', 'Total',],
						...sales.map(sale => [
							sale?.ticket?.description,
							Number(sale?.ticket?.price).toLocaleString("pt-br", { currency: "BRL", style: "currency" }),
							sale?.CuponsAplicados[0]?.cupom ? `${sale.CuponsAplicados[0].cupom?.descont_percent}%` : "Nenhum",
							sale?.user?.email,
							Number(calcularValorTotal(sale)).toLocaleString("pt-br", { currency: "BRL", style: "currency" }),
						])
					]

				}
			},
			{
				marginTop: -1,
				table: {
					// headers are automatically repeated if the table spans over multiple pages
					// you can declare how many rows should be treated as headers
					headerRows: 1,
					widths: ['*'],

					body: [
						[{ text: `Valor Total Geral: ${Number(valorTotalGeral).toLocaleString("pt-br", { currency: "BRL", style: "currency" })}`, alignment: 'right' }],
					]
				}
			},
		],
		styles: {
			header: {
				fontSize: 18,
				bold: true
			}
		}
	}
}
