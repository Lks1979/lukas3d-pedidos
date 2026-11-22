import { Component, computed, inject, signal } from '@angular/core';
import { OrderFormComponent } from './components/order-form.component';
import { OrderListComponent } from './components/order-list.component';
import { OrderStatsComponent } from './components/order-stats.component';
import { Pedido, Status, totalPedido, produtosPedido } from './models/pedido';
import { PedidosStore } from './services/pedidos.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [OrderFormComponent, OrderListComponent, OrderStatsComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private readonly store = inject(PedidosStore);
  readonly pedidos = this.store.pedidos;
  readonly pedidoAberto = signal(false);
  readonly pedidoEditando = signal<Pedido | null>(null);

  readonly ativos = computed(() => this.pedidos().filter(p => !['Entregue', 'Cancelado'].includes(p.status)).length);
  readonly imprimindo = computed(() => this.pedidos().filter(p => p.status === 'Imprimindo').length);
  readonly concluidos = computed(() => this.pedidos().filter(p => p.status === 'Entregue').length);
  readonly faturamento = computed(() => this.pedidos()
    .filter(p => p.pagamento === 'Pago' && p.status !== 'Cancelado')
    .reduce((soma, pedido) => soma + totalPedido(pedido), 0));

  novoPedido() {
    this.pedidoEditando.set(null);
    this.pedidoAberto.set(true);
  }

  editarPedido(pedido: Pedido) {
    this.pedidoEditando.set(pedido);
    this.pedidoAberto.set(true);
  }

  salvarPedido(pedido: Pedido) {
    if (!pedido.id) {
      pedido.id = 'PD-' + Date.now().toString(36).toUpperCase();
      pedido.criadoEm = new Date().toISOString();
      this.store.adicionar(pedido);
    } else {
      this.store.atualizar(pedido);
    }
    this.fecharFormulario();
  }

  fecharFormulario() {
    this.pedidoAberto.set(false);
    this.pedidoEditando.set(null);
  }

  atualizarStatus(pedido: Pedido, status: Status) {
    this.store.atualizar({ ...pedido, status });
  }

  excluirPedido(pedido: Pedido) {
    if (confirm('Excluir o pedido de ' + pedido.cliente + '?')) {
      this.store.excluir(pedido.id);
    }
  }

  abrirWhatsApp(pedido: Pedido) {
    const numero = pedido.whatsapp.replace(/\D/g, '');
    if (!numero) {
      alert('Cadastre o WhatsApp do cliente.');
      return;
    }
    const telefone = numero.startsWith('55') ? numero : '55' + numero;
    const mensagem = `Olá, ${pedido.cliente}! Aqui é da Lukas 3D. Sobre seu pedido ${pedido.id} (${produtosPedido(pedido)}), situação: ${pedido.status}.`;
    window.open('https://wa.me/' + telefone + '?text=' + encodeURIComponent(mensagem), '_blank', 'noopener');
  }

  exportar() {
    const dados = JSON.stringify(this.pedidos(), null, 2);
    const url = URL.createObjectURL(new Blob([dados], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lukas3d-pedidos-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  importar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const pedidos: unknown = JSON.parse(String(reader.result));
        if (!Array.isArray(pedidos) || !pedidos.every(p =>
          p && typeof p.id === 'string' && typeof p.cliente === 'string' && typeof p.produto === 'string'
        )) {
          throw new Error('Formato inválido');
        }
        if (confirm('Substituir os pedidos atuais pelos pedidos do arquivo?')) {
          this.store.substituir(pedidos as Pedido[]);
        }
      } catch {
        alert('Arquivo de backup inválido.');
      }
      input.value = '';
    };
    reader.readAsText(file);
  }
}
