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

const FormInput = ({ label, type = "text", className = "", options, ...props }: any) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
    {options ? (
      <div className="relative">
        <select 
          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-700 text-sm"
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
        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder-slate-400 text-sm"
        {...props}
      />
    )}
  </div>
);

const ResultCard = ({ title, value, subtext, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-4 rounded-xl border ${highlight ? 'border-indigo-200 ring-1 ring-indigo-500 shadow-indigo-100' : 'border-slate-100'} shadow-sm ${onClick ? 'cursor-pointer hover:border-indigo-300' : ''}`}>
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</div>
    <div className={`text-2xl font-bold ${highlight ? 'text-indigo-600' : 'text-slate-800'}`}>{value}</div>
    {subtext && <div className="text-xs text-slate-400 mt-1">{subtext}</div>}
  </div>
);

const LineItem = ({ label, value, subtext, type = 'neutral' }: { label: string, value: number, subtext?: string, type?: 'plus'|'minus'|'neutral' }) => {
    if (Math.abs(value) < 0.01) return null;
    return (
        <div className="flex justify-between items-start py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-lg">
            <div>
              <div className="text-sm font-medium text-slate-700">{label}</div>
              {subtext && <div className="text-[10px] text-slate-400 mt-0.5">{subtext}</div>}
            </div>
            <span className={`text-sm font-mono font-bold ${type === 'plus' ? 'text-slate-800' : type === 'minus' ? 'text-rose-600' : 'text-slate-700'}`}>
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
  const [shrinkToFit, setShrinkToFit] = useState(false); // Novo: Opção para reduzir tamanho
  const [signatureText, setSignatureText] = useState('');
  
  // FGTS State
  const [fgtsManualData, setFgtsManualData] = useState<{date: string, value: number}[]>([]);
  const [fgtsSaldoManual, setFgtsSaldoManual] = useState<number | ''>('');

  // Adjustments State
  const [ajustes, setAjustes] = useState<{descricao: string, valor: number, tipo: 'Provento' | 'Desconto'}[]>([]);

  // Derived state for adjustments
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
      setFgtsManualData(prev => {
          return dates.map(d => {
              const existing = prev.find(p => p.date === d.date);
              return existing ? existing : d;
          });
      });
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
    
    // Regra: a cada 2 férias vencidas, paga-se 1 em dobro (multa)
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
    
    // Férias Vencidas Simples (Total de períodos informados)
    const valorFeriasVencidas = feriasVencidasQtd * salarioTotal;
    const tercoFeriasVencidas = valorFeriasVencidas / 3;

    // Férias Vencidas em Dobro (Multa: valor de 1 período para cada 2 vencidos)
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
    
    // Soma total de proventos
    const totalProventos = saldoSalario + valorAvisoProvento + valor13 + valorFeriasVencidas + tercoFeriasVencidas + valorFeriasDobro + tercoFeriasDobro + valorFeriasProp + tercoFeriasProp + valor13Indenizado + valorFeriasIndenizado + tercoFeriasIndenizado + totalAjustesProventos;
    const totalDescontosAutomaticos = descontoINSS + totalIRRF + valorAvisoDesconto + totalAjustesDescontosIn;
    const rescisaoLiquida = totalProventos - totalDescontosAutomaticos;
    const totalGeral = rescisaoLiquida + totalContaFGTS;

    setCalculo({
        saldoSalario, diasTrabalhados,
        valorAviso: valorAvisoProvento, valorAvisoDesconto, 
        diasAviso, valor13, avos13,
        valorFeriasVencidas, tercoFeriasVencidas, feriasVencidasQtd,
        valorFeriasDobro, tercoFeriasDobro, feriasDobroQtd,
        valorFeriasProp, tercoFeriasProp, avosFerias: avosFeriasCalc,
        valor13Indenizado, valorFeriasIndenizado, tercoFeriasIndenizado,
        fgtsRescisao, fgtsAvisoIndenizado, multa40, totalContaFGTS, saldoFGTSBase: saldoFGTSParaMulta,
        descontoINSS, totalIRRF, rescisaoLiquida, totalGeral, isPedidoDemissao,
        baseFinsRescisorios: baseTotalMulta
    });
  };

  const togglePrintPreview = () => {
    if (!calculo) handleCalcular();
    setShowPrintPreview(!showPrintPreview);
  };

  if (showPrintPreview && calculo) {
      return (
          <div className="min-h-screen bg-slate-100 flex flex-col items-center py-6 no-print:bg-slate-100 print:bg-white print:py-0">
              {/* BARRA SUPERIOR */}
              <div className="w-full max-w-6xl mb-6 flex justify-center no-print px-4">
                  <div className="bg-white px-6 py-4 rounded-2xl shadow-lg border border-slate-200 flex flex-col md:flex-row items-center gap-6 w-full">
                      <button onClick={() => setShowPrintPreview(false)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">
                          <span className="material-icons-round">arrow_back</span> Voltar
                      </button>
                      <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                      <div className="flex flex-wrap items-center gap-6 flex-grow">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={printSignatures} onChange={e => setPrintSignatures(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                              <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Incluir assinaturas</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={shrinkToFit} onChange={e => setShrinkToFit(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                              <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Modo Compacto (Ajustar p/ 1 página)</span>
                          </label>
                          {printSignatures && (
                              <input 
                                type="text" 
                                maxLength={100} 
                                value={signatureText} 
                                onChange={e => setSignatureText(e.target.value)} 
                                placeholder="Texto customizado (max 2 linhas)" 
                                className="flex-grow text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-w-[200px]"
                              />
                          )}
                      </div>
                      <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                          <span className="material-icons-round">print</span> Imprimir
                      </button>
                  </div>
              </div>

              {/* AREA DE IMPRESSAO */}
              <div id="print-area-container" className={`bg-white w-full max-w-[210mm] min-h-[297mm] p-10 shadow-2xl mx-auto relative text-sm text-slate-900 flex flex-col justify-between print:shadow-none print:p-8 print:m-0 print:w-full print:h-full ${shrinkToFit ? 'print-shrink' : ''}`}>
                    <div className="print-content-wrapper">
                        {/* Header Demonstrativo */}
                        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-2 mb-4">
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Demonstrativo de Valores</h1>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Cálculo Rescisório Trabalhista ({calculo.isPedidoDemissao ? 'Pedido de Demissão' : 'Dispensa sem Justa Causa'})</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Data do Cálculo</div>
                                <div className="font-mono font-bold text-xs text-slate-800">{formatDate(new Date())}</div>
                            </div>
                        </div>

                        {/* Info Boxes */}
                        <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4 grid grid-cols-4 gap-4 text-[11px] print:bg-transparent print:border-slate-300">
                            <div><div className="font-bold text-slate-400 uppercase mb-1 tracking-wider">Admissão</div><div className="font-mono font-bold text-sm text-slate-900">{formatDate(parseDate(formData.dataAdmissao))}</div></div>
                            <div><div className="font-bold text-slate-400 uppercase mb-1 tracking-wider">Demissão</div><div className="font-mono font-bold text-sm text-slate-900">{formatDate(parseDate(formData.dataDemissao))}</div></div>
                            <div><div className="font-bold text-slate-400 uppercase mb-1 tracking-wider">Aviso Prévio</div><div className="font-mono font-bold text-sm text-slate-900 uppercase">{formData.avisoTipo}</div></div>
                            <div><div className="font-bold text-slate-400 uppercase mb-1 tracking-wider">Remuneração</div><div className="font-mono font-bold text-sm text-slate-900">{formatCurrency(Number(formData.salarioBase) + Number(formData.insalubridade))}</div></div>
                        </div>

                        {/* Texto Customizado acima da tabela */}
                        {printSignatures && signatureText && (
                            <div className="mb-4 text-xs italic text-slate-600 bg-slate-50 p-2 border-l-4 border-indigo-400 leading-relaxed whitespace-pre-line">
                                {signatureText}
                            </div>
                        )}

                        {/* Tabela de Verbas */}
                        <table className="w-full text-sm text-left border-collapse mb-6">
                            <thead className="bg-slate-800 text-white text-[9px] uppercase tracking-wider">
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
                                {calculo.valor13Indenizado > 0 && <tr className="border-b border-slate-100"><td className="py-2 px-3">13º s/ Aviso Indenizado</td><td className="py-2 px-3 text-center text-slate-400">-</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valor13Indenizado)}</td><td className="py-2 px-3"></td></tr>}
                                
                                {/* Férias Vencidas Simples */}
                                {calculo.valorFeriasVencidas > 0 && (
                                    <>
                                        <tr className="border-b border-slate-100"><td className="py-2 px-3">Férias Vencidas</td><td className="py-2 px-3 text-center text-slate-400">{calculo.feriasVencidasQtd} p.</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorFeriasVencidas)}</td><td className="py-2 px-3"></td></tr>
                                        <tr className="border-b border-slate-100"><td className="py-2 px-3">1/3 Férias Vencidas</td><td className="py-2 px-3 text-center text-slate-400">1/3</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.tercoFeriasVencidas)}</td><td className="py-2 px-3"></td></tr>
                                    </>
                                )}

                                {/* Férias Vencidas em Dobro */}
                                {calculo.valorFeriasDobro > 0 && (
                                    <>
                                        <tr className="border-b border-slate-100 font-bold"><td className="py-2 px-3">Férias em Dobro (Multa)</td><td className="py-2 px-3 text-center text-slate-400">{calculo.feriasDobroQtd} p.</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorFeriasDobro)}</td><td className="py-2 px-3"></td></tr>
                                        <tr className="border-b border-slate-100"><td className="py-2 px-3">1/3 Férias em Dobro</td><td className="py-2 px-3 text-center text-slate-400">1/3</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.tercoFeriasDobro)}</td><td className="py-2 px-3"></td></tr>
                                    </>
                                )}

                                <tr className="border-b border-slate-100"><td className="py-2 px-3">Férias Proporcionais</td><td className="py-2 px-3 text-center text-slate-400">{calculo.avosFerias}/12</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorFeriasProp)}</td><td className="py-2 px-3"></td></tr>
                                <tr className="border-b border-slate-100"><td className="py-2 px-3">1/3 Férias Proporcionais</td><td className="py-2 px-3 text-center text-slate-400">1/3</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.tercoFeriasProp)}</td><td className="py-2 px-3"></td></tr>
                                {ajustes.filter(a => a.tipo === 'Provento').map((aj, i) => (
                                    <tr key={`p-${i}`} className="border-b border-slate-100"><td className="py-2 px-3">{aj.descricao}</td><td className="py-2 px-3 text-center text-slate-400">-</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(aj.valor)}</td><td className="py-2 px-3"></td></tr>
                                ))}
                                <tr className="border-b border-slate-100 text-rose-600"><td className="py-2 px-3">INSS</td><td className="py-2 px-3 text-center text-slate-400">Desc.</td><td className="py-2 px-3"></td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.descontoINSS)}</td></tr>
                                {calculo.totalIRRF > 0 && <tr className="border-b border-slate-100 text-rose-600"><td className="py-2 px-3">IRRF</td><td className="py-2 px-3 text-center text-slate-400">Desc.</td><td className="py-2 px-3"></td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.totalIRRF)}</td></tr>}
                                {calculo.valorAvisoDesconto > 0 && <tr className="border-b border-slate-100 text-rose-600"><td className="py-2 px-3">Aviso Prévio (Desc)</td><td className="py-2 px-3 text-center text-slate-400">30d</td><td className="py-2 px-3"></td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorAvisoDesconto)}</td></tr>}
                                {ajustes.filter(a => a.tipo === 'Desconto').map((aj, i) => (
                                    <tr key={`d-${i}`} className="border-b border-slate-100 text-rose-600"><td className="py-2 px-3">{aj.descricao}</td><td className="py-2 px-3 text-center text-slate-400">-</td><td className="py-2 px-3"></td><td className="py-2 px-3 text-right font-mono">{formatCurrency(aj.valor)}</td></tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-800">
                                <tr>
                                    <td className="py-3 px-3 font-bold text-slate-800 uppercase tracking-tight" colSpan={2}>Totais</td>
                                    <td className="py-3 px-3 text-right font-bold text-slate-800 text-sm border-r border-slate-200">{formatCurrency(calculo.rescisaoLiquida + calculo.descontoINSS + calculo.totalIRRF + calculo.valorAvisoDesconto + totalAjustesDescontos)}</td>
                                    <td className="py-3 px-3 text-right font-bold text-rose-600 text-sm">{formatCurrency(calculo.descontoINSS + calculo.totalIRRF + calculo.valorAvisoDesconto + totalAjustesDescontos)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Demonstrativo FGTS */}
                        {!calculo.isPedidoDemissao && (
                          <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-6 print:bg-transparent print:border-slate-300">
                              <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-3">Demonstrativo FGTS</h3>
                              <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                                  <div className="flex justify-between items-center pr-10">
                                      <span className="text-slate-600">Base de Cálculo (Fins Rescisórios):</span>
                                      <span className="font-mono font-bold text-slate-900">{formatCurrency(calculo.baseFinsRescisorios)}</span>
                                  </div>
                                  <div className="flex justify-between items-center pl-10 border-l border-slate-300">
                                      <span className="text-slate-600">Multa Rescisória (40%):</span>
                                      <span className="font-mono font-bold text-slate-900">{formatCurrency(calculo.multa40)}</span>
                                  </div>
                                  <div className="col-span-2 mt-2 pt-2 border-t border-slate-200 flex justify-end gap-6 items-center">
                                      <span className="text-slate-700 font-bold uppercase text-[9px]">Total FGTS a Depositar:</span>
                                      <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(calculo.totalContaFGTS)}</span>
                                  </div>
                              </div>
                          </div>
                        )}

                        {/* Rescisão Líquida a Receber */}
                        <div className="flex justify-end items-center gap-6 mb-4 px-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rescisão Líquida a Receber</span>
                            <span className="text-base font-bold text-slate-700 font-mono">{formatCurrency(calculo.rescisaoLiquida)}</span>
                        </div>

                        {/* Total Geral a Receber */}
                        <div className="border-2 border-slate-900 p-6 flex justify-between items-center bg-white">
                            <div>
                                <div className="text-[11px] font-black uppercase text-slate-900 tracking-wider">Total Geral a Receber</div>
                                <div className="text-[9px] font-medium text-slate-400 mt-0.5">Rescisão Líquida + Total FGTS</div>
                            </div>
                            <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                                {formatCurrency(calculo.totalGeral)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        {printSignatures && (
                            <div className="grid grid-cols-2 gap-20 pt-10">
                                <div className="text-center">
                                    <div className="border-t border-slate-800 pt-2 font-bold text-[9px] uppercase tracking-widest text-slate-900">Assinatura do Empregador</div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-slate-800 pt-2 font-bold text-[9px] uppercase tracking-widest text-slate-900">Assinatura do Empregado</div>
                                </div>
                            </div>
                        )}
                        <div className="mt-10 flex items-center gap-4">
                            <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center font-black text-lg rounded-md">L</div>
                            <div>
                                <div className="text-xs font-black uppercase text-slate-900 tracking-wider">Lucas Araujo dos Santos</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Contador • CRC-BA: 046968/O-6</div>
                            </div>
                        </div>
                    </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto p-4 md:p-8 no-print">
        <header className="mb-8 flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-lg">
                <span className="material-icons-round text-white text-xl block">calculate</span>
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900">Cálculo de Rescisão</h1>
                <p className="text-xs text-slate-500">Preencha os dados contratuais para gerar o demonstrativo completo.</p>
            </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-6">
                <div className="mb-5">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Motivo da Rescisão</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button onClick={() => setFormData(prev => ({ ...prev, motivo: 'dispensa' }))} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${formData.motivo === 'dispensa' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Demitido</button>
                        <button onClick={() => setFormData(prev => ({ ...prev, motivo: 'pedido' }))} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${formData.motivo === 'pedido' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Pedido de Demissão</button>
                    </div>
                </div>
                <FormInput label="Salário Base (R$)" name="salarioBase" type="number" value={formData.salarioBase} onChange={handleInputChange} />
                <FormInput label="Adicional Insalubridade (R$)" name="insalubridade" type="number" value={formData.insalubridade} onChange={handleInputChange} />
                <div className="flex gap-3">
                    <FormInput className="flex-1" label="Data Admissão" name="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={handleInputChange} />
                    <FormInput className="flex-1" label="Data Demissão" name="dataDemissao" type="date" value={formData.dataDemissao} onChange={handleInputChange} />
                </div>
                <FormInput label="Tipo de Aviso Prévio" name="avisoTipo" options={[{ value: 'trabalhado', label: 'Trabalhado' }, { value: 'indenizado', label: 'Indenizado' }]} value={formData.avisoTipo} onChange={handleInputChange} />
                
                <FormInput label="Férias Vencidas (Períodos)" name="feriasVencidasQtd" type="number" value={formData.feriasVencidasQtd} onChange={handleInputChange} />

                <button onClick={handleCalcular} className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2 text-sm transform active:scale-[0.99]"><span className="material-icons-round text-base">play_arrow</span> Calcular Rescisão</button>
            </div>

            <div className="w-full lg:w-2/3">
                {!calculo ? (
                    <div className="bg-transparent rounded-2xl border-2 border-dashed border-slate-300 h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400">
                        <span className="material-icons-round text-5xl mb-3 bg-white p-4 rounded-full shadow-sm">analytics</span>
                        <span className="font-medium">Aguardando cálculo...</span>
                    </div>
                ) : (
                    <div className="space-y-5 animate-fade-in">
                        <div className="grid grid-cols-2 gap-5">
                            <ResultCard title="Total Geral" value={formatCurrency(calculo.totalGeral)} subtext="Líquido + FGTS" highlight />
                            <ResultCard title="Líquido a Receber" value={formatCurrency(calculo.rescisaoLiquida)} subtext="Disponível em conta" />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="px-5 py-4 flex justify-between items-center border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-round text-indigo-500 bg-indigo-50 p-1 rounded-md text-base">savings</span>
                                    <span className="text-sm font-bold text-slate-700">FGTS + Multa 40%</span>
                                </div>
                                <button onClick={() => setShowFGTSModal(true)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded uppercase tracking-wide transition-colors">Editar</button>
                             </div>
                             {calculo.isPedidoDemissao ? <div className="p-5 text-sm text-slate-500 italic bg-slate-50">Sem saque de FGTS para pedidos de demissão.</div> : (
                                <div className="p-5 space-y-3">
                                    <div className="flex justify-between items-center text-sm"><div><div className="text-slate-600 font-medium">Saldo FGTS Fins Rescisórios</div><div className="text-[10px] text-slate-400">Base para multa</div></div><div className="font-mono font-bold text-slate-700">{formatCurrency(calculo.saldoFGTSBase + calculo.fgtsRescisao + calculo.fgtsAvisoIndenizado)}</div></div>
                                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3"><div className="text-slate-600 font-medium">Multa 40%</div><div className="font-mono font-bold text-slate-700">{formatCurrency(calculo.multa40)}</div></div>
                                    <div className="flex justify-between items-center pt-1"><div className="text-slate-800 font-bold text-base">Total FGTS (Saque)</div><div className="font-mono font-bold text-indigo-600 text-lg">{formatCurrency(calculo.totalContaFGTS)}</div></div>
                                </div>
                             )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                                <div className="px-5 py-4 flex justify-between items-center border-b border-slate-50">
                                    <div className="flex items-center gap-2"><span className="material-icons-round text-indigo-500 bg-indigo-50 p-1 rounded-md text-base">add_circle_outline</span><span className="text-sm font-bold text-slate-700">Proventos</span></div>
                                    <button onClick={() => setShowAdjustModal(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide transition-colors">Ajustar</button>
                                </div>
                                <div className="p-2 flex-grow">
                                    <LineItem label="Saldo de Salário" value={calculo.saldoSalario} subtext={`${calculo.diasTrabalhados} dias`} type="plus" />
                                    <LineItem label="Aviso Prévio Indenizado" value={calculo.valorAviso} subtext={calculo.diasAviso > 0 ? `${calculo.diasAviso} dias` : ''} type="plus" />
                                    <LineItem label="13º Salário Prop." value={calculo.valor13} subtext={`${calculo.avos13}/12 avos`} type="plus" />
                                    <LineItem label="13º s/ Aviso" value={calculo.valor13Indenizado} type="plus" />
                                    
                                    {/* Exibição das Férias Vencidas Simples */}
                                    {calculo.valorFeriasVencidas > 0 && (
                                        <LineItem label="Férias Vencidas + 1/3" value={calculo.valorFeriasVencidas + calculo.tercoFeriasVencidas} subtext={`${calculo.feriasVencidasQtd} período(s)`} type="plus" />
                                    )}

                                    {/* Exibição das Férias Vencidas em Dobro (Multa) */}
                                    {calculo.valorFeriasDobro > 0 && (
                                        <LineItem label="Férias em Dobro + 1/3" value={calculo.valorFeriasDobro + calculo.tercoFeriasDobro} subtext={`${calculo.feriasDobroQtd} multa(s)`} type="plus" />
                                    )}

                                    <LineItem label="Férias Proporcionais" value={calculo.valorFeriasProp} subtext={`${calculo.avosFerias}/12 avos`} type="plus" />
                                    <LineItem label="1/3 Férias Prop." value={calculo.tercoFeriasProp} type="plus" />
                                    {ajustes.filter(a => a.tipo === 'Provento').map((aj, idx) => <LineItem key={`aj-p-${idx}`} label={aj.descricao} value={aj.valor} subtext="Ajuste Manual" type="plus" />)}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                                <div className="px-5 py-4 flex justify-between items-center border-b border-slate-50">
                                    <div className="flex items-center gap-2"><span className="material-icons-round text-indigo-500 bg-indigo-50 p-1 rounded-md text-base">remove_circle_outline</span><span className="text-sm font-bold text-slate-700">Descontos</span></div>
                                </div>
                                <div className="p-2 flex-grow">
                                    <LineItem label="INSS" value={calculo.descontoINSS} type="minus" />
                                    <LineItem label="IRRF" value={calculo.totalIRRF} type="minus" />
                                    <LineItem label="Aviso Prévio (Desc)" value={calculo.valorAvisoDesconto} type="minus" />
                                    {ajustes.filter(a => a.tipo === 'Desconto').map((aj, idx) => <LineItem key={`aj-d-${idx}`} label={aj.descricao} value={aj.valor} subtext="Ajuste Manual" type="minus" />)}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center border-t border-dashed border-slate-200 mt-6">
                             <button onClick={() => setShowAdjustModal(true)} className="text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 hover:shadow-md px-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"><span className="material-icons-round text-lg">post_add</span> Adicionar Provento/Desconto</button>
                             <button onClick={togglePrintPreview} className="text-white bg-slate-800 hover:bg-slate-900 px-8 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200"><span className="material-icons-round text-lg">description</span> Gerar Termo de Rescisão</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* MODAL FGTS */}
      {showFGTSModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in no-print">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Ajuste de FGTS</h3>
                    <button onClick={() => setShowFGTSModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><span className="material-icons-round">close</span></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
                    <div className="mb-6 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                        <label className="block text-sm font-bold text-indigo-900 mb-2">Saldo Total para Fins Rescisórios</label>
                        <input type="number" className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 placeholder-slate-400 text-sm" placeholder="Saldo total para fins rescisórios" value={fgtsSaldoManual} onChange={(e) => setFgtsSaldoManual(Number(e.target.value))} />
                    </div>
                    <div className="flex justify-between items-end mb-4"><h4 className="font-bold text-slate-700 text-sm">Valores Mensais (8%)</h4><button onClick={preencherSalarioMinimo} className="text-xs text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors">Preencher com Mínimo</button></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{fgtsManualData.map((item, idx) => (<div key={idx} className="bg-white"><label className="block text-[11px] font-medium text-slate-500 mb-1">{item.date}</label><input type="number" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" value={item.value} onChange={(e) => updateFgtsValue(idx, Number(e.target.value))} /></div>))}</div>
                </div>
                <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 z-10"><button onClick={() => setShowFGTSModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors text-sm">Cancelar</button><button onClick={() => { handleCalcular(); setShowFGTSModal(false); }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 text-sm transition-all">Salvar</button></div>
            </div>
        </div>
      )}

      {/* MODAL AJUSTES */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="text-lg font-bold text-slate-800">Ajuste Manual</h3><button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><span className="material-icons-round">close</span></button></div>
                <form onSubmit={addAjuste} className="p-6 space-y-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Descrição</label><input name="descAjuste" required className="w-full border border-slate-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm" placeholder="Ex: Horas Extras..." /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Valor (R$)</label><input name="valAjuste" type="number" step="0.01" required className="w-full border border-slate-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm" placeholder="0.00" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Tipo</label><select name="tipoAjuste" className="w-full border border-slate-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700 text-sm"><option value="Provento">Provento (+)</option><option value="Desconto">Desconto (-)</option></select></div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold mt-2 shadow-md flex items-center justify-center gap-2 text-sm">Adicionar Ajuste</button>
                </form>
                <div className="px-6 pb-6">
                    <h4 className="font-bold text-[10px] uppercase text-slate-400 mb-3 tracking-wider">Ajustes Adicionados</h4>
                    {ajustes.length === 0 ? <div className="text-xs text-slate-400 italic text-center py-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">Nenhum ajuste manual.</div> : (
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {ajustes.map((aj, i) => (<li key={i} className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="font-medium text-slate-700">{aj.descricao}</span><div className="flex items-center gap-2"><span className={`font-bold font-mono ${aj.tipo === 'Provento' ? 'text-emerald-600' : 'text-rose-600'}`}>{aj.tipo === 'Provento' ? '+' : '-'} {formatCurrency(aj.valor)}</span><button onClick={() => setAjustes(ajustes.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500"><span className="material-icons-round text-sm">delete</span></button></div></li>))}
                        </ul>
                    )}
                    <div className="mt-6 pt-4 border-t border-slate-100"><button onClick={() => { handleCalcular(); setShowAdjustModal(false); }} className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-bold text-sm">Concluir</button></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);