import React, { useState, useEffect } from 'react';
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

const calcularINSS = (base: number) => {
  if (base <= 0) return 0;
  const b = Math.min(base, 8157.41);
  if (b <= 1621.00) return b * 0.075;
  if (b <= 2793.88) return (1621 * 0.075) + ((b - 1621) * 0.09);
  if (b <= 4190.83) return (1621 * 0.075) + ((2793.88 - 1621) * 0.09) + ((b - 2793.88) * 0.12);
  return (1621 * 0.075) + ((2793.88 - 1621) * 0.09) + ((4190.83 - 2793.88) * 0.12) + ((b - 4190.83) * 0.14);
};

const calcularIRRF = (base: number) => {
  if (base <= 2259.20) return 0;
  if (base <= 2826.65) return (base * 0.075) - 169.44;
  if (base <= 3751.05) return (base * 0.15) - 381.44;
  if (base <= 4664.68) return (base * 0.225) - 662.77;
  return (base * 0.275) - 896.00;
};

// --- COMPONENTES COMPACTOS ---

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="bg-[#0f172a] p-2 rounded-xl border border-[#10b981]/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
      <span className="material-icons-round text-[#10b981] text-2xl block">account_balance_wallet</span>
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-white text-2xl font-black tracking-tight">Vírgula</span>
      <span className="text-[#10b981] text-[10px] font-black tracking-[0.2em]">CONTÁBIL</span>
    </div>
  </div>
);

const FormInput = ({ label, type = "text", options, ...props }: any) => (
  <div className="mb-2 w-full">
    <label className="block text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">{label}</label>
    {options ? (
      <select className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-[#10b981] text-slate-200 text-xs outline-none appearance-none" {...props}>
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input type={type} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-[#10b981] text-slate-200 text-xs outline-none" {...props} />
    )}
  </div>
);

const ResultCard = ({ title, value, subtext, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-slate-900 p-3 rounded-xl border ${highlight ? 'border-[#10b981] ring-1 ring-[#10b981]/30' : 'border-slate-800'} shadow-sm ${onClick ? 'cursor-pointer hover:bg-slate-800 transition-all' : ''}`}>
    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</div>
    <div className={`text-xl font-black ${highlight ? 'text-[#10b981]' : 'text-slate-100'} font-mono`}>{value}</div>
    {subtext && <div className="text-[8px] text-slate-400 mt-0.5 font-bold">{subtext}</div>}
  </div>
);

const LineItem = ({ label, value, subtext, type = 'neutral' }: any) => {
    if (Math.abs(value) < 0.01) return null;
    return (
        <div className="flex justify-between items-start py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 px-2 rounded-lg transition-colors">
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

// --- APP PRINCIPAL ---

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
  };

  const handleCalcular = () => {
    const salarioTotal = Number(formData.salarioBase) + Number(formData.insalubridade);
    const admissao = parseDate(formData.dataAdmissao);
    const demissao = parseDate(formData.dataDemissao);
    const isPedidoDemissao = formData.motivo === 'pedido';
    
    // Simplificando lógica de cálculo para foco no FGTS detalhado
    const diasAviso = isPedidoDemissao ? 30 : 30 + Math.min(Math.floor(diffDays(demissao, admissao) / 365) * 3, 60);
    const saldoSalario = (salarioTotal / 30) * Math.min(demissao.getDate(), 30);
    
    // FGTS Detalhado
    const saldoFGTSBase = fgtsSaldoManual !== '' ? Number(fgtsSaldoManual) : fgtsManualData.reduce((acc, c) => acc + c.value, 0);
    const fgtsMesRescisao = (saldoSalario) * 0.08;
    const fgtsAvisoIndenizado = (formData.avisoTipo === 'indenizado' && !isPedidoDemissao) ? (salarioTotal / 30 * diasAviso) * 0.08 : 0;
    
    const baseMulta = saldoFGTSBase + fgtsMesRescisao + fgtsAvisoIndenizado;
    const multa40 = isPedidoDemissao ? 0 : baseMulta * 0.4;
    const totalFGTS = baseMulta + multa40;

    // Rescisão simplificada (foco no FGTS e tamanho)
    const valor13 = (salarioTotal / 12) * (demissao.getMonth() + (demissao.getDate() >= 15 ? 1 : 0));
    const feriasProp = (salarioTotal / 12) * (Math.floor(diffDays(demissao, admissao) / 30) % 12);
    
    const proventos = saldoSalario + valor13 + feriasProp + (feriasProp/3);
    const inss = calcularINSS(saldoSalario);
    const irrf = calcularIRRF(saldoSalario - inss);
    
    setCalculo({
        rescisaoLiquida: proventos - inss - irrf,
        saldoSalario, inss, irrf,
        fgtsMesRescisao, fgtsAvisoIndenizado, multa40,
        baseMulta, saldoFGTSBase, totalFGTS,
        isPedidoDemissao, diasAviso,
        rubricas: { saldoSalario, valor13, feriasProp, tercoFerias: feriasProp/3 }
    });
  };

  if (showPrintPreview && calculo) {
      return (
          <div className="min-h-screen bg-slate-900 py-6 px-4 no-print flex flex-col items-center">
              <div className="w-full max-w-[210mm] mb-4 flex gap-4">
                  <button onClick={() => setShowPrintPreview(false)} className="bg-slate-800 text-slate-300 px-6 py-2 rounded-xl font-bold flex items-center gap-2 text-xs"> <span className="material-icons-round">arrow_back</span> Voltar </button>
                  <button onClick={() => window.print()} className="flex-1 bg-[#10b981] text-white py-2 rounded-xl font-black flex justify-center items-center gap-2 text-xs"> <span className="material-icons-round">print</span> Imprimir Demonstrativo </button>
              </div>
              <div id="print-area-container" className="bg-white w-full max-w-[210mm] min-h-[297mm] p-10 shadow-2xl mx-auto relative text-slate-900 flex flex-col justify-between">
                  <div>
                      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 mb-4">
                          <Logo />
                          <div className="text-right uppercase font-black">
                              <div className="text-sm">Demonstrativo de Rescisão</div>
                              <div className="text-[9px] text-slate-500">Cálculo Gerado em {formatDate(new Date())}</div>
                          </div>
                      </div>
                      <table className="w-full text-[10px] mb-6 border-collapse">
                          <thead className="bg-slate-800 text-white uppercase">
                              <tr><th className="p-2 text-left">Rubrica</th><th className="p-2 text-right">Proventos</th><th className="p-2 text-right">Descontos</th></tr>
                          </thead>
                          <tbody className="border border-slate-200">
                              <tr className="border-b"> <td className="p-2">Saldo de Salário</td> <td className="p-2 text-right font-mono">{formatCurrency(calculo.saldoSalario)}</td> <td className="p-2"></td> </tr>
                              <tr className="border-b"> <td className="p-2">INSS / IRRF (Simplificado)</td> <td className="p-2"></td> <td className="p-2 text-right font-mono text-rose-600">{formatCurrency(calculo.inss + calculo.irrf)}</td> </tr>
                          </tbody>
                          <tfoot className="bg-slate-50 font-black">
                              <tr> <td className="p-2 uppercase">Líquido de Rescisão</td> <td colSpan={2} className="p-2 text-right text-base font-mono">{formatCurrency(calculo.rescisaoLiquida)}</td> </tr>
                          </tfoot>
                      </table>

                      <div className="border-2 border-slate-900 p-4 bg-slate-50">
                          <h3 className="text-[10px] font-black uppercase mb-3 border-b border-slate-300 pb-1">Detalhamento FGTS (Fins Rescisórios)</h3>
                          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[10px]">
                              <div className="flex justify-between border-b border-slate-200"><span>Saldo Base Informado:</span> <span className="font-mono">{formatCurrency(calculo.saldoFGTSBase)}</span></div>
                              <div className="flex justify-between border-b border-slate-200"><span>FGTS Mês Rescisão:</span> <span className="font-mono">{formatCurrency(calculo.fgtsMesRescisao)}</span></div>
                              <div className="flex justify-between border-b border-slate-200"><span>FGTS Aviso Indenizado:</span> <span className="font-mono">{formatCurrency(calculo.fgtsAvisoIndenizado)}</span></div>
                              <div className="flex justify-between border-b border-slate-800"><span>Total Base p/ Multa:</span> <span className="font-mono font-black">{formatCurrency(calculo.baseMulta)}</span></div>
                              <div className="flex justify-between border-b border-slate-800 font-black text-emerald-700"><span>Multa Rescisória (40%):</span> <span className="font-mono">{formatCurrency(calculo.multa40)}</span></div>
                              <div className="flex justify-between border-b border-slate-900 font-black text-lg col-span-2 pt-2"><span>SALDO TOTAL PARA SAQUE:</span> <span className="font-mono">{formatCurrency(calculo.totalFGTS)}</span></div>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-10 border-t pt-10 mt-10">
                      <div className="border-t border-slate-900 pt-1 text-center text-[9px] font-bold uppercase">Empresa</div>
                      <div className="border-t border-slate-900 pt-1 text-center text-[9px] font-bold uppercase">Empregado</div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex justify-center py-4 px-2">
      <div className="w-full max-w-5xl">
        <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <Logo />
            <div className="text-right hidden sm:block">
                <div className="text-white font-black text-sm uppercase">Calculadora v2.1</div>
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Painel de Consultoria</div>
            </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-[320px] bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm h-fit">
                <div className="flex bg-slate-950 p-1 rounded-xl mb-4">
                    <button onClick={() => setFormData({...formData, motivo: 'dispensa'})} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase ${formData.motivo === 'dispensa' ? 'bg-[#10b981] text-white shadow-lg' : 'text-slate-500'}`}>Dispensa</button>
                    <button onClick={() => setFormData({...formData, motivo: 'pedido'})} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase ${formData.motivo === 'pedido' ? 'bg-[#10b981] text-white shadow-lg' : 'text-slate-500'}`}>Pedido</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <FormInput label="Salário Base" name="salarioBase" type="number" value={formData.salarioBase} onChange={handleInputChange} />
                    <FormInput label="Adicionais" name="insalubridade" type="number" value={formData.insalubridade} onChange={handleInputChange} />
                    <FormInput label="Admissão" name="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={handleInputChange} />
                    <FormInput label="Demissão" name="dataDemissao" type="date" value={formData.dataDemissao} onChange={handleInputChange} />
                </div>
                <FormInput label="Aviso Prévio" name="avisoTipo" options={[{value:'trabalhado', label:'Trabalhado'}, {value:'indenizado', label:'Indenizado'}]} value={formData.avisoTipo} onChange={handleInputChange} />
                <button onClick={handleCalcular} className="w-full mt-4 bg-[#10b981] hover:bg-[#10b981]/90 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest flex justify-center items-center gap-2"><span className="material-icons-round text-base">sync</span> Calcular</button>
                <button onClick={() => setShowFGTSModal(true)} className="w-full mt-2 bg-slate-800 text-slate-300 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex justify-center items-center gap-2"><span className="material-icons-round text-base">account_balance</span> Ajustar FGTS</button>
            </aside>

            <main className="flex-1 space-y-4">
                {!calculo ? (
                    <div className="bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-2xl h-[400px] flex flex-col items-center justify-center">
                        <span className="material-icons-round text-5xl text-slate-800 mb-2">analytics</span>
                        <div className="text-[10px] font-black uppercase text-slate-700 tracking-[0.3em]">Aguardando Dados</div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ResultCard title="Valor Líquido Rescisão" value={formatCurrency(calculo.rescisaoLiquida)} highlight />
                            <ResultCard title="Saldo FGTS + Multa (40%)" value={formatCurrency(calculo.totalFGTS)} subtext={`Base Multa: ${formatCurrency(calculo.baseMulta)}`} highlight onClick={() => setShowFGTSModal(true)} />
                        </div>

                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
                            <h4 className="text-[10px] font-black uppercase text-[#10b981] mb-3 flex items-center gap-2"> <span className="material-icons-round text-sm">visibility</span> Detalhamento do FGTS</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                                <LineItem label="Saldo Base Informado" value={calculo.saldoFGTSBase} />
                                <LineItem label="FGTS Mês Rescisão" value={calculo.fgtsMesRescisao} type="plus" />
                                <LineItem label="FGTS Aviso Indenizado" value={calculo.fgtsAvisoIndenizado} type="plus" />
                                <div className="border-t border-slate-800 mt-2 pt-1">
                                    <LineItem label="Multa Rescisória (40%)" value={calculo.multa40} type="plus" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <button onClick={() => setShowPrintPreview(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all"> <span className="material-icons-round">description</span> Gerar Demonstrativo Completo </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
      </div>

      {/* MODAL FGTS COMPACTO */}
      {showFGTSModal && (
        <div className="fixed inset-0 bg-brand-dark/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <div className="bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">Ajuste de Saldo FGTS</h3>
                    <button onClick={() => setShowFGTSModal(false)} className="text-slate-500 hover:text-white"><span className="material-icons-round text-2xl">close</span></button>
                </div>
                <div className="p-6 bg-slate-950">
                    <label className="block text-[9px] font-black text-[#10b981] uppercase mb-2">Saldo p/ Fins Rescisórios (Existente no Extrato)</label>
                    <div className="flex gap-2">
                        <input type="number" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none" value={fgtsSaldoManual} onChange={(e) => setFgtsSaldoManual(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                        <button onClick={preencherSalarioMinimo} className="bg-slate-800 text-[#10b981] px-4 rounded-xl text-[9px] font-black uppercase border border-slate-700">Sugestão S.M.</button>
                    </div>
                </div>
                <div className="p-4 flex justify-end gap-3 bg-slate-900">
                    <button onClick={() => setShowFGTSModal(false)} className="px-6 py-2 text-slate-500 text-[10px] font-black uppercase">Cancelar</button>
                    <button onClick={() => { handleCalcular(); setShowFGTSModal(false); }} className="px-8 py-2 bg-[#10b981] text-white rounded-xl text-[10px] font-black uppercase">Salvar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);