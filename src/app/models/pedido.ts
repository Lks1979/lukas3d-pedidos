export type Status = 'Recebido' | 'Aguardando pagamento' | 'Na fila' | 'Imprimindo' | 'Acabamento' | 'Pronto' | 'Entregue' | 'Cancelado';
export type Pagamento = 'Pendente' | 'Parcial' | 'Pago';

export interface ItemPedido {
  produto: string;
  quantidade: number;
  preco: number;
}

export interface Pedido {
  id: string;
  cliente: string;
  whatsapp: string;
  produto: string;
  quantidade: number;
  preco: number;
  itens?: ItemPedido[];
  status: Status;
  pagamento: Pagamento;
  prazo: string;
  observacoes: string;
  criadoEm: string;
}

export const statusPedido: Status[] = [
  'Recebido', 'Aguardando pagamento', 'Na fila', 'Imprimindo',
  'Acabamento', 'Pronto', 'Entregue', 'Cancelado'
];

export const pagamentosPedido: Pagamento[] = ['Pendente', 'Parcial', 'Pago'];

export function itensPedido(pedido: Pedido): ItemPedido[] {
  const itens = pedido.itens?.length
    ? pedido.itens
    : [{ produto: pedido.produto, quantidade: pedido.quantidade, preco: pedido.preco }];
  return itens.map(item => ({
    produto: item.produto,
    quantidade: item.quantidade,
    preco: item.preco
  }));
}

export function produtosPedido(pedido: Pedido): string {
  return itensPedido(pedido).map(item => item.produto).filter(Boolean).join(', ');
}

export function totalPedido(pedido: Pedido): number {
  return itensPedido(pedido).reduce((soma, item) => soma + item.preco * item.quantidade, 0);
}

