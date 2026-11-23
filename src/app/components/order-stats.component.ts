import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-order-stats',
  standalone: true,
  template: `
    <section class="stats operational">
      <article><span>Pedidos em aberto</span><strong>{{ativos}}</strong><small>Aguardando produção ou entrega</small></article>
      <article><span>Imprimindo agora</span><strong>{{imprimindo}}</strong><small>Peças em andamento</small></article>
      <article><span>Entregues</span><strong>{{concluidos}}</strong><small>Pedidos finalizados</small></article>
    </section>
  `
})
export class OrderStatsComponent {
  @Input() ativos = 0;
  @Input() imprimindo = 0;
  @Input() concluidos = 0;
}
