import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pedido, produtosPedido, Status, statusPedido, totalPedido, itensPedido } from '../models/pedido';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-list.component.html'
})
export class OrderListComponent {
  @Input() pedidos: Pedido[] = [];
  @Output() criar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<Pedido>();
  @Output() excluir = new EventEmitter<Pedido>();
  @Output() whatsapp = new EventEmitter<Pedido>();
  @Output() statusAlterado = new EventEmitter<{ pedido: Pedido; status: Status }>();

  readonly statusList = statusPedido;
  busca = '';
  filtro = 'Todos';

  get filtrados(): Pedido[] {
    const termo = this.busca.toLowerCase();
    return this.pedidos
      .filter(pedido => (this.filtro === 'Todos' || pedido.status === this.filtro)
        && [pedido.cliente, produtosPedido(pedido), pedido.id].some(valor => valor.toLowerCase().includes(termo)))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  produtos = produtosPedido;
  itens = itensPedido;
  total = totalPedido;

  moeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }
}
