import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemPedido, itensPedido, pagamentosPedido, Pedido } from '../models/pedido';

interface FormPedido extends Pedido {
  itens: ItemPedido[];
}

function novoItem(): ItemPedido {
  return { produto: '', quantidade: 1, preco: 0 };
}

function novoFormulario(): FormPedido {
  return {
    id: '', cliente: '', whatsapp: '', produto: '', quantidade: 1, preco: 0, itens: [novoItem()],
    status: 'Recebido', pagamento: 'Pendente', prazo: '', observacoes: '', criadoEm: ''
  };
}

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './order-form.component.html'
})
export class OrderFormComponent implements OnChanges {
  @Input() pedido: Pedido | null = null;
  @Output() salvar = new EventEmitter<Pedido>();
  @Output() cancelar = new EventEmitter<void>();

  readonly pagamentos = pagamentosPedido;
  form = novoFormulario();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pedido']) {
      this.form = this.pedido
        ? {
            id: this.pedido.id,
            cliente: this.pedido.cliente,
            whatsapp: this.pedido.whatsapp,
            produto: this.pedido.produto,
            quantidade: this.pedido.quantidade,
            preco: this.pedido.preco,
            itens: itensPedido(this.pedido),
            status: this.pedido.status,
            pagamento: this.pedido.pagamento,
            prazo: this.pedido.prazo,
            observacoes: this.pedido.observacoes,
            criadoEm: this.pedido.criadoEm
          }
        : novoFormulario();
    }
  }

  adicionarProduto() {
    this.form.itens.push(novoItem());
  }

  removerProduto(indice: number) {
    if (this.form.itens.length > 1) this.form.itens.splice(indice, 1);
  }

  enviar() {
    if (!this.form.cliente.trim() || !this.form.itens.length || this.form.itens.some(item => !item.produto.trim())) return;
    const itens = this.form.itens.map(item => ({
      produto: item.produto.trim(),
      quantidade: Math.max(1, Number(item.quantidade) || 1),
      preco: Math.max(0, Number(item.preco) || 0)
    }));
    this.salvar.emit({
      id: this.form.id,
      cliente: this.form.cliente.trim(),
      whatsapp: this.form.whatsapp,
      ...itens[0],
      itens,
      status: this.form.status,
      pagamento: this.form.pagamento,
      prazo: this.form.prazo,
      observacoes: this.form.observacoes,
      criadoEm: this.form.criadoEm
    });
  }
}
