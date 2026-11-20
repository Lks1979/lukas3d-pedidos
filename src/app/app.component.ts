import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Status = 'Recebido'|'Aguardando pagamento'|'Na fila'|'Imprimindo'|'Acabamento'|'Pronto'|'Entregue'|'Cancelado';
type Pagamento = 'Pendente'|'Parcial'|'Pago';
interface Pedido { id: string; cliente: string; whatsapp: string; produto: string; quantidade: number; preco: number; gramas: number; horas: number; custoKg: number; energia: number; outros: number; status: Status; pagamento: Pagamento; prazo: string; observacoes: string; criadoEm: string; }
const KEY='lukas3d_pedidos_v1';
const blank=():Pedido=>({id:'',cliente:'',whatsapp:'',produto:'',quantidade:1,preco:0,gramas:0,horas:0,custoKg:100,energia:0,outros:0,status:'Recebido',pagamento:'Pendente',prazo:'',observacoes:'',criadoEm:''});
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./app.component.html'})
export class AppComponent {
  readonly statusList:Status[]=['Recebido','Aguardando pagamento','Na fila','Imprimindo','Acabamento','Pronto','Entregue','Cancelado'];
  readonly pagamentos:Pagamento[]=['Pendente','Parcial','Pago'];
  pedidos=signal<Pedido[]>(this.load());
  filtro=signal('Todos'); busca=signal(''); modal=signal(false); editando=signal(false); form=blank();
  moeda=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
  total=(p:Pedido)=>p.preco*p.quantidade;
  custo=(p:Pedido)=>((p.gramas/1000)*p.custoKg+p.energia+p.outros)*p.quantidade;
  lucro=(p:Pedido)=>this.total(p)-this.custo(p);
  ativos=computed(()=>this.pedidos().filter(p=>!['Entregue','Cancelado'].includes(p.status)).length);
  imprimindo=computed(()=>this.pedidos().filter(p=>p.status==='Imprimindo').length);
  concluidos=computed(()=>this.pedidos().filter(p=>p.status==='Entregue').length);
  faturamento=computed(()=>this.pedidos().filter(p=>p.pagamento==='Pago'&&p.status!=='Cancelado').reduce((s,p)=>s+this.total(p),0));
  filtrados=computed(()=>this.pedidos().filter(p=>(this.filtro()==='Todos'||p.status===this.filtro())&&[p.cliente,p.produto,p.id].some(v=>v.toLowerCase().includes(this.busca().toLowerCase()))).sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm)));
  private load():Pedido[]{try{return JSON.parse(localStorage.getItem(KEY)||'[]') as Pedido[]}catch{return []}}
  private persist(arr:Pedido[]){this.pedidos.set(arr);localStorage.setItem(KEY,JSON.stringify(arr));}
  novo(){this.form=blank();this.editando.set(false);this.modal.set(true)}
  editar(p:Pedido){this.form={...p};this.editando.set(true);this.modal.set(true)}
  salvar(){if(!this.form.cliente.trim()||!this.form.produto.trim())return; const p={...this.form,quantidade:Math.max(1,Number(this.form.quantidade)||1),preco:Math.max(0,Number(this.form.preco)||0),gramas:Math.max(0,Number(this.form.gramas)||0),horas:Math.max(0,Number(this.form.horas)||0),custoKg:Math.max(0,Number(this.form.custoKg)||0),energia:Math.max(0,Number(this.form.energia)||0),outros:Math.max(0,Number(this.form.outros)||0)};if(!p.id){p.id='PD-'+Date.now().toString(36).toUpperCase();p.criadoEm=new Date().toISOString()}this.persist(this.editando()?this.pedidos().map(x=>x.id===p.id?p:x):[...this.pedidos(),p]);this.modal.set(false)}
  atualizarStatus(p:Pedido,status:string){this.persist(this.pedidos().map(x=>x.id===p.id?{...x,status:status as Status}:x))}
  excluir(p:Pedido){if(confirm('Excluir o pedido de '+p.cliente+'?'))this.persist(this.pedidos().filter(x=>x.id!==p.id))}
  whatsapp(p:Pedido){const numero=p.whatsapp.replace(/\D/g,'');if(!numero){alert('Cadastre o WhatsApp do cliente.');return;}const tel=numero.startsWith('55')?numero:'55'+numero;const mensagem=`Olá, ${p.cliente}! Aqui é da Lukas 3D. Sobre seu pedido ${p.id} (${p.produto}), situação: ${p.status}.`;window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(mensagem),'_blank','noopener')}
  exportar(){const dados=JSON.stringify(this.pedidos(),null,2);const url=URL.createObjectURL(new Blob([dados],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lukas3d-pedidos-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url)}
  importar(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const arr=JSON.parse(String(reader.result));if(!Array.isArray(arr)||!arr.every(x=>x&&typeof x.id==='string'&&typeof x.cliente==='string'&&typeof x.produto==='string'))throw Error('Formato inválido');if(confirm('Substituir os pedidos atuais pelos pedidos do arquivo?'))this.persist(arr)}catch{alert('Arquivo de backup inválido.')}input.value=''};reader.readAsText(file)}
}
