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
];

const getSalarioMinimo = (date: Date): number => {
  for (const record of HISTORICO_SALARIO_MINIMO) {
    if (date >= new Date(record.date)) {
      return record.value;
    }
  }
  return 1302.00;
};

const calcularINSS = (baseCalculo: number) => {
  if (baseCalculo <= 0) return 0;
  
  // Teto INSS conforme imagem (Faixa 4)
  const teto = 8475.55;
  const base = Math.min(baseCalculo, teto); 
  
  let desconto = 0;
  
  // Faixas Progressivas conforme imagem enviada
  const f1 = 1621.00; 
  const f2 = 2902.84; 
  const f3 = 4354.27; 

  if (base <= f1) {
    desconto = base * 0.075;
  } else if (base <= f2) {
    desconto = (f1 * 0.075) + ((base - f1) * 0.09);
  } else if (base <= f3) {
    desconto = (f1 * 0.075) + ((f2 - f1) * 0.09) + ((base - f2) * 0.12);
  } else {
    desconto = (f1 * 0.075) + ((f2 - f1) * 0.09) + ((f3 - f2) * 0.12) + ((base - f3) * 0.14);
  }
  
  return Math.round(desconto * 100) / 100;
};

const calcularIRRF = (baseCalculo: number) => {
  if (baseCalculo <= 0) return 0;

  const aplicarTabelaIRRF = (base: number) => {
    if (base <= 2259.20) return 0;
    if (base <= 2826.65) return (base * 0.075) - 169.44;
    if (base <= 3751.05) return (base * 0.15) - 381.44;
    if (base <= 4664.68) return (base * 0.225) - 662.77;
    return (base * 0.275) - 896.00;
  };

  const impostoPadrao = aplicarTabelaIRRF(baseCalculo);
  const impostoSimplificado = aplicarTabelaIRRF(Math.max(0, baseCalculo - 564.80));

  return Math.max(0, Math.round(Math.min(impostoPadrao, impostoSimplificado) * 100) / 100);
};

// --- COMPONENTES ---

const FormInput = ({ label, type = "text", className = "", options, ...props }: any) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{label}</label>
    {options ? (
      <div className="relative">
        <select 
          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-700 text-sm font-medium"
          {...props}
        >
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
          <span className="material-icons-round text-lg">expand_more</span>
        </div>
      </div>
    ) : (
      <input 
        type={type}
        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder-slate-400 text-sm font-medium"
        {...props}
      />
    )}
  </div>
);

const ResultCard = ({ title, value, subtext, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-5 rounded-2xl border ${highlight ? 'border-indigo-100 ring-2 ring-indigo-500/20 shadow-indigo-100 shadow-xl' : 'border-slate-100 shadow-sm'} ${onClick ? 'cursor-pointer hover:border-indigo-300 transition-all' : ''}`}>
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</div>
    <div className={`text-2xl font-black ${highlight ? 'text-indigo-600' : 'text-slate-800'} font-mono`}>{value}</div>
    {subtext && <div className="text-[10px] text-slate-400 mt-1 font-bold">{subtext}</div>}
  </div>
);

const LineItem = ({ label, value, subtext, type = 'neutral' }: { label: string, value: number, subtext?: string, type?: 'plus'|'minus'|'neutral' }) => {
    if (Math.abs(value) < 0.01) return null;
    return (
        <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-lg">
            <div>
              <div className="text-sm font-bold text-slate-700">{label}</div>
              {subtext && <div className="text-[10px] text-slate-400 font-bold">{subtext}</div>}
            </div>
            <span className={`text-sm font-mono font-black ${type === 'plus' ? 'text-slate-900' : type === 'minus' ? 'text-rose-600' : 'text-slate-700'}`}>
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
          <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 no-print">
              <div className="w-full max-w-[210mm] mb-6 flex gap-4">
                  <button onClick={() => setShowPrintPreview(false)} className="bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm hover:bg-slate-50 transition-all"> <span className="material-icons-round">arrow_back</span> Voltar </button>
                  <button onClick={() => window.print()} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"> <span className="material-icons-round">print</span> Imprimir Demonstrativo </button>
              </div>
              <div id="print-area-container" className="bg-white w-full max-w-[210mm] min-h-[297mm] p-12 mx-auto text-slate-900 flex flex-col justify-between shadow-2xl relative">
                  <div>
                      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8">
                          <div>
                              <h2 className="text-2xl font-black uppercase tracking-tight">Vírgula Contábil</h2>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Soluções em Gestão de Pessoas</p>
                          </div>
                          <div className="text-right uppercase font-black">
                              <div className="text-base">Demonstrativo de Rescisão</div>
                              <div className="text-[10px] text-slate-400">Emitido em {formatDate(new Date())}</div>
                          </div>
                      </div>

                      <div className="grid grid-cols-4 gap-6 mb-8 text-[11px] bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <div><div className="text-slate-400 font-bold mb-1 uppercase">Admissão</div><div className="font-bold text-sm">{formatDate(parseDate(formData.dataAdmissao))}</div></div>
                        <div><div className="text-slate-400 font-bold mb-1 uppercase">Demissão</div><div className="font-bold text-sm">{formatDate(parseDate(formData.dataDemissao))}</div></div>
                        <div><div className="text-slate-400 font-bold mb-1 uppercase">Aviso</div><div className="font-bold text-sm uppercase">{formData.avisoTipo}</div></div>
                        <div><div className="text-slate-400 font-bold mb-1 uppercase">Remuneração</div><div className="font-bold text-sm">{formatCurrency(Number(formData.salarioBase) + Number(formData.insalubridade))}</div></div>
                      </div>

                      <table className="w-full text-sm mb-8 border-collapse">
                          <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                              <tr><th className="p-3 text-left">Descrição da Rubrica</th><th className="p-3 text-right">Proventos</th><th className="p-3 text-right">Descontos</th></tr>
                          </thead>
                          <tbody className="border-x border-b border-slate-200">
                              <tr className="border-b border-slate-100"> <td className="p-3 font-medium">Saldo de Salário ({calculo.diasTrabalhados} dias)</td> <td className="p-3 text-right font-mono font-bold">{formatCurrency(calculo.saldoSalario)}</td> <td className="p-3"></td> </tr>
                              {calculo.valorAviso > 0 && <tr className="border-b border-slate-100"> <td className="p-3 font-medium">Aviso Prévio Indenizado</td> <td className="p-3 text-right font-mono font-bold">{formatCurrency(calculo.valorAviso)}</td> <td className="p-3"></td> </tr>}
                              <tr className="border-b border-slate-100"> <td className="p-3 font-medium">13º Salário Proporcional ({calculo.avos13}/12)</td> <td className="p-3 text-right font-mono font-bold">{formatCurrency(calculo.valor13)}</td> <td className="p-3"></td> </tr>
                              <tr className="border-b border-slate-100"> <td className="p-3 font-medium">Férias Proporcionais + 1/3 ({calculo.avosFerias}/12)</td> <td className="p-3 text-right font-mono font-bold">{formatCurrency(calculo.valorFeriasProp + calculo.tercoFeriasProp)}</td> <td className="p-3"></td> </tr>
                              {calculo.valorFeriasVencidas > 0 && <tr className="border-b border-slate-100"> <td className="p-3 font-medium">Férias Vencidas + 1/3</td> <td className="p-3 text-right font-mono font-bold">{formatCurrency(calculo.valorFeriasVencidas + calculo.tercoFeriasVencidas)}</td> <td className="p-3"></td> </tr>}
                              <tr className="border-b border-slate-100 text-rose-600 font-bold"> <td className="p-3 uppercase text-[10px]">Encargos Sociais (INSS/IRRF)</td> <td className="p-3"></td> <td className="p-3 text-right font-mono">{formatCurrency(calculo.inss + calculo.irrf)}</td> </tr>
                              {calculo.valorAvisoDesconto > 0 && <tr className="border-b border-slate-100 text-rose-600 font-bold"> <td className="p-3 uppercase text-[10px]">Aviso Prévio Descontado</td> <td className="p-3"></td> <td className="p-3 text-right font-mono">{formatCurrency(calculo.valorAvisoDesconto)}</td> </tr>}
                              {ajustes.map((aj, i) => (
                                <tr key={i} className={`border-b border-slate-100 ${aj.tipo === 'Desconto' ? 'text-rose-600 font-bold' : 'font-bold'}`}>
                                    <td className="p-3">{aj.descricao}</td>
                                    <td className="p-3 text-right font-mono">{aj.tipo === 'Provento' ? formatCurrency(aj.valor) : ''}</td>
                                    <td className="p-3 text-right font-mono">{aj.tipo === 'Desconto' ? formatCurrency(aj.valor) : ''}</td>
                                </tr>
                              ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-black">
                              <tr> <td className="p-4 uppercase text-sm">Líquido de Rescisão a Receber</td> <td colSpan={2} className="p-4 text-right text-xl font-mono text-indigo-600">{formatCurrency(calculo.rescisaoLiquida)}</td> </tr>
                          </tfoot>
                      </table>

                      <div className="border-2 border-slate-900 p-8 rounded-2xl bg-slate-50 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><span className="material-icons-round text-7xl">savings</span></div>
                          <h3 className="text-xs font-black uppercase mb-6 border-b border-slate-200 pb-2 flex items-center gap-2"> <span className="material-icons-round text-sm">info</span> Detalhamento FGTS para Fins Rescisórios</h3>
                          <div className="grid grid-cols-2 gap-x-16 gap-y-4 text-sm">
                              <div className="flex justify-between border-b border-slate-200 pb-1"><span>Saldo Base Informado:</span> <span className="font-mono font-bold">{formatCurrency(calculo.saldoFGTSBase)}</span></div>
                              <div className="flex justify-between border-b border-slate-200 pb-1"><span>FGTS Mês Rescisão + 13º:</span> <span className="font-mono font-bold text-indigo-600">{formatCurrency(calculo.fgtsMesRescisao)}</span></div>
                              <div className="flex justify-between border-b border-slate-800 font-bold pt-2"><span>Total Base p/ Multa:</span> <span className="font-mono">{formatCurrency(calculo.baseMulta)}</span></div>
                              <div className="flex justify-between border-b border-slate-800 font-black text-rose-700 pt-2"><span>Multa Rescisória (40%):</span> <span className="font-mono">{formatCurrency(calculo.multa40)}</span></div>
                              <div className="flex justify-between font-black text-2xl col-span-2 pt-8 text-slate-900"><span>TOTAL DISPONÍVEL (FGTS + MULTA):</span> <span className="font-mono">{formatCurrency(calculo.totalFGTS)}</span></div>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-20 pt-16 border-t border-slate-100 mt-16">
                      <div className="border-t-2 border-slate-900 pt-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Assinatura da Empresa</div>
                      <div className="border-t-2 border-slate-900 pt-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Assinatura do Colaborador</div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 flex justify-center py-8 px-4 font-sans">
      <div className="w-full max-w-6xl">
        <header className="flex justify-between items-center mb-10 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
                    <span className="material-icons-round text-white text-2xl block">account_balance</span>
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 leading-none">Vírgula</h1>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-1">Contábil & Gestão</p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-slate-900 font-black text-xs uppercase tracking-tighter">Simulador de Rescisão v3.0</div>
                <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Cálculo de Verbas e FGTS</div>
            </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-[320px] bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white h-fit sticky top-8">
                <div className="bg-slate-50 p-1.5 rounded-2xl mb-6 flex border border-slate-100">
                    <button onClick={() => setFormData({...formData, motivo: 'dispensa'})} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-wide ${formData.motivo === 'dispensa' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Dispensa</button>
                    <button onClick={() => setFormData({...formData, motivo: 'pedido'})} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-wide ${formData.motivo === 'pedido' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Pedido</button>
                </div>
                
                <div className="space-y-4">
                    <FormInput label="Salário Base" name="salarioBase" type="number" value={formData.salarioBase} onChange={handleInputChange} />
                    <FormInput label="Adic. Insalubridade" name="insalubridade" type="number" value={formData.insalubridade} onChange={handleInputChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="Admissão" name="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={handleInputChange} />
                        <FormInput label="Demissão" name="dataDemissao" type="date" value={formData.dataDemissao} onChange={handleInputChange} />
                    </div>
                    <FormInput label="Aviso Prévio" name="avisoTipo" options={[{value:'trabalhado', label:'Trabalhado'}, {value:'indenizado', label:'Indenizado'}]} value={formData.avisoTipo} onChange={handleInputChange} />
                    <FormInput label="Férias Vencidas" name="feriasVencidasQtd" type="number" value={formData.feriasVencidasQtd} onChange={handleInputChange} />
                </div>

                <div className="mt-8 space-y-3">
                    <button onClick={handleCalcular} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex justify-center items-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"> <span className="material-icons-round">analytics</span> Processar Cálculo </button>
                    <button onClick={() => setShowFGTSModal(true)} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl text-[10px] uppercase tracking-wide border border-slate-100 transition-all flex justify-center items-center gap-2"> <span className="material-icons-round text-base">savings</span> Ajustar Saldo FGTS </button>
                </div>
            </aside>

            <main className="flex-1 space-y-6">
                {!calculo ? (
                    <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] h-[500px] flex flex-col items-center justify-center text-slate-300">
                        <div className="bg-white p-6 rounded-full shadow-inner mb-4">
                            <span className="material-icons-round text-6xl text-slate-100">query_stats</span>
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.3em]">Aguardando Entrada de Dados</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ResultCard title="Líquido de Rescisão" value={formatCurrency(calculo.rescisaoLiquida)} subtext="Valor final a pagar em conta" highlight />
                            <ResultCard title="Saldo FGTS Rescisório" value={formatCurrency(calculo.totalFGTS)} subtext={`Base p/ Multa 40%: ${formatCurrency(calculo.baseMulta)}`} highlight onClick={() => setShowFGTSModal(true)} />
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none"><span className="material-icons-round text-[120px]">description</span></div>
                            <h4 className="text-[11px] font-black uppercase text-indigo-600 mb-6 flex items-center gap-2 tracking-widest"> <span className="material-icons-round text-base">receipt_long</span> Memória de Cálculo das Verbas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                <LineItem label="Saldo de Salário" value={calculo.saldoSalario} subtext={`${calculo.diasTrabalhados} dias trabalhados`} type="plus" />
                                <LineItem label="13º Salário Proporcional" value={calculo.valor13} subtext={`${calculo.avos13}/12 avos`} type="plus" />
                                <LineItem label="Férias Proporcionais + 1/3" value={calculo.valorFeriasProp + calculo.tercoFeriasProp} subtext={`${calculo.avosFerias}/12 avos`} type="plus" />
                                {calculo.valorFeriasVencidas > 0 && <LineItem label="Férias Vencidas + 1/3" value={calculo.valorFeriasVencidas + calculo.tercoFeriasVencidas} type="plus" />}
                                {calculo.valorAviso > 0 && <LineItem label="Aviso Prévio Indenizado" value={calculo.valorAviso} type="plus" />}
                                <div className="md:col-span-2 my-2 border-t border-slate-50"></div>
                                <LineItem label="Dedução INSS / IRRF" value={calculo.inss + calculo.irrf} type="minus" />
                                {calculo.valorAvisoDesconto > 0 && <LineItem label="Aviso Prévio Descontado" value={calculo.valorAvisoDesconto} type="minus" />}
                                {ajustes.map((aj, idx) => <LineItem key={idx} label={aj.descricao} value={aj.valor} type={aj.tipo === 'Provento' ? 'plus' : 'minus'} />)}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.2em] flex items-center gap-2"> <span className="material-icons-round text-base">security</span> Projeção de Saque do FGTS</h4>
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-black border border-indigo-500/30 uppercase tracking-tighter">Fins Rescisórios</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                                <div className="flex justify-between items-center"> <span className="text-[11px] font-bold text-slate-400 uppercase">Saldo em Conta:</span> <span className="text-sm font-mono font-black">{formatCurrency(calculo.saldoFGTSBase)}</span> </div>
                                <div className="flex justify-between items-center"> <span className="text-[11px] font-bold text-slate-400 uppercase">FGTS Mês/13º:</span> <span className="text-sm font-mono font-black text-indigo-400">{formatCurrency(calculo.fgtsMesRescisao)}</span> </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-800"> <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Base p/ Cálculo Multa:</span> <span className="text-sm font-mono font-black">{formatCurrency(calculo.baseMulta)}</span> </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-800"> <span className="text-[11px] font-bold text-rose-400 uppercase">Multa 40%:</span> <span className="text-sm font-mono font-black text-rose-400">{formatCurrency(calculo.multa40)}</span> </div>
                                <div className="sm:col-span-2 pt-6 flex justify-between items-end border-t border-slate-800">
                                    <div className="text-[10px] font-black uppercase text-indigo-300">Total Previsto p/ Saque</div>
                                    <div className="text-3xl font-black font-mono leading-none">{formatCurrency(calculo.totalFGTS)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <button onClick={() => setShowAdjustModal(true)} className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 hover:shadow-lg transition-all flex items-center justify-center gap-2"> <span className="material-icons-round">add_circle_outline</span> Nova Rubrica </button>
                            <button onClick={() => setShowPrintPreview(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-indigo-100 transition-all active:scale-95"> <span className="material-icons-round">picture_as_pdf</span> Gerar Relatório Completo </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
      </div>

      {/* MODAL FGTS */}
      {showFGTSModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in no-print">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl border border-slate-100 overflow-hidden shadow-2xl animate-slide-up">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2"> <span className="material-icons-round text-indigo-600">savings</span> Ajuste de Saldo FGTS</h3>
                    <button onClick={() => setShowFGTSModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><span className="material-icons-round text-2xl">close</span></button>
                </div>
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                        <label className="block text-[10px] font-black text-indigo-600 uppercase mb-2 tracking-widest">Saldo Atual Disponível (Extrato)</label>
                        <div className="flex gap-3">
                            <input type="number" className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={fgtsSaldoManual} onChange={(e) => setFgtsSaldoManual(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                            <button onClick={preencherSalarioMinimo} className="bg-indigo-600 text-white px-4 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">S.M. Automático</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"> <span className="material-icons-round text-sm">history</span> Histórico de Lançamentos Mensais</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {fgtsManualData.map((item, idx) => (
                              <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
                                  <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{item.date}</span>
                                  <input type="number" className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center text-xs text-slate-900 font-mono w-full focus:ring-2 focus:ring-indigo-500 outline-none" value={item.value} onChange={(e) => {
                                      const newData = [...fgtsManualData];
                                      newData[idx].value = Number(e.target.value);
                                      setFgtsManualData(newData);
                                  }} />
                              </div>
                          ))}
                      </div>
                    </div>
                </div>
                <div className="p-6 flex justify-end gap-3 bg-slate-50 border-t border-slate-100">
                    <button onClick={() => setShowFGTSModal(false)} className="px-6 py-3 text-slate-400 text-[10px] font-black uppercase hover:text-slate-600 transition-all">Cancelar</button>
                    <button onClick={() => { handleCalcular(); setShowFGTSModal(false); }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl shadow-indigo-100 transition-all active:scale-95">Confirmar Dados</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL AJUSTES */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm border border-slate-100 overflow-hidden shadow-2xl animate-slide-up">
                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Nova Rubrica Manual</h3>
                    <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><span className="material-icons-round text-xl">close</span></button>
                </div>
                <form onSubmit={addAjuste} className="p-8 space-y-4">
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Descrição</label>
                        <input name="descAjuste" required className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ex: Adiantamento Salarial" />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Valor</label>
                            <input name="valAjuste" type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="0.00" />
                        </div>
                        <div className="w-[120px]">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Tipo</label>
                            <select name="tipoAjuste" className="w-full bg-slate-50 border border-slate-200 px-2 py-3 rounded-xl text-slate-900 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"><option value="Provento">Provento (+)</option><option value="Desconto">Desconto (-)</option></select>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 mt-4 active:scale-95 transition-all">Lançar Verba</button>
                </form>
                <div className="px-8 pb-8">
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                        {ajustes.map((aj, i) => (<div key={i} className="flex justify-between items-center text-[10px] bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="text-slate-900 font-black uppercase tracking-tighter">{aj.descricao}</span><div className="flex gap-4"><span className={aj.tipo === 'Provento' ? 'text-indigo-600 font-black' : 'text-rose-500 font-black'}>{formatCurrency(aj.valor)}</span><button onClick={() => setAjustes(ajustes.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500 transition-colors"><span className="material-icons-round text-sm">cancel</span></button></div></div>))}
                        {ajustes.length === 0 && <div className="text-center text-[9px] text-slate-300 uppercase font-black py-4">Nenhum item lançado</div>}
                    </div>
                    {ajustes.length > 0 && <button onClick={() => { handleCalcular(); setShowAdjustModal(false); }} className="w-full mt-4 text-[9px] text-slate-400 font-black uppercase hover:text-indigo-600 transition-colors">Concluir Lançamentos</button>}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);