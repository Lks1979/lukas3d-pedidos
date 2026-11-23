import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-finance-stats',
  standalone: true,
  template: `
    <section class="finance">
      <div class="finance-heading">
        <div><h2>Painel financeiro</h2><p>Valores de pedidos não cancelados</p></div>
      </div>
      <div class="stats finance-stats">
        <article><span>Total vendido</span><strong>{{moeda(totalVendido)}}</strong><small>Valor total dos pedidos</small></article>
        <article><span>Valores recebidos</span><strong>{{moeda(recebido)}}</strong><small>Pagos e valores informados como parciais</small></article>
        <article><span>Pagamentos pendentes</span><strong>{{pendentes}}</strong><small>Pedido(s) com saldo em aberto</small></article>
        <article><span>Saldo a receber</span><strong>{{moeda(saldoReceber)}}</strong><small>Valores ainda não recebidos</small></article>
      </div>
      @if (parciaisSemValor > 0) {
        <p class="alert warning" role="status">
          {{parciaisSemValor}} pedido(s) com pagamento parcial ainda precisam do valor recebido. Edite esses pedidos para atualizar o saldo.
        </p>
      }
    </section>
  `
})
export class FinanceStatsComponent {
  @Input() totalVendido = 0;
  @Input() recebido = 0;
  @Input() pendentes = 0;
  @Input() saldoReceber = 0;
  @Input() parciaisSemValor = 0;

  moeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }
}
