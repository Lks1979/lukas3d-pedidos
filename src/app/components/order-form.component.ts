import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemPedido, itensPedido, pagamentosPedido, Pedido } from '../models/pedido';

interface FormPedido extends Pedido {
  itens: ItemPedido[];
}

function novoItem(): ItemPedido {
  return { produto: '', quantidade: 1, preco: 0, gramas: 0, horas: 0, custoKg: 100, energia: 0, outros: 0 };
}

function novoFormulario(): FormPedido {
  return {
    id: '', cliente: '', whatsapp: '', ...novoItem(), itens: [novoItem()],
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
        ? { ...this.pedido, itens: itensPedido(this.pedido).map(item => ({ ...item })) }
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
      ...item,
      produto: item.produto.trim(),
      quantidade: Math.max(1, Number(item.quantidade) || 1),
      preco: Math.max(0, Number(item.preco) || 0),
      gramas: Math.max(0, Number(item.gramas) || 0),
      horas: Math.max(0, Number(item.horas) || 0),
      custoKg: Math.max(0, Number(item.custoKg) || 0),
      energia: Math.max(0, Number(item.energia) || 0),
      outros: Math.max(0, Number(item.outros) || 0)
    }));
    this.salvar.emit({ ...this.form, ...itens[0], itens });
  }
}
