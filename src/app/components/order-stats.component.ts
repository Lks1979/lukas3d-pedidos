import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-order-stats',
  standalone: true,
  template: `
    <section class="stats">
      <article><span>Pedidos em aberto</span><strong>{{ativos}}</strong><small>Aguardando produção ou entrega</small></article>
      <article><span>Imprimindo agora</span><strong>{{imprimindo}}</strong><small>Peças em andamento</small></article>
      <article><span>Entregues</span><strong>{{concluidos}}</strong><small>Pedidos finalizados</small></article>
      <article><span>Recebido (pedidos pagos)</span><strong>{{moeda(faturamento)}}</strong><small>Total de pedidos marcados como pagos</small></article>
    </section>
  `
})
export class OrderStatsComponent {
  @Input() ativos = 0;
  @Input() imprimindo = 0;
  @Input() concluidos = 0;
  @Input() faturamento = 0;

  moeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }
}
