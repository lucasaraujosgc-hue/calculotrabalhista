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
  { date: '2018-01-01', value: 954.00 },
  { date: '2017-01-01', value: 937.00 },
  { date: '2016-01-01', value: 880.00 },
  { date: '2015-01-01', value: 788.00 },
  { date: '2014-01-01', value: 724.00 },
  { date: '2013-01-01', value: 678.00 },
  { date: '2012-01-01', value: 622.00 },
  { date: '2011-03-01', value: 545.00 },
  { date: '2011-01-01', value: 540.00 },
  { date: '2010-01-01', value: 510.00 },
  { date: '2009-02-01', value: 465.00 },
  { date: '2008-03-01', value: 415.00 },
  { date: '2007-04-01', value: 380.00 },
  { date: '2006-04-01', value: 350.00 },
  { date: '2005-05-01', value: 300.00 },
  { date: '2004-05-01', value: 260.00 },
  { date: '2003-06-01', value: 240.00 },
  { date: '2002-06-01', value: 200.00 },
  { date: '2001-06-01', value: 180.00 },
  { date: '2000-06-01', value: 151.00 },
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
  if (imposto < 0) imposto = 0;
  let reducao = 0;
  if (baseCalculo <= 5000) return 0;
  if (baseCalculo <= 7350) {
      reducao = 978.62 - (0.133145 * baseCalculo);
      if (reducao < 0) reducao = 0;
  }
  const irFinal = Math.max(0, imposto - reducao);
  return Math.round(irFinal * 100) / 100;
};

// --- COMPONENTES ---

const Logo = () => (
  <div className="flex items-center gap-4">
    <div className="bg-[#0f172a] p-3 rounded-2xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
      <span className="material-icons-round text-emerald-500 text-3xl block">account_balance_wallet</span>
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-white text-3xl font-extrabold tracking-tight">Vírgula</span>
      <span className="text-emerald-500 text-sm font-black tracking-[0.2em] mt-1">CONTÁBIL</span>
    </div>
  </div>
);

const FormInput = ({ label, type = "text", className = "", options, ...props }: any) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{label}</label>
    {options ? (
      <div className="relative">
        <select 
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none text-slate-200 text-sm"
          {...props}
        >
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
          <span className="material-icons-round text-lg">expand_more</span>
        </div>
      </div>
    ) : (
      <input 
        type={type}
        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-200 placeholder-slate-500 text-sm"
        {...props}
      />
    )}
  </div>
);

const ResultCard = ({ title, value, subtext, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-slate-900 p-5 rounded-2xl border ${highlight ? 'border-emerald-500 ring-1 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-slate-800'} shadow-sm ${onClick ? 'cursor-pointer hover:border-emerald-500/50' : ''}`}>
    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">{title}</div>
    <div className={`text-2xl font-black ${highlight ? 'text-emerald-400' : 'text-slate-100'} font-mono`}>{value}</div>
    {subtext && <div className="text-[10px] text-slate-400 mt-1 font-semibold">{subtext}</div>}
  </div>
);

const LineItem = ({ label, value, subtext, type = 'neutral' }: any) => {
    if (Math.abs(value) < 0.01) return null;
    return (
        <div className="flex justify-between items-start py-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors px-3 rounded-xl">
            <div>
              <div className="text-sm font-semibold text-slate-300">{label}</div>
              {subtext && <div className="text-[10px] text-slate-500 mt-1 font-bold">{subtext}</div>}
            </div>
            <span className={`text-sm font-mono font-black ${type === 'plus' ? 'text-emerald-400' : type === 'minus' ? 'text-rose-500' : 'text-slate-400'}`}>
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
  const [printSignatures, setPrintSignatures] = useState(true);
  const [shrinkToFit, setShrinkToFit] = useState(false);
  
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

  const updateFgtsValue = (index: number, val: number) => {
    const newData = [...fgtsManualData];
    newData[index].value = val;
    setFgtsManualData(newData);
  };

  const preencherSalarioMinimo = () => {
    const newData = fgtsManualData.map(item => ({
        ...item,
        value: Number((getSalarioMinimo(parseDate(item.date + '-01')) * 0.08).toFixed(2))
    }));
    setFgtsManualData(newData);
    setFgtsSaldoManual('');
  };

  const addAjuste = (e: React.FormEvent) => {
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
    const feriasDobroQtd = Math.floor(feriasVencidasQtd / 2);
    const isPedidoDemissao = formData.motivo === 'pedido';

    let diasAviso = 30;
    if (!isPedidoDemissao) {
        const anosTrabalhados = Math.floor(diffDays(demissao, admissao) / 365.25);
        diasAviso += Math.min(anosTrabalhados * 3, 60);
    }
    let valorAvisoProvento = 0;
    let valorAvisoDesconto = 0;
    const projecaoAviso = new Date(demissao);
    if (!isPedidoDemissao) projecaoAviso.setDate(demissao.getDate() + diasAviso);
    if (formData.avisoTipo === 'indenizado') {
        if (isPedidoDemissao) valorAvisoDesconto = (salarioTotal / 30) * 30;
        else valorAvisoProvento = (salarioTotal / 30) * diasAviso;
    } else {
        if (!isPedidoDemissao) {
            const diasIndenizados = diasAviso - 30;
            if (diasIndenizados > 0) valorAvisoProvento = (salarioTotal / 30) * diasIndenizados;
        }
    }
    let diasTrabalhados = demissao.getDate();
    if (diasTrabalhados === 31) diasTrabalhados = 30; 
    const saldoSalario = (salarioTotal / 30) * diasTrabalhados;

    const calcularAvos13 = (inicio: Date, fim: Date) => {
        let avos = 0;
        let current = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
        if (inicio.getFullYear() === fim.getFullYear()) {
             while(current <= fim) {
                 let diasTrabNoMes = 30;
                 if (current.getMonth() === inicio.getMonth() && current.getFullYear() === inicio.getFullYear()) {
                     diasTrabNoMes = 30 - inicio.getDate() + 1;
                     if (inicio.getDate() === 31) diasTrabNoMes = 0;
                 }
                 if (current.getMonth() === fim.getMonth() && current.getFullYear() === fim.getFullYear()) {
                     diasTrabNoMes = fim.getDate();
                     if (fim.getDate() === 31) diasTrabNoMes = 30;
                 }
                 if (diasTrabNoMes >= 15) avos++;
                 current.setMonth(current.getMonth() + 1);
             }
             return avos;
        } 
        let meses = fim.getMonth();
        if (fim.getDate() >= 15) meses++;
        return meses;
    };
    
    const avos13 = calcularAvos13(admissao, demissao);
    const valor13 = (salarioTotal / 12) * avos13;
    const valorFeriasVencidas = feriasVencidasQtd * salarioTotal;
    const tercoFeriasVencidas = valorFeriasVencidas / 3;
    const valorFeriasDobro = feriasDobroQtd * salarioTotal;
    const tercoFeriasDobro = valorFeriasDobro / 3;

    let inicioPeriodoAquisitivo = new Date(admissao);
    while (new Date(inicioPeriodoAquisitivo.getFullYear() + 1, inicioPeriodoAquisitivo.getMonth(), inicioPeriodoAquisitivo.getDate()) <= demissao) {
        inicioPeriodoAquisitivo.setFullYear(inicioPeriodoAquisitivo.getFullYear() + 1);
    }
    let avosFeriasCalc = 0;
    let dataCursor = new Date(inicioPeriodoAquisitivo);
    while (dataCursor < demissao) {
        let fimMesAquisitivo = new Date(dataCursor);
        fimMesAquisitivo.setMonth(fimMesAquisitivo.getMonth() + 1);
        let limite = fimMesAquisitivo > demissao ? demissao : fimMesAquisitivo;
        if (diffDays(limite, dataCursor) >= 14) avosFeriasCalc++;
        dataCursor.setMonth(dataCursor.getMonth() + 1);
    }
    if (avosFeriasCalc > 12) avosFeriasCalc = 12;
    const valorFeriasProp = (salarioTotal / 12) * avosFeriasCalc;
    const tercoFeriasProp = valorFeriasProp / 3;

    let valor13Indenizado = 0;
    let valorFeriasIndenizado = 0;
    let tercoFeriasIndenizado = 0;
    if (!isPedidoDemissao && formData.avisoTipo === 'indenizado') {
        const avos13ComProjecao = calcularAvos13(admissao, projecaoAviso);
        const diffAvos13 = Math.max(0, avos13ComProjecao - avos13);
        if (diffAvos13 > 0) valor13Indenizado = (salarioTotal / 12) * diffAvos13;
        let avosFeriasProj = 0;
        let cursorProj = new Date(inicioPeriodoAquisitivo);
        while (cursorProj < projecaoAviso) {
            let fimMes = new Date(cursorProj);
            fimMes.setMonth(fimMes.getMonth() + 1);
            let limite = fimMes > projecaoAviso ? projecaoAviso : fimMes;
            if (diffDays(limite, cursorProj) >= 14) avosFeriasProj++;
            cursorProj.setMonth(cursorProj.getMonth() + 1);
        }
        if (avosFeriasProj > 12) avosFeriasProj = 12;
        const diffAvosFerias = Math.max(0, avosFeriasProj - avosFeriasCalc);
        if (diffAvosFerias > 0) {
             valorFeriasIndenizado = (salarioTotal / 12) * diffAvosFerias;
             tercoFeriasIndenizado = valorFeriasIndenizado / 3;
        }
    }

    let saldoFGTSParaMulta = fgtsSaldoManual !== '' ? Number(fgtsSaldoManual) : fgtsManualData.reduce((acc, curr) => acc + curr.value, 0);
    const baseFGTSRescisao = saldoSalario + valor13 + (valorAvisoProvento > 0 ? valorAvisoProvento : 0);
    const fgtsRescisao = baseFGTSRescisao * 0.08;
    const fgtsAvisoIndenizado = valor13Indenizado * 0.08;
    const baseTotalMulta = saldoFGTSParaMulta + fgtsRescisao + fgtsAvisoIndenizado;
    const multa40 = isPedidoDemissao ? 0 : baseTotalMulta * 0.4;
    const totalContaFGTS = isPedidoDemissao ? 0 : (baseTotalMulta + multa40);
    const inssSalario = calcularINSS(saldoSalario);
    const inss13 = calcularINSS(valor13 + valor13Indenizado);
    const descontoINSS = inssSalario + inss13;
    const irrfSalario = calcularIRRF(Math.max(0, saldoSalario - inssSalario));
    const irrf13 = calcularIRRF(Math.max(0, (valor13 + valor13Indenizado) - inss13));
    const totalIRRF = irrfSalario + irrf13;
    const totalAjustesProventos = ajustes.filter(a => a.tipo === 'Provento').reduce((acc, c) => acc + c.valor, 0);
    const totalAjustesDescontosIn = ajustes.filter(a => a.tipo === 'Desconto').reduce((acc, c) => acc + c.valor, 0);
    
    const totalProventos = saldoSalario + valorAvisoProvento + valor13 + valorFeriasVencidas + tercoFeriasVencidas + valorFeriasDobro + tercoFeriasDobro + valorFeriasProp + tercoFeriasProp + valor13Indenizado + valorFeriasIndenizado + tercoFeriasIndenizado + totalAjustesProventos;
    const totalDescontosAutomaticos = descontoINSS + totalIRRF + valorAvisoDesconto + totalAjustesDescontosIn;
    const rescisaoLiquida = totalProventos - totalDescontosAutomaticos;

    setCalculo({
        saldoSalario, diasTrabalhados,
        valorAviso: valorAvisoProvento, valorAvisoDesconto, 
        diasAviso, valor13, avos13,
        valorFeriasVencidas, tercoFeriasVencidas, feriasVencidasQtd,
        valorFeriasDobro, tercoFeriasDobro, feriasDobroQtd,
        valorFeriasProp, tercoFeriasProp, avosFerias: avosFeriasCalc,
        valor13Indenizado, valorFeriasIndenizado, tercoFeriasIndenizado,
        fgtsRescisao, fgtsAvisoIndenizado, multa40, totalContaFGTS, saldoFGTSBase: saldoFGTSParaMulta,
        descontoINSS, totalIRRF, rescisaoLiquida, isPedidoDemissao,
        baseFinsRescisorios: baseTotalMulta
    });
  };

  const togglePrintPreview = () => {
    if (!calculo) handleCalcular();
    setShowPrintPreview(!showPrintPreview);
  };

  if (showPrintPreview && calculo) {
      return (
          <div className="min-h-screen bg-[#020617] flex flex-col items-center py-6 no-print">
              <div className="w-full max-w-6xl mb-6 flex justify-center px-4">
                  <div className="bg-slate-900 px-6 py-4 rounded-3xl shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-6 w-full">
                      <button onClick={() => setShowPrintPreview(false)} className="flex items-center gap-2 text-slate-400 hover:text-emerald-500 font-black text-sm transition-all">
                          <span className="material-icons-round">arrow_back</span> Voltar
                      </button>
                      <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
                      <div className="flex flex-wrap items-center gap-6 flex-grow">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={printSignatures} onChange={e => setPrintSignatures(e.target.checked)} className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-slate-950" />
                              <span className="text-sm font-bold text-slate-300">Incluir assinaturas</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={shrinkToFit} onChange={e => setShrinkToFit(e.target.checked)} className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-slate-950" />
                              <span className="text-sm font-bold text-slate-300">Modo Compacto</span>
                          </label>
                      </div>
                      <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all transform hover:-translate-y-1">
                          <span className="material-icons-round">print</span> Imprimir
                      </button>
                  </div>
              </div>

              <div id="print-area-container" className={`bg-white w-full max-w-[210mm] min-h-[297mm] p-10 shadow-2xl mx-auto relative text-sm text-slate-900 flex flex-col justify-between ${shrinkToFit ? 'print-shrink' : ''}`}>
                    <div className="print-content-wrapper">
                        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-2 mb-4">
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Demonstrativo de Rescisão</h1>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Cálculo Trabalhista ({calculo.isPedidoDemissao ? 'Pedido de Demissão' : 'Dispensa sem Justa Causa'})</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Data do Cálculo</div>
                                <div className="font-mono font-bold text-xs text-slate-800">{formatDate(new Date())}</div>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 grid grid-cols-4 gap-4 text-[11px]">
                            <div><div className="font-bold text-slate-400 uppercase mb-1">Admissão</div><div className="font-mono font-bold text-sm">{formatDate(parseDate(formData.dataAdmissao))}</div></div>
                            <div><div className="font-bold text-slate-400 uppercase mb-1">Demissão</div><div className="font-mono font-bold text-sm">{formatDate(parseDate(formData.dataDemissao))}</div></div>
                            <div><div className="font-bold text-slate-400 uppercase mb-1">Aviso Prévio</div><div className="font-mono font-bold text-sm uppercase">{formData.avisoTipo}</div></div>
                            <div><div className="font-bold text-slate-400 uppercase mb-1">Remuneração</div><div className="font-mono font-bold text-sm">{formatCurrency(Number(formData.salarioBase) + Number(formData.insalubridade))}</div></div>
                        </div>

                        <table className="w-full text-sm text-left border-collapse mb-6">
                            <thead className="bg-slate-800 text-white text-[9px] uppercase">
                                <tr>
                                    <th className="py-2 px-3 font-bold border-r border-slate-700">Rubrica</th>
                                    <th className="py-2 px-3 text-center w-20 border-r border-slate-700">Ref.</th>
                                    <th className="py-2 px-3 text-right w-32 border-r border-slate-700">Proventos</th>
                                    <th className="py-2 px-3 text-right w-32">Descontos</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] font-medium text-slate-700">
                                <tr className="border-b border-slate-100"><td className="py-2 px-3">Saldo de Salário</td><td className="py-2 px-3 text-center text-slate-400">{calculo.diasTrabalhados}d</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.saldoSalario)}</td><td className="py-2 px-3"></td></tr>
                                {calculo.valorAviso > 0 && <tr className="border-b border-slate-100"><td className="py-2 px-3">Aviso Prévio Indenizado</td><td className="py-2 px-3 text-center text-slate-400">{calculo.diasAviso}d</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorAviso)}</td><td className="py-2 px-3"></td></tr>}
                                <tr className="border-b border-slate-100"><td className="py-2 px-3">13º Salário Proporcional</td><td className="py-2 px-3 text-center text-slate-400">{calculo.avos13}/12</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valor13)}</td><td className="py-2 px-3"></td></tr>
                                {calculo.valorFeriasVencidas > 0 && (
                                    <>
                                        <tr className="border-b border-slate-100"><td className="py-2 px-3">Férias Vencidas</td><td className="py-2 px-3 text-center text-slate-400">{calculo.feriasVencidasQtd} p.</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorFeriasVencidas)}</td><td className="py-2 px-3"></td></tr>
                                        <tr className="border-b border-slate-100"><td className="py-2 px-3">1/3 Férias Vencidas</td><td className="py-2 px-3 text-center text-slate-400">1/3</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.tercoFeriasVencidas)}</td><td className="py-2 px-3"></td></tr>
                                    </>
                                )}
                                {calculo.valorFeriasDobro > 0 && (
                                    <>
                                        <tr className="border-b border-slate-100 font-bold"><td className="py-2 px-3">Férias em Dobro (Multa)</td><td className="py-2 px-3 text-center text-slate-400">{calculo.feriasDobroQtd} p.</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorFeriasDobro)}</td><td className="py-2 px-3"></td></tr>
                                        <tr className="border-b border-slate-100"><td className="py-2 px-3">1/3 Férias em Dobro</td><td className="py-2 px-3 text-center text-slate-400">1/3</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.tercoFeriasDobro)}</td><td className="py-2 px-3"></td></tr>
                                    </>
                                )}
                                <tr className="border-b border-slate-100"><td className="py-2 px-3">Férias Proporcionais</td><td className="py-2 px-3 text-center text-slate-400">{calculo.avosFerias}/12</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorFeriasProp)}</td><td className="py-2 px-3"></td></tr>
                                <tr className="border-b border-slate-100"><td className="py-2 px-3">1/3 Férias Proporcionais</td><td className="py-2 px-3 text-center text-slate-400">1/3</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.tercoFeriasProp)}</td><td className="py-2 px-3"></td></tr>
                                <tr className="border-b border-slate-100 text-rose-600"><td className="py-2 px-3">INSS</td><td className="py-2 px-3 text-center text-slate-400">Desc.</td><td className="py-2 px-3"></td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.descontoINSS)}</td></tr>
                                {calculo.totalIRRF > 0 && <tr className="border-b border-slate-100 text-rose-600"><td className="py-2 px-3">IRRF</td><td className="py-2 px-3 text-center text-slate-400">Desc.</td><td className="py-2 px-3"></td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.totalIRRF)}</td></tr>}
                                {ajustes.map((aj, i) => (
                                    <tr key={i} className={`border-b border-slate-100 ${aj.tipo === 'Desconto' ? 'text-rose-600' : ''}`}>
                                        <td className="py-2 px-3">{aj.descricao}</td>
                                        <td className="py-2 px-3 text-center text-slate-400">-</td>
                                        <td className="py-2 px-3 text-right font-mono">{aj.tipo === 'Provento' ? formatCurrency(aj.valor) : ''}</td>
                                        <td className="py-2 px-3 text-right font-mono">{aj.tipo === 'Desconto' ? formatCurrency(aj.valor) : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-800">
                                <tr>
                                    <td className="py-3 px-3 font-bold uppercase tracking-tight" colSpan={2}>Resumo Financeiro</td>
                                    <td className="py-3 px-3 text-right font-bold text-sm border-r border-slate-200">{formatCurrency(calculo.rescisaoLiquida + totalAjustesDescontos)}</td>
                                    <td className="py-3 px-3 text-right font-bold text-rose-600 text-sm">{formatCurrency(calculo.descontoINSS + calculo.totalIRRF + calculo.valorAvisoDesconto + totalAjustesDescontos)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="border-2 border-slate-900 p-6 flex justify-between items-center bg-white mt-10">
                            <div>
                                <div className="text-[11px] font-black uppercase text-slate-900 tracking-wider">Líquido Final a Receber</div>
                                <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Soma de todos os direitos contratuais</div>
                            </div>
                            <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                                {formatCurrency(calculo.rescisaoLiquida)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        {printSignatures && (
                            <div className="grid grid-cols-2 gap-20 pt-10">
                                <div className="text-center border-t border-slate-800 pt-2 font-black text-[9px] uppercase tracking-widest">Assinatura do Empregador</div>
                                <div className="text-center border-t border-slate-800 pt-2 font-black text-[9px] uppercase tracking-widest">Assinatura do Empregado</div>
                            </div>
                        )}
                        <div className="mt-10 flex items-center gap-4 border-t border-slate-100 pt-6">
                            <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center font-black text-lg rounded-xl">V</div>
                            <div>
                                <div className="text-xs font-black uppercase text-slate-900 tracking-wider">Vírgula Contábil</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Consultoria e Gestão Trabalhista</div>
                            </div>
                        </div>
                    </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-300">
      <div className="max-w-6xl mx-auto p-4 md:p-8 no-print">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <Logo />
            <div className="text-right">
                <h2 className="text-slate-100 font-black text-xl uppercase tracking-tighter">Calculadora Rescisória</h2>
                <p className="text-xs text-slate-500 font-bold tracking-widest mt-1">SISTEMA DE GESTÃO TRABALHISTA</p>
            </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="w-full lg:w-1/3 bg-slate-900/50 p-8 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-sm sticky top-6">
                <div className="mb-6">
                    <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Situação de Saída</label>
                    <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                        <button onClick={() => setFormData(prev => ({ ...prev, motivo: 'dispensa' }))} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-tight ${formData.motivo === 'dispensa' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}>Dispensa</button>
                        <button onClick={() => setFormData(prev => ({ ...prev, motivo: 'pedido' }))} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-tight ${formData.motivo === 'pedido' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}>Pedido</button>
                    </div>
                </div>
                <FormInput label="Salário Base" name="salarioBase" type="number" value={formData.salarioBase} onChange={handleInputChange} />
                <FormInput label="Insalubridade/Adicionais" name="insalubridade" type="number" value={formData.insalubridade} onChange={handleInputChange} />
                <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Admissão" name="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={handleInputChange} />
                    <FormInput label="Demissão" name="dataDemissao" type="date" value={formData.dataDemissao} onChange={handleInputChange} />
                </div>
                <FormInput label="Férias Vencidas (Períodos)" name="feriasVencidasQtd" type="number" value={formData.feriasVencidasQtd} onChange={handleInputChange} />
                <FormInput label="Aviso Prévio" name="avisoTipo" options={[{ value: 'trabalhado', label: 'Trabalhado' }, { value: 'indenizado', label: 'Indenizado' }]} value={formData.avisoTipo} onChange={handleInputChange} />

                <div className="space-y-3 mt-6">
                    <button onClick={handleCalcular} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-2xl shadow-emerald-900/30 transition-all flex justify-center items-center gap-2 text-sm transform active:scale-[0.98] uppercase tracking-widest"><span className="material-icons-round text-lg">sync</span> Processar Cálculo</button>
                    <button onClick={() => setShowFGTSModal(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-3 rounded-2xl transition-all flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest"><span className="material-icons-round text-base">savings</span> Configurar FGTS</button>
                </div>
            </div>

            <div className="w-full lg:w-2/3">
                {!calculo ? (
                    <div className="bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-800 h-full min-h-[550px] flex flex-col items-center justify-center text-slate-700 animate-pulse">
                        <span className="material-icons-round text-7xl mb-4 text-slate-800">analytics</span>
                        <span className="font-black uppercase tracking-[0.2em] text-sm">Aguardando Parâmetros</span>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ResultCard title="Valor Líquido" value={formatCurrency(calculo.rescisaoLiquida)} subtext="Rescisão pronta para pagamento" highlight />
                            <ResultCard title="FGTS + Multa (40%)" onClick={() => setShowFGTSModal(true)} value={formatCurrency(calculo.totalContaFGTS)} subtext={calculo.isPedidoDemissao ? 'Indisponível p/ saque' : 'Saldo base + acréscimos'} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-2 overflow-hidden flex flex-col h-full shadow-2xl">
                                <div className="px-6 py-5 flex justify-between items-center border-b border-slate-800/50 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500/10 p-2 rounded-lg"><span className="material-icons-round text-emerald-500 text-base block">add_circle</span></div>
                                        <span className="text-xs font-black text-slate-200 uppercase tracking-widest">Proventos</span>
                                    </div>
                                    <button onClick={() => setShowAdjustModal(true)} className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-tighter transition-colors">AJUSTAR</button>
                                </div>
                                <div className="px-2 pb-2">
                                    <LineItem label="Saldo de Salário" value={calculo.saldoSalario} subtext={`${calculo.diasTrabalhados} dias`} type="plus" />
                                    <LineItem label="Aviso Prévio" value={calculo.valorAviso} subtext={calculo.diasAviso > 0 ? `${calculo.diasAviso} dias` : ''} type="plus" />
                                    <LineItem label="13º Salário Prop." value={calculo.valor13} subtext={`${calculo.avos13}/12 avos`} type="plus" />
                                    <LineItem label="Férias Vencidas + 1/3" value={calculo.valorFeriasVencidas + calculo.tercoFeriasVencidas} subtext={`${calculo.feriasVencidasQtd} período(s)`} type="plus" />
                                    <LineItem label="Férias em Dobro + 1/3" value={calculo.valorFeriasDobro + calculo.tercoFeriasDobro} subtext={`${calculo.feriasDobroQtd} multa(s)`} type="plus" />
                                    <LineItem label="Férias Proporcionais" value={calculo.valorFeriasProp + calculo.tercoFeriasProp} subtext={`${calculo.avosFerias}/12 avos`} type="plus" />
                                    {ajustes.filter(a => a.tipo === 'Provento').map((aj, idx) => <LineItem key={idx} label={aj.descricao} value={aj.valor} subtext="Lançamento Manual" type="plus" />)}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-2 overflow-hidden flex flex-col h-full shadow-2xl">
                                <div className="px-6 py-5 flex justify-between items-center border-b border-slate-800/50 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-rose-500/10 p-2 rounded-lg"><span className="material-icons-round text-rose-500 text-base block">remove_circle</span></div>
                                        <span className="text-xs font-black text-slate-200 uppercase tracking-widest">Descontos</span>
                                    </div>
                                </div>
                                <div className="px-2 pb-2">
                                    <LineItem label="INSS" value={calculo.descontoINSS} type="minus" />
                                    <LineItem label="IRRF" value={calculo.totalIRRF} type="minus" />
                                    <LineItem label="Aviso Prévio (Desc)" value={calculo.valorAvisoDesconto} type="minus" />
                                    {ajustes.filter(a => a.tipo === 'Desconto').map((aj, idx) => <LineItem key={idx} label={aj.descricao} value={aj.valor} subtext="Lançamento Manual" type="minus" />)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 pt-10 justify-center">
                             <button onClick={() => setShowAdjustModal(true)} className="text-slate-200 bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:shadow-2xl px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"><span className="material-icons-round text-lg text-emerald-500">post_add</span> Lançar Rubrica</button>
                             <button onClick={togglePrintPreview} className="text-white bg-emerald-600 hover:bg-emerald-500 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-2xl shadow-emerald-900/40"><span className="material-icons-round text-lg">description</span> Gerar Demonstrativo</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* MODAL FGTS */}
      {showFGTSModal && (
        <div className="fixed inset-0 bg-brand-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in no-print">
            <div className="bg-slate-900 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-2xl border border-slate-800 overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Ajuste de Saldo FGTS</h3>
                    <button onClick={() => setShowFGTSModal(false)} className="text-slate-500 hover:text-white transition-colors"><span className="material-icons-round text-3xl">close</span></button>
                </div>
                <div className="p-10 overflow-y-auto max-h-[60vh] custom-scrollbar bg-slate-900">
                    <div className="mb-8 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                        <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">Saldo Base p/ Fins Rescisórios</label>
                        <div className="flex gap-4">
                            <input type="number" className="flex-1 px-5 py-4 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-lg font-mono" value={fgtsSaldoManual} onChange={(e) => setFgtsSaldoManual(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                            <button onClick={preencherSalarioMinimo} className="px-6 bg-slate-800 hover:bg-slate-700 text-emerald-500 rounded-xl font-black text-[10px] uppercase tracking-tighter border border-slate-700">Sugestão S.M.</button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 italic">* Informe o saldo total depositado para cálculo da multa de 40%.</p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extrato de Depósitos por Mês</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {fgtsManualData.map((item, idx) => (
                                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 font-mono">{item.date}</span>
                                    <input 
                                        type="number" 
                                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-white font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                                        value={item.value}
                                        onChange={(e) => updateFgtsValue(idx, Number(e.target.value))}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-8 border-t border-slate-800 bg-slate-900 flex justify-end gap-4">
                    <button onClick={() => setShowFGTSModal(false)} className="px-8 py-3 text-slate-400 font-black uppercase text-xs hover:text-white">Sair</button>
                    <button onClick={() => { handleCalcular(); setShowFGTSModal(false); }} className="px-10 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 font-black uppercase text-xs shadow-xl transition-all transform active:scale-95">Salvar Alterações</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL AJUSTES */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-brand-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-md no-print">
            <div className="bg-slate-900 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md border border-slate-800 overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-slate-800 flex justify-between items-center"><h3 className="text-xl font-black text-white uppercase tracking-tighter">Lançamento Manual</h3><button onClick={() => setShowAdjustModal(false)} className="text-slate-500 hover:text-white transition-colors"><span className="material-icons-round text-3xl">close</span></button></div>
                <form onSubmit={addAjuste} className="p-8 space-y-6">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição</label><input name="descAjuste" required className="w-full bg-slate-950 border border-slate-700 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm" placeholder="Ex: Adiantamento..." /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor</label><input name="valAjuste" type="number" step="0.01" required className="w-full bg-slate-950 border border-slate-700 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm font-mono" placeholder="0.00" /></div>
                        <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tipo</label><select name="tipoAjuste" className="w-full bg-slate-950 border border-slate-700 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm"><option value="Provento">Provento (+)</option><option value="Desconto">Desconto (-)</option></select></div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all">Inserir Rubrica</button>
                </form>
                <div className="px-8 pb-8">
                    <h4 className="font-black text-[10px] uppercase text-slate-500 mb-4 tracking-widest">Itens Lançados</h4>
                    {ajustes.length === 0 ? <div className="text-[10px] text-slate-600 font-bold uppercase text-center py-6 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">Nenhum lançamento</div> : (
                        <ul className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {ajustes.map((aj, i) => (<li key={i} className="flex justify-between items-center text-xs bg-slate-950 p-4 rounded-xl border border-slate-800"><span className="font-bold text-slate-300 uppercase tracking-tight">{aj.descricao}</span><div className="flex items-center gap-4"><span className={`font-black font-mono ${aj.tipo === 'Provento' ? 'text-emerald-400' : 'text-rose-500'}`}>{aj.tipo === 'Provento' ? '+' : '-'} {formatCurrency(aj.valor)}</span><button onClick={() => setAjustes(ajustes.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-rose-500 transition-colors"><span className="material-icons-round text-sm">delete</span></button></div></li>))}
                        </ul>
                    )}
                    <div className="mt-8 pt-4 border-t border-slate-800"><button onClick={() => { handleCalcular(); setShowAdjustModal(false); }} className="w-full py-4 bg-slate-950 text-slate-400 rounded-xl hover:bg-slate-900 border border-slate-800 font-black uppercase text-xs tracking-widest transition-all">Fechar</button></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}