import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceStatsComponent } from './components/finance-stats.component';
import { OrderFormComponent } from './components/order-form.component';
import { OrderListComponent } from './components/order-list.component';
import { OrderStatsComponent } from './components/order-stats.component';
import { isPedido, Pedido, Status, totalPedido, produtosPedido, saldoReceberPedido, valorRecebidoPedido } from './models/pedido';
import { PedidosStore } from './services/pedidos.store';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, FinanceStatsComponent, OrderFormComponent, OrderListComponent, OrderStatsComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly store = inject(PedidosStore);
  readonly supabase = inject(SupabaseService);
  readonly pedidos = this.store.pedidos;
  readonly pedidoAberto = signal(false);
  readonly pedidoEditando = signal<Pedido | null>(null);
  readonly erro = signal<string | null>(null);
  readonly authErro = signal<string | null>(null);
  readonly mensagemAuth = signal<string | null>(null);
  readonly authBusy = signal(false);
  readonly modoCadastro = signal(false);
  readonly email = signal('');
  readonly senha = signal('');
  private usuarioCarregado: string | null = null;

  readonly ativos = computed(() => this.pedidos().filter(p => !['Entregue', 'Cancelado'].includes(p.status)).length);
  readonly imprimindo = computed(() => this.pedidos().filter(p => p.status === 'Imprimindo').length);
  readonly concluidos = computed(() => this.pedidos().filter(p => p.status === 'Entregue').length);
  readonly totalVendido = computed(() => this.pedidos()
    .filter(pedido => pedido.status !== 'Cancelado')
    .reduce((soma, pedido) => soma + totalPedido(pedido), 0));
  readonly valoresRecebidos = computed(() => this.pedidos()
    .reduce((soma, pedido) => soma + valorRecebidoPedido(pedido), 0));
  readonly pedidosPendentes = computed(() => this.pedidos()
    .filter(pedido => saldoReceberPedido(pedido) > 0).length);
  readonly saldoReceber = computed(() => this.pedidos()
    .reduce((soma, pedido) => soma + saldoReceberPedido(pedido), 0));
  readonly parciaisSemValor = computed(() => this.pedidos()
    .filter(pedido => pedido.status !== 'Cancelado'
      && pedido.pagamento === 'Parcial'
      && pedido.valorRecebido === undefined).length);

  constructor() {
    effect(() => {
      const userId = this.supabase.session()?.user.id ?? null;
      if (userId === this.usuarioCarregado) return;
      this.usuarioCarregado = userId;
      this.erro.set(null);
      if (!userId) {
        this.store.limpar();
        return;
      }
      void this.store.carregar(userId).catch(error => {
        this.erro.set(`Não foi possível carregar os pedidos. ${this.mensagemErro(error)}`);
      });
    });
  }

  async autenticar() {
    this.authErro.set(null);
    this.mensagemAuth.set(null);
    this.authBusy.set(true);
    try {
      if (this.modoCadastro()) {
        const sessaoIniciada = await this.supabase.cadastrar(this.email(), this.senha());
        if (!sessaoIniciada) {
          this.mensagemAuth.set('Conta criada. Verifique seu e-mail para confirmar o cadastro e depois entre.');
          this.modoCadastro.set(false);
        }
      } else {
        await this.supabase.entrar(this.email(), this.senha());
      }
      this.senha.set('');
    } catch (error) {
      this.authErro.set(this.mensagemErro(error));
    } finally {
      this.authBusy.set(false);
    }
  }

  async sair() {
    await this.executarOperacao(() => this.supabase.sair());
    this.senha.set('');
  }

  alternarModoCadastro() {
    this.modoCadastro.update(valor => !valor);
    this.mensagemAuth.set(null);
    this.authErro.set(null);
  }

  novoPedido() {
    if (this.store.carregando() || this.store.migracaoPendente()) return;
    this.pedidoEditando.set(null);
    this.pedidoAberto.set(true);
  }

  editarPedido(pedido: Pedido) {
    if (this.store.carregando() || this.store.migracaoPendente()) return;
    this.pedidoEditando.set(pedido);
    this.pedidoAberto.set(true);
  }

  async salvarPedido(pedido: Pedido) {
    if (!pedido.id) {
      pedido.id = 'PD-' + Date.now().toString(36).toUpperCase();
      pedido.criadoEm = new Date().toISOString();
      if (await this.executarOperacao(() => this.store.adicionar(pedido))) this.fecharFormulario();
    } else if (await this.executarOperacao(() => this.store.editarPedido(pedido))) {
      this.fecharFormulario();
    }
  }

  fecharFormulario() {
    this.pedidoAberto.set(false);
    this.pedidoEditando.set(null);
  }

  async atualizarStatus(pedido: Pedido, status: Status) {
    if (this.store.carregando()) return;
    await this.executarOperacao(() => this.store.atualizar({ ...pedido, status }));
  }

  async excluirPedido(pedido: Pedido) {
    if (!this.store.carregando() && !this.store.migracaoPendente() && confirm('Excluir o pedido de ' + pedido.cliente + '?')) {
      await this.executarOperacao(() => this.store.excluir(pedido.id));
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

  exportar(pedidos: Pedido[] = this.pedidos()) {
    const dados = JSON.stringify(pedidos, null, 2);
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
        if (!Array.isArray(pedidos) || !pedidos.every(isPedido)) {
          throw new Error('Formato inválido');
        }
        if (confirm('Substituir os pedidos atuais pelos pedidos do arquivo?')) {
          void this.executarOperacao(() => this.store.substituir(pedidos));
        }
      } catch {
        alert('Arquivo de backup inválido.');
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  private async executarOperacao(operacao: () => Promise<void>): Promise<boolean> {
    this.erro.set(null);
    try {
      await operacao();
      return true;
    } catch (error) {
      this.erro.set(`Não foi possível salvar as alterações. ${this.mensagemErro(error)}`);
      return false;
    }
  }

  private mensagemErro(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
