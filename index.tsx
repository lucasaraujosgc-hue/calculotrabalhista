import { useState, useEffect, FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- UTILITÁRIOS ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR');
};

const diffDays = (d1: Date, d2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
};

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Histórico de Salário Mínimo
const HISTORICO_SALARIO_MINIMO = [
  { date: '2026-01-01', value: 1621.00 },
  { date: '2025-01-01', value: 1518.00 },
  { date: '2024-01-01', value: 1412.00 },
  { date: '2023-05-01', value: 1320.00 },
  { date: '2023-01-01', value: 1302.00 },
  { date: '2022-01-01', value: 1212.00 },
  { date: '2021-01-01', value: 1100.00 },
  { date: '2020-02-01', value: 1045.00 },
  { date: '2020-01-01', value: 1039.00 },
  { date: '2019-01-01', value: 998.00 },
];

const getSalarioMinimo = (date: Date): number => {
  for (const record of HISTORICO_SALARIO_MINIMO) {
    if (date >= new Date(record.date)) {
      return record.value;
    }
  }
  return 151.00;
};

const calcularINSS = (baseCalculo: number) => {
  if (baseCalculo <= 0) return 0;
  const base = Math.min(baseCalculo, 8157.41); 
  let desconto = 0;
  const faixa1 = 1621.00; 
  const faixa2 = 2793.88; 
  const faixa3 = 4190.83; 
  if (base <= faixa1) desconto = base * 0.075;
  else if (base <= faixa2) desconto = (faixa1 * 0.075) + ((base - faixa1) * 0.09);
  else if (base <= faixa3) desconto = (faixa1 * 0.075) + ((faixa2 - faixa1) * 0.09) + ((base - faixa2) * 0.12);
  else desconto = (faixa1 * 0.075) + ((faixa2 - faixa1) * 0.09) + ((faixa3 - faixa2) * 0.12) + ((base - faixa3) * 0.14);
  return Math.round(desconto * 100) / 100;
};

const calcularIRRF = (baseCalculo: number) => {
  if (baseCalculo <= 0) return 0;
  let imposto = 0;
  if (baseCalculo <= 2259.20) imposto = 0;
  else if (baseCalculo <= 2826.65) imposto = (baseCalculo * 0.075) - 169.44;
  else if (baseCalculo <= 3751.05) imposto = (baseCalculo * 0.15) - 381.44;
  else if (baseCalculo <= 4664.68) imposto = (baseCalculo * 0.225) - 662.77;
  else imposto = (baseCalculo * 0.275) - 896.00;
  return Math.max(0, Math.round(imposto * 100) / 100);
};

// --- COMPONENTES ---

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="bg-[#0f172a] p-2 rounded-lg border border-[#10b981]/30">
      <span className="material-icons-round text-[#10b981] text-2xl block">account_balance_wallet</span>
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-white text-2xl font-black tracking-tight">Vírgula</span>
      <span className="text-[#10b981] text-[10px] font-black tracking-[0.2em]">CONTÁBIL</span>
    </div>
  </div>
);

const FormInput = ({ label, type = "text", className = "", options, ...props }: any) => (
  <div className={`mb-2 ${className}`}>
    <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
    {options ? (
      <select 
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-[#10b981] outline-none text-slate-200 text-xs appearance-none"
        {...props}
      >
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input 
        type={type}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-[#10b981] outline-none text-slate-200 text-xs"
        {...props}
      />
    )}
  </div>
);

const ResultCard = ({ title, value, subtext, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-slate-900 p-4 rounded-xl border ${highlight ? 'border-[#10b981] ring-1 ring-[#10b981]/30 shadow-lg shadow-[#10b981]/5' : 'border-slate-800'} ${onClick ? 'cursor-pointer hover:bg-slate-800 transition-all' : ''}`}>
    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</div>
    <div className={`text-xl font-black ${highlight ? 'text-[#10b981]' : 'text-slate-100'} font-mono`}>{value}</div>
    {subtext && <div className="text-[9px] text-slate-400 mt-1 font-bold">{subtext}</div>}
  </div>
);

const LineItem = ({ label, value, subtext, type = 'neutral' }: { label: string, value: number, subtext?: string, type?: 'plus'|'minus'|'neutral' }) => {
    if (Math.abs(value) < 0.01) return null;
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0 hover:bg-slate-800/20 px-2 rounded transition-colors">
            <div>
              <div className="text-[11px] font-bold text-slate-300">{label}</div>
              {subtext && <div className="text-[8px] text-slate-500 font-bold">{subtext}</div>}
            </div>
            <span className={`text-[11px] font-mono font-black ${type === 'plus' ? 'text-[#10b981]' : type === 'minus' ? 'text-rose-500' : 'text-slate-400'}`}>
                {type === 'minus' ? '-' : ''} {formatCurrency(value)}
            </span>
        </div>
    );
};

// --- APP ---

function App() {
  const [formData, setFormData] = useState({
    motivo: 'dispensa' as 'dispensa' | 'pedido',
    salarioBase: 1621.00,
    insalubridade: 0,
    dataAdmissao: '2023-12-03',
    dataDemissao: getTodayDateString(),
    avisoTipo: 'trabalhado',
    feriasVencidasQtd: 0,
  });

  const [calculo, setCalculo] = useState<any>(null);
  const [showFGTSModal, setShowFGTSModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  const [fgtsManualData, setFgtsManualData] = useState<{date: string, value: number}[]>([]);
  const [fgtsSaldoManual, setFgtsSaldoManual] = useState<number | ''>('');
  const [ajustes, setAjustes] = useState<{descricao: string, valor: number, tipo: 'Provento' | 'Desconto'}[]>([]);

  const totalAjustesDescontos = ajustes.filter(a => a.tipo === 'Desconto').reduce((acc, c) => acc + c.valor, 0);

  useEffect(() => {
    if (formData.dataAdmissao && formData.dataDemissao) {
      const start = parseDate(formData.dataAdmissao);
      const end = parseDate(formData.dataDemissao);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return;
      const dates: {date: string, value: number}[] = [];
      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      const endDate = new Date(end.getFullYear(), end.getMonth(), 1);
      while (current <= endDate) {
        dates.push({ date: current.toISOString().slice(0, 7), value: 0 });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      setFgtsManualData(prev => dates.map(d => {
          const existing = prev.find(p => p.date === d.date);
          return existing ? existing : d;
      }));
    }
  }, [formData.dataAdmissao, formData.dataDemissao]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const preencherSalarioMinimo = () => {
    const newData = fgtsManualData.map(item => ({
        ...item,
        value: Number((getSalarioMinimo(parseDate(item.date + '-01')) * 0.08).toFixed(2))
    }));
    setFgtsManualData(newData);
    setFgtsSaldoManual('');
  };

  const addAjuste = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const desc = (form.elements.namedItem('descAjuste') as HTMLInputElement).value;
    const val = Number((form.elements.namedItem('valAjuste') as HTMLInputElement).value);
    const tipo = (form.elements.namedItem('tipoAjuste') as HTMLSelectElement).value as 'Provento' | 'Desconto';
    setAjustes([...ajustes, { descricao: desc, valor: val, tipo }]);
    form.reset();
  };

  const handleCalcular = () => {
    const salarioBase = Number(formData.salarioBase);
    const insalubridade = Number(formData.insalubridade);
    const salarioTotal = salarioBase + insalubridade;
    const admissao = parseDate(formData.dataAdmissao);
    const demissao = parseDate(formData.dataDemissao);
    const feriasVencidasQtd = Number(formData.feriasVencidasQtd);
    const isPedidoDemissao = formData.motivo === 'pedido';

    const diasAviso = isPedidoDemissao ? 30 : 30 + Math.min(Math.floor(diffDays(demissao, admissao) / 365) * 3, 60);
    let valorAvisoProvento = 0;
    let valorAvisoDesconto = 0;
    
    if (formData.avisoTipo === 'indenizado') {
        if (isPedidoDemissao) valorAvisoDesconto = salarioTotal;
        else valorAvisoProvento = (salarioTotal / 30) * diasAviso;
    }

    const diasTrabalhados = Math.min(demissao.getDate(), 30);
    const saldoSalario = (salarioTotal / 30) * diasTrabalhados;
    
    const mesesTrabalhados = (demissao.getMonth() - admissao.getMonth()) + 12 * (demissao.getFullYear() - admissao.getFullYear());
    const avos13 = (demissao.getMonth() + (demissao.getDate() >= 15 ? 1 : 0));
    const valor13 = (salarioTotal / 12) * avos13;
    
    const valorFeriasVencidas = feriasVencidasQtd * salarioTotal;
    const tercoFeriasVencidas = valorFeriasVencidas / 3;
    const avosFerias = Math.max(0, mesesTrabalhados % 12);
    const valorFeriasProp = (salarioTotal / 12) * avosFerias;
    const tercoFeriasProp = valorFeriasProp / 3;

    // FGTS Restaurado
    const saldoFGTSBase = fgtsSaldoManual !== '' ? Number(fgtsSaldoManual) : fgtsManualData.reduce((acc, curr) => acc + curr.value, 0);
    const fgtsMesRescisao = saldoSalario * 0.08;
    const fgts13 = valor13 * 0.08;
    const baseMulta = saldoFGTSBase + fgtsMesRescisao + fgts13;
    const multa40 = isPedidoDemissao ? 0 : baseMulta * 0.4;
    const totalFGTS = baseMulta + multa40;

    const inss = calcularINSS(saldoSalario);
    const irrf = calcularIRRF(saldoSalario - inss);
    
    const proventosAjustados = ajustes.filter(a => a.tipo === 'Provento').reduce((acc, c) => acc + c.valor, 0);
    const descontosAjustados = ajustes.filter(a => a.tipo === 'Desconto').reduce((acc, c) => acc + c.valor, 0);

    const totalProventos = saldoSalario + valorAvisoProvento + valor13 + valorFeriasVencidas + tercoFeriasVencidas + valorFeriasProp + tercoFeriasProp + proventosAjustados;
    const totalDescontos = inss + irrf + valorAvisoDesconto + descontosAjustados;

    setCalculo({
        rescisaoLiquida: totalProventos - totalDescontos,
        saldoSalario, diasTrabalhados, inss, irrf,
        valorAviso: valorAvisoProvento, valorAvisoDesconto, diasAviso,
        valor13, avos13, valorFeriasVencidas, tercoFeriasVencidas, feriasVencidasQtd,
        valorFeriasProp, tercoFeriasProp, avosFerias,
        fgtsMesRescisao, baseMulta, multa40, totalFGTS, saldoFGTSBase,
        isPedidoDemissao
    });
  };

  if (showPrintPreview && calculo) {
      return (
          <div className="min-h-screen bg-slate-900 py-6 px-4 no-print flex flex-col items-center">
              <div className="w-full max-w-[210mm] mb-4 flex gap-4">
                  <button onClick={() => setShowPrintPreview(false)} className="bg-slate-800 text-slate-300 px-6 py-2 rounded-xl font-bold flex items-center gap-2 text-xs"> <span className="material-icons-round">arrow_back</span> Voltar </button>
                  <button onClick={() => window.print()} className="flex-1 bg-[#10b981] text-white py-2 rounded-xl font-black flex justify-center items-center gap-2 text-xs"> <span className="material-icons-round">print</span> Imprimir Demonstrativo </button>
              </div>
              <div id="print-area-container" className="bg-white w-full max-w-[210mm] min-h-[297mm] p-10 mx-auto text-slate-900 flex flex-col justify-between shadow-2xl">
                  <div>
                      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 mb-6">
                          <Logo />
                          <div className="text-right uppercase font-black">
                              <div className="text-sm">Demonstrativo de Rescisão</div>
                              <div className="text-[9px] text-slate-500">Emitido em {formatDate(new Date())}</div>
                          </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-6 text-[10px] bg-slate-50 p-4 border border-slate-200">
                        <div><div className="text-slate-400 font-bold mb-1">ADMISSÃO</div><div className="font-bold">{formatDate(parseDate(formData.dataAdmissao))}</div></div>
                        <div><div className="text-slate-400 font-bold mb-1">DEMISSÃO</div><div className="font-bold">{formatDate(parseDate(formData.dataDemissao))}</div></div>
                        <div><div className="text-slate-400 font-bold mb-1">AVISO</div><div className="font-bold uppercase">{formData.avisoTipo}</div></div>
                        <div><div className="text-slate-400 font-bold mb-1">REMUNERAÇÃO</div><div className="font-bold">{formatCurrency(Number(formData.salarioBase) + Number(formData.insalubridade))}</div></div>
                      </div>

                      <table className="w-full text-[11px] mb-6 border-collapse">
                          <thead className="bg-slate-800 text-white uppercase text-[9px]">
                              <tr><th className="p-2 text-left">Descrição da Rubrica</th><th className="p-2 text-right">Proventos</th><th className="p-2 text-right">Descontos</th></tr>
                          </thead>
                          <tbody className="border border-slate-200">
                              <tr className="border-b"> <td className="p-2">Saldo de Salário ({calculo.diasTrabalhados} dias)</td> <td className="p-2 text-right font-mono">{formatCurrency(calculo.saldoSalario)}</td> <td className="p-2"></td> </tr>
                              {calculo.valorAviso > 0 && <tr className="border-b"> <td className="p-2">Aviso Prévio Indenizado</td> <td className="p-2 text-right font-mono">{formatCurrency(calculo.valorAviso)}</td> <td className="p-2"></td> </tr>}
                              <tr className="border-b"> <td className="p-2">13º Salário Proporcional ({calculo.avos13}/12)</td> <td className="p-2 text-right font-mono">{formatCurrency(calculo.valor13)}</td> <td className="p-2"></td> </tr>
                              <tr className="border-b"> <td className="p-2">Férias Proporcionais + 1/3 ({calculo.avosFerias}/12)</td> <td className="p-2 text-right font-mono">{formatCurrency(calculo.valorFeriasProp + calculo.tercoFeriasProp)}</td> <td className="p-2"></td> </tr>
                              {calculo.valorFeriasVencidas > 0 && <tr className="border-b"> <td className="p-2">Férias Vencidas + 1/3</td> <td className="p-2 text-right font-mono">{formatCurrency(calculo.valorFeriasVencidas + calculo.tercoFeriasVencidas)}</td> <td className="p-2"></td> </tr>}
                              <tr className="border-b text-rose-600"> <td className="p-2 font-bold">Encargos (INSS/IRRF)</td> <td className="p-2"></td> <td className="p-2 text-right font-mono">{formatCurrency(calculo.inss + calculo.irrf)}</td> </tr>
                              {calculo.valorAvisoDesconto > 0 && <tr className="border-b text-rose-600"> <td className="p-2">Aviso Prévio Descontado</td> <td className="p-2"></td> <td className="p-2 text-right font-mono">{formatCurrency(calculo.valorAvisoDesconto)}</td> </tr>}
                              {ajustes.map((aj, i) => (
                                <tr key={i} className={`border-b ${aj.tipo === 'Desconto' ? 'text-rose-600' : ''}`}>
                                    <td className="p-2">{aj.descricao}</td>
                                    <td className="p-2 text-right font-mono">{aj.tipo === 'Provento' ? formatCurrency(aj.valor) : ''}</td>
                                    <td className="p-2 text-right font-mono">{aj.tipo === 'Desconto' ? formatCurrency(aj.valor) : ''}</td>
                                </tr>
                              ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-black">
                              <tr> <td className="p-2 uppercase">Líquido de Rescisão a Receber</td> <td colSpan={2} className="p-2 text-right text-lg font-mono">{formatCurrency(calculo.rescisaoLiquida)}</td> </tr>
                          </tfoot>
                      </table>

                      <div className="border-2 border-slate-900 p-6 bg-slate-50">
                          <h3 className="text-[10px] font-black uppercase mb-4 border-b border-slate-300 pb-1">Detalhamento FGTS (Fins Rescisórios)</h3>
                          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[11px]">
                              <div className="flex justify-between border-b border-slate-200"><span>Saldo Base Informado:</span> <span className="font-mono">{formatCurrency(calculo.saldoFGTSBase)}</span></div>
                              <div className="flex justify-between border-b border-slate-200"><span>FGTS Mês de Rescisão:</span> <span className="font-mono">{formatCurrency(calculo.fgtsMesRescisao)}</span></div>
                              <div className="flex justify-between border-b border-slate-800 font-bold"><span>Total Base p/ Multa:</span> <span className="font-mono">{formatCurrency(calculo.baseMulta)}</span></div>
                              <div className="flex justify-between border-b border-slate-800 font-black text-emerald-700"><span>Multa Rescisória (40%):</span> <span className="font-mono">{formatCurrency(calculo.multa40)}</span></div>
                              <div className="flex justify-between font-black text-xl col-span-2 pt-4"><span>SALDO FGTS TOTAL DISPONÍVEL:</span> <span className="font-mono">{formatCurrency(calculo.totalFGTS)}</span></div>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-12 pt-12 border-t mt-12">
                      <div className="border-t-2 border-slate-900 pt-2 text-center text-[10px] font-bold uppercase tracking-widest">Assinatura Empresa</div>
                      <div className="border-t-2 border-slate-900 pt-2 text-center text-[10px] font-bold uppercase tracking-widest">Assinatura Colaborador</div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex justify-center py-6 px-4">
      <div className="w-full max-w-5xl">
        <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <Logo />
            <div className="text-right hidden sm:block">
                <div className="text-white font-black text-sm uppercase">Rescisão Online v2.3</div>
                <div className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Vírgula Contábil • Segurança Garantida</div>
            </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-[320px] bg-slate-900/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm h-fit">
                <div className="flex bg-slate-950 p-1 rounded-xl mb-4 border border-slate-800">
                    <button onClick={() => setFormData({...formData, motivo: 'dispensa'})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase ${formData.motivo === 'dispensa' ? 'bg-[#10b981] text-white shadow-lg' : 'text-slate-500'}`}>Dispensa</button>
                    <button onClick={() => setFormData({...formData, motivo: 'pedido'})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase ${formData.motivo === 'pedido' ? 'bg-[#10b981] text-white shadow-lg' : 'text-slate-500'}`}>Pedido</button>
                </div>
                <div className="grid grid-cols-2 gap-x-3">
                    <FormInput label="Salário Base" name="salarioBase" type="number" value={formData.salarioBase} onChange={handleInputChange} />
                    <FormInput label="Insalubr." name="insalubridade" type="number" value={formData.insalubridade} onChange={handleInputChange} />
                    <FormInput label="Admissão" name="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={handleInputChange} />
                    <FormInput label="Demissão" name="dataDemissao" type="date" value={formData.dataDemissao} onChange={handleInputChange} />
                </div>
                <FormInput label="Aviso Prévio" name="avisoTipo" options={[{value:'trabalhado', label:'Trabalhado'}, {value:'indenizado', label:'Indenizado'}]} value={formData.avisoTipo} onChange={handleInputChange} />
                <FormInput label="Férias Vencidas" name="feriasVencidasQtd" type="number" value={formData.feriasVencidasQtd} onChange={handleInputChange} />
                
                <div className="flex gap-2 mt-4">
                    <button onClick={handleCalcular} className="flex-1 bg-[#10b981] hover:bg-[#10b981]/90 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest flex justify-center items-center gap-2 shadow-lg shadow-[#10b981]/20"><span className="material-icons-round text-lg">sync</span> Calcular</button>
                    <button onClick={() => setShowFGTSModal(true)} className="bg-slate-800 p-3 rounded-xl text-[#10b981] border border-slate-700 hover:bg-slate-700 transition-colors" title="Configurar FGTS"><span className="material-icons-round text-lg">savings</span></button>
                </div>
            </aside>

            <main className="flex-1 space-y-4">
                {!calculo ? (
                    <div className="bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-2xl h-[450px] flex flex-col items-center justify-center text-slate-700">
                        <span className="material-icons-round text-6xl text-slate-800 mb-2">query_stats</span>
                        <div className="text-[10px] font-black uppercase tracking-[0.4em]">Aguardando Parâmetros</div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ResultCard title="Líquido Rescisório" value={formatCurrency(calculo.rescisaoLiquida)} highlight />
                            <ResultCard title="FGTS Total (Saque)" value={formatCurrency(calculo.totalFGTS)} subtext={`Base Multa: ${formatCurrency(calculo.baseMulta)}`} highlight onClick={() => setShowFGTSModal(true)} />
                        </div>

                        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5">
                            <h4 className="text-[10px] font-black uppercase text-[#10b981] mb-4 flex items-center gap-2"> <span className="material-icons-round text-sm">visibility</span> Detalhamento Financeiro</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-1">
                                <LineItem label="Saldo de Salário" value={calculo.saldoSalario} subtext={`${calculo.diasTrabalhados} dias`} type="plus" />
                                <LineItem label="13º Salário Prop." value={calculo.valor13} subtext={`${calculo.avos13}/12 avos`} type="plus" />
                                <LineItem label="Férias Prop. + 1/3" value={calculo.valorFeriasProp + calculo.tercoFeriasProp} subtext={`${calculo.avosFerias}/12 avos`} type="plus" />
                                {calculo.valorFeriasVencidas > 0 && <LineItem label="Férias Vencidas + 1/3" value={calculo.valorFeriasVencidas + calculo.tercoFeriasVencidas} type="plus" />}
                                {calculo.valorAviso > 0 && <LineItem label="Aviso Prévio Indenizado" value={calculo.valorAviso} type="plus" />}
                                <LineItem label="INSS / IRRF" value={calculo.inss + calculo.irrf} type="minus" />
                                {calculo.valorAvisoDesconto > 0 && <LineItem label="Aviso Descontado" value={calculo.valorAvisoDesconto} type="minus" />}
                                {ajustes.map((aj, idx) => <LineItem key={idx} label={aj.descricao} value={aj.valor} type={aj.tipo === 'Provento' ? 'plus' : 'minus'} />)}
                            </div>
                        </div>

                        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"> Detalhamento do FGTS</h4>
                                <span className="text-[8px] text-[#10b981] font-black border border-[#10b981]/30 px-2 py-0.5 rounded uppercase">Fins Rescisórios</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                                <div className="flex justify-between text-[11px]"> <span className="text-slate-500">Saldo Base Informado:</span> <span className="font-mono font-bold">{formatCurrency(calculo.saldoFGTSBase)}</span> </div>
                                <div className="flex justify-between text-[11px]"> <span className="text-slate-500">FGTS Mês Rescisão:</span> <span className="font-mono font-bold text-[#10b981]">{formatCurrency(calculo.fgtsMesRescisao)}</span> </div>
                                <div className="flex justify-between text-[11px] border-t border-slate-800 pt-2"> <span className="text-slate-500">Base p/ Multa 40%:</span> <span className="font-mono font-bold">{formatCurrency(calculo.baseMulta)}</span> </div>
                                <div className="flex justify-between text-[11px] border-t border-slate-800 pt-2"> <span className="text-slate-500">Multa 40%:</span> <span className="font-mono font-bold text-rose-500">{formatCurrency(calculo.multa40)}</span> </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                            <button onClick={() => setShowAdjustModal(true)} className="bg-slate-900 border border-slate-800 text-slate-300 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"> <span className="material-icons-round text-base">add_box</span> Lançar Rubrica </button>
                            <button onClick={() => setShowPrintPreview(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20 transition-all"> <span className="material-icons-round text-base">description</span> Imprimir Demonstrativo </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
      </div>

      {/* MODAL FGTS */}
      {showFGTSModal && (
        <div className="fixed inset-0 bg-[#020617]/90 z-50 flex items-center justify-center p-4 backdrop-blur-md no-print">
            <div className="bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-800 overflow-hidden shadow-2xl animate-slide-up">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">Ajuste de Saldo FGTS</h3>
                    <button onClick={() => setShowFGTSModal(false)} className="text-slate-500 hover:text-white"><span className="material-icons-round text-2xl">close</span></button>
                </div>
                <div className="p-6 bg-slate-950 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-[10px] font-black text-[#10b981] uppercase mb-2">Saldo p/ Fins Rescisórios (Existente em Conta)</label>
                        <div className="flex gap-2">
                            <input type="number" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none" value={fgtsSaldoManual} onChange={(e) => setFgtsSaldoManual(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                            <button onClick={preencherSalarioMinimo} className="bg-slate-800 text-[#10b981] px-4 rounded-xl text-[9px] font-black uppercase border border-slate-700">Auto S.M.</button>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-2 italic">* Utilize o valor do extrato atual para o cálculo da multa de 40%.</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamentos Mensais (8%)</h4>
                      <div className="grid grid-cols-2 gap-3">
                          {fgtsManualData.map((item, idx) => (
                              <div key={idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                                  <span className="text-[9px] font-bold text-slate-500">{item.date}</span>
                                  <input type="number" className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-[10px] text-white w-20" value={item.value} onChange={(e) => {
                                      const newData = [...fgtsManualData];
                                      newData[idx].value = Number(e.target.value);
                                      setFgtsManualData(newData);
                                  }} />
                              </div>
                          ))}
                      </div>
                    </div>
                </div>
                <div className="p-5 flex justify-end gap-3 bg-slate-900 border-t border-slate-800">
                    <button onClick={() => setShowFGTSModal(false)} className="px-6 py-2 text-slate-500 text-[10px] font-black uppercase">Fechar</button>
                    <button onClick={() => { handleCalcular(); setShowFGTSModal(false); }} className="px-8 py-2 bg-[#10b981] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#10b981]/10">Aplicar Saldo</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL AJUSTES */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-[#020617]/90 z-50 flex items-center justify-center p-4 backdrop-blur-md no-print">
            <div className="bg-slate-900 rounded-3xl w-full max-w-sm border border-slate-800 overflow-hidden shadow-2xl animate-slide-up">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-xs font-black text-white uppercase">Novo Lançamento</h3>
                    <button onClick={() => setShowAdjustModal(false)} className="text-slate-500 hover:text-white"><span className="material-icons-round text-xl">close</span></button>
                </div>
                <form onSubmit={addAjuste} className="p-6 space-y-4 bg-slate-950">
                    <input name="descAjuste" required className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-white text-xs outline-none" placeholder="Ex: Adiantamento, Quebra de Caixa..." />
                    <div className="flex gap-2">
                        <input name="valAjuste" type="number" step="0.01" required className="flex-1 bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-white text-xs font-mono outline-none" placeholder="0.00" />
                        <select name="tipoAjuste" className="bg-slate-900 border border-slate-700 px-2 py-3 rounded-xl text-white text-[10px] outline-none"><option value="Provento">Provento (+)</option><option value="Desconto">Desconto (-)</option></select>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/20 transition-all">Inserir Rubrica</button>
                </form>
                <div className="p-5 border-t border-slate-800 bg-slate-900 max-h-40 overflow-y-auto custom-scrollbar">
                    <ul className="space-y-2">
                        {ajustes.map((aj, i) => (<li key={i} className="flex justify-between items-center text-[10px] bg-slate-950 p-2.5 rounded-lg border border-slate-800"><span className="text-slate-400 font-bold uppercase">{aj.descricao}</span><div className="flex gap-3"><span className={aj.tipo === 'Provento' ? 'text-[#10b981] font-black' : 'text-rose-500 font-black'}>{formatCurrency(aj.valor)}</span><button onClick={() => setAjustes(ajustes.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-rose-500">×</button></div></li>))}
                        {ajustes.length === 0 && <li className="text-center text-[9px] text-slate-700 uppercase font-black">Nenhum item lançado</li>}
                    </ul>
                </div>
                <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
                    <button onClick={() => { handleCalcular(); setShowAdjustModal(false); }} className="text-[9px] text-slate-500 uppercase font-black hover:text-white transition-colors">Voltar p/ Painel</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);