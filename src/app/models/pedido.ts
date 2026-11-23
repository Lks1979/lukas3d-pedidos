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

export function isPedido(value: unknown): value is Pedido {
  if (!value || typeof value !== 'object') return false;
  const pedido = value as Partial<Pedido>;
  return typeof pedido.id === 'string'
    && typeof pedido.cliente === 'string'
    && typeof pedido.whatsapp === 'string'
    && typeof pedido.produto === 'string'
    && typeof pedido.quantidade === 'number'
    && typeof pedido.preco === 'number'
    && typeof pedido.status === 'string'
    && statusPedido.includes(pedido.status as Status)
    && typeof pedido.pagamento === 'string'
    && pagamentosPedido.includes(pedido.pagamento as Pagamento)
    && typeof pedido.prazo === 'string'
    && typeof pedido.observacoes === 'string'
    && typeof pedido.criadoEm === 'string'
    && (pedido.itens === undefined || (Array.isArray(pedido.itens) && pedido.itens.every(isItemPedido)));
}

function isItemPedido(value: unknown): value is ItemPedido {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ItemPedido>;
  return typeof item.produto === 'string'
    && typeof item.quantidade === 'number'
    && typeof item.preco === 'number';
}

