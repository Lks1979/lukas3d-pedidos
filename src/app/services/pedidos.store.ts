import { Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ItemPedido, Pagamento, Pedido, Status, isPedido, pagamentosPedido, statusPedido } from '../models/pedido';
import { Json } from '../models/database.types';
import { SupabaseService } from './supabase.service';

const LEGACY_STORAGE_KEY = 'lukas3d_pedidos_v1';

@Injectable({ providedIn: 'root' })
export class PedidosStore {
  readonly pedidos = signal<Pedido[]>([]);
  readonly pedidosLegados = signal<Pedido[]>([]);
  readonly carregando = signal(false);
  readonly migracaoPendente = signal(false);
  readonly erro = signal<string | null>(null);
  private generation = 0;
  private userId: string | null = null;
  private channel: RealtimeChannel | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly supabase: SupabaseService) {}

  async carregar(userId: string): Promise<void> {
    this.removerCanal();
    const generation = ++this.generation;
    this.userId = userId;
    this.pedidos.set([]);
    this.pedidosLegados.set([]);
    this.migracaoPendente.set(false);
    this.erro.set(null);
    this.carregando.set(true);

    try {
      const { data, error } = await this.supabase.client
        .from('pedidos')
        .select('pedido')
        .eq('user_id', userId);
      if (error) throw error;

      const pedidos = data.map(row => lerPedido(row.pedido));
      if (generation !== this.generation) return;
      this.pedidos.set(pedidos);

      const legados = this.lerPedidosLegados();
      this.pedidosLegados.set(legados);
      if (legados.length && !pedidos.length) {
        this.migracaoPendente.set(true);
        await this.substituirRemoto(userId, legados);
        if (generation !== this.generation) return;
        this.pedidos.set(legados);
        this.pedidosLegados.set([]);
        this.migracaoPendente.set(false);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }

      if (generation === this.generation) this.iniciarCanal(userId, generation);
    } finally {
      if (generation === this.generation) this.carregando.set(false);
    }
  }

  limpar(): void {
    this.removerCanal();
    this.generation++;
    this.userId = null;
    this.pedidos.set([]);
    this.pedidosLegados.set([]);
    this.migracaoPendente.set(false);
    this.carregando.set(false);
    this.erro.set(null);
  }

  async adicionar(pedido: Pedido): Promise<void> {
    const userId = this.usuarioAtual();
    const { error } = await this.supabase.client.from('pedidos').upsert({
      user_id: userId,
      id: pedido.id,
      pedido: serializarPedido(pedido)
    }, { onConflict: 'user_id,id' });
    if (error) throw error;
    if (this.userId === userId) this.pedidos.update(pedidos => [...pedidos, pedido]);
  }

  async atualizar(pedido: Pedido): Promise<void> {
    const userId = this.usuarioAtual();
    const { error } = await this.supabase.client.from('pedidos').upsert({
      user_id: userId,
      id: pedido.id,
      pedido: serializarPedido(pedido)
    }, { onConflict: 'user_id,id' });
    if (error) throw error;
    if (this.userId === userId) {
      this.pedidos.update(pedidos => pedidos.map(atual => atual.id === pedido.id ? pedido : atual));
    }
  }

  async excluir(id: string): Promise<void> {
    const userId = this.usuarioAtual();
    const { error } = await this.supabase.client.from('pedidos')
      .delete()
      .eq('user_id', userId)
      .eq('id', id);
    if (error) throw error;
    if (this.userId === userId) this.pedidos.update(pedidos => pedidos.filter(pedido => pedido.id !== id));
  }

  async substituir(pedidos: Pedido[]): Promise<void> {
    const userId = this.usuarioAtual();
    await this.substituirRemoto(userId, pedidos);
    if (this.userId === userId) this.pedidos.set(pedidos);
  }

  private async substituirRemoto(userId: string, pedidos: Pedido[]): Promise<void> {
    const { error } = await this.supabase.client.rpc('substituir_pedidos', {
      p_pedidos: pedidos.map(serializarPedido)
    });
    if (error) throw error;
  }

  private iniciarCanal(userId: string, generation: number): void {
    this.channel = this.supabase.client
      .channel(`pedidos:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedidos',
        filter: `user_id=eq.${userId}`
      }, () => {
        if (generation !== this.generation) return;
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => {
          this.refreshTimer = null;
          void this.atualizarPedidos(userId, generation).catch(error => {
            this.erro.set(`Não foi possível sincronizar os pedidos. ${mensagemErro(error)}`);
          });
        }, 100);
      })
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.erro.set(`A sincronização em tempo real falhou. ${error?.message ?? status}`);
        }
      });
  }

  private async atualizarPedidos(userId: string, generation: number): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('pedidos')
      .select('pedido')
      .eq('user_id', userId);
    if (error) throw error;
    if (generation === this.generation && this.userId === userId) {
      this.pedidos.set(data.map(row => lerPedido(row.pedido)));
      this.erro.set(null);
    }
  }

  private removerCanal(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (!this.channel) return;
    const channel = this.channel;
    this.channel = null;
    void this.supabase.client.removeChannel(channel).then(result => {
      if (result === 'error') this.erro.set('Não foi possível encerrar o canal de sincronização anterior.');
    });
  }

  private usuarioAtual(): string {
    const userId = this.supabase.session()?.user.id;
    if (!userId || userId !== this.userId) {
      throw new Error('Sessão encerrada. Entre novamente para alterar os pedidos.');
    }
    if (this.migracaoPendente()) {
      throw new Error('Conclua ou exporte a migração dos dados locais antes de editar pedidos.');
    }
    return userId;
  }

  private lerPedidosLegados(): Pedido[] {
    const conteudo = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!conteudo) return [];
    const dados: unknown = JSON.parse(conteudo);
    if (!Array.isArray(dados) || !dados.every(isPedido)) {
      throw new Error('Os dados antigos deste navegador estão inválidos. Exporte-os antes de continuar.');
    }
    return dados;
  }
}

function mensagemErro(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function lerPedido(value: Json): Pedido {
  if (!isRecord(value)
    || typeof value['id'] !== 'string'
    || typeof value['cliente'] !== 'string'
    || typeof value['whatsapp'] !== 'string'
    || typeof value['produto'] !== 'string'
    || typeof value['quantidade'] !== 'number'
    || typeof value['preco'] !== 'number'
    || typeof value['status'] !== 'string'
    || !statusPedido.includes(value['status'] as Status)
    || typeof value['pagamento'] !== 'string'
    || !pagamentosPedido.includes(value['pagamento'] as Pagamento)
    || typeof value['prazo'] !== 'string'
    || typeof value['observacoes'] !== 'string'
    || typeof value['criadoEm'] !== 'string'
    || (value['valorRecebido'] !== undefined
      && (typeof value['valorRecebido'] !== 'number'
        || !Number.isFinite(value['valorRecebido'])
        || value['valorRecebido'] < 0))) {
    throw new Error('O Supabase retornou um pedido em formato inválido.');
  }

  const itens = value['itens'];
  if (itens !== undefined && (!Array.isArray(itens) || !itens.every(isItemPedido))) {
    throw new Error(`O pedido ${value['id']} contém produtos inválidos.`);
  }
  const itensPedido = Array.isArray(itens) ? itens.map(lerItemPedido) : undefined;

  return {
    id: value['id'],
    cliente: value['cliente'],
    whatsapp: value['whatsapp'],
    produto: value['produto'],
    quantidade: value['quantidade'],
    preco: value['preco'],
    ...(itensPedido ? { itens: itensPedido } : {}),
    ...(typeof value['valorRecebido'] === 'number' ? { valorRecebido: value['valorRecebido'] } : {}),
    status: value['status'] as Status,
    pagamento: value['pagamento'] as Pagamento,
    prazo: value['prazo'],
    observacoes: value['observacoes'],
    criadoEm: value['criadoEm']
  };
}

function lerItemPedido(value: Json): ItemPedido {
  if (!isRecord(value)
    || typeof value['produto'] !== 'string'
    || typeof value['quantidade'] !== 'number'
    || typeof value['preco'] !== 'number') {
    throw new Error('O Supabase retornou um produto em formato inválido.');
  }
  return {
    produto: value['produto'],
    quantidade: value['quantidade'],
    preco: value['preco']
  };
}

function isItemPedido(value: Json): boolean {
  return isRecord(value)
    && typeof value['produto'] === 'string'
    && typeof value['quantidade'] === 'number'
    && typeof value['preco'] === 'number';
}

function serializarPedido(pedido: Pedido): Json {
  return {
    id: pedido.id,
    cliente: pedido.cliente,
    whatsapp: pedido.whatsapp,
    produto: pedido.produto,
    quantidade: pedido.quantidade,
    preco: pedido.preco,
    ...(pedido.itens ? {
      itens: pedido.itens.map(item => ({
        produto: item.produto,
        quantidade: item.quantidade,
        preco: item.preco
      }))
    } : {}),
    ...(pedido.valorRecebido === undefined ? {} : { valorRecebido: pedido.valorRecebido }),
    status: pedido.status,
    pagamento: pedido.pagamento,
    prazo: pedido.prazo,
    observacoes: pedido.observacoes,
    criadoEm: pedido.criadoEm
  };
}
