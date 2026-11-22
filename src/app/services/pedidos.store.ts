import { Injectable, signal } from '@angular/core';
import { Pedido } from '../models/pedido';

const STORAGE_KEY = 'lukas3d_pedidos_v1';

@Injectable({ providedIn: 'root' })
export class PedidosStore {
  readonly pedidos = signal<Pedido[]>(this.carregar());

  adicionar(pedido: Pedido) {
    this.gravar([...this.pedidos(), pedido]);
  }

  atualizar(pedido: Pedido) {
    this.gravar(this.pedidos().map(atual => atual.id === pedido.id ? pedido : atual));
  }

  excluir(id: string) {
    this.gravar(this.pedidos().filter(pedido => pedido.id !== id));
  }

  substituir(pedidos: Pedido[]) {
    this.gravar(pedidos);
  }

  private carregar(): Pedido[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Pedido[];
    } catch {
      return [];
    }
  }

  private gravar(pedidos: Pedido[]) {
    this.pedidos.set(pedidos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
  }
}
