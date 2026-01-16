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
];

const getSalarioMinimo = (date: Date): number => {
  for (const record of HISTORICO_SALARIO_MINIMO) {
    if (date >= new Date(record.date)) {
      return record.value;
    }
  }
  return 1412.00;
};

// Faixas conforme imagem fornecida
const calcularINSS = (baseCalculo: number) => {
  if (baseCalculo <= 0) return 0;
  
  // Teto 2026 conforme faixa 4
  const teto = 8475.55;
  const base = Math.min(baseCalculo, teto); 
  
  let desconto = 0;
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

// Lógica IRRF com Desconto Simplificado
const calcularIRRF = (baseCalculo: number) => {
  if (baseCalculo <= 0) return 0;

  const calcularImpostoPuro = (base: number) => {
      let imposto = 0;
      if (base <= 2259.20) imposto = 0;
      else if (base <= 2826.65) imposto = (base * 0.075) - 169.44;
      else if (base <= 3751.05) imposto = (base * 0.15) - 381.44;
      else if (base <= 4664.68) imposto = (base * 0.225) - 662.77;
      else imposto = (base * 0.275) - 896.00;
      return Math.max(0, imposto);
  };

  const irrfTradicional = calcularImpostoPuro(baseCalculo);
  
  // Simplificação: aplica tabela sobre (base - 564.80)
  const irrfSimplificado = calcularImpostoPuro(Math.max(0, baseCalculo + 0 - 564.80));
  
  return Math.min(irrfTradicional, irrfSimplificado); 
};

// --- COMPONENTES VISUAIS (TEMA DARK/GREEN) ---

const FormInput = ({ label, type = "text", className = "", options, ...props }: any) => (
  <div className={`mb-3 ${className}`}>
    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
    {options ? (
      <div className="relative">
        <select 
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none text-slate-200 text-sm font-medium cursor-pointer hover:bg-slate-800/50"
          {...props}
        >
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-3 top-2 pointer-events-none text-emerald-500">
          <span className="material-icons-round text-base">expand_more</span>
        </div>
      </div>
    ) : (
      <input 
        type={type}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-200 placeholder-slate-600 text-sm font-medium"
        {...props}
      />
    )}
  </div>
);

const ResultCard = ({ title, value, subtext, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-slate-900 p-5 rounded-2xl border ${highlight ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-emerald-900/20 shadow-xl' : 'border-slate-800 shadow-sm'} ${onClick ? 'cursor-pointer hover:border-emerald-500/50 transition-all hover:bg-slate-800/80' : ''}`}>
    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
        {title}
        {onClick && <span className="material-icons-round text-[10px] text-emerald-500">edit</span>}
    </div>
    <div className={`text-2xl font-black ${highlight ? 'text-emerald-400' : 'text-slate-200'} font-mono`}>{value}</div>
    {subtext && <div className="text-[10px] text-slate-500 mt-1 font-bold">{subtext}</div>}
  </div>
);

interface LineItemProps {
  label: string;
  value: number;
  subtext?: string;
  type?: 'plus' | 'minus' | 'neutral';
}

const LineItem: React.FC<LineItemProps> = ({ label, value, subtext, type = 'neutral' }) => {
    if (Math.abs(value) < 0.01) return null;
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors px-2 rounded-lg group">
            <div>
              <div className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{label}</div>
              {subtext && <div className="text-[10px] text-slate-500 font-bold">{subtext}</div>}
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
    setFgtsManualData(prev => {
        const newData = [...prev];
        newData[index] = { ...newData[index], value: val };
        return newData;
    });
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
          <div className="min-h-screen bg-slate-950 flex flex-col items-center py-6 no-print:bg-slate-950 print:bg-white print:py-0">
              {/* BARRA SUPERIOR */}
              <div className="w-full max-w-6xl mb-6 flex justify-center no-print px-4">
                  <div className="bg-slate-900 px-6 py-4 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center gap-6 w-full">
                      <button onClick={() => setShowPrintPreview(false)} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm transition-colors">
                          <span className="material-icons-round">arrow_back</span> Voltar
                      </button>
                      <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
                      <div className="flex flex-wrap items-center gap-6 flex-grow">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={printSignatures} onChange={e => setPrintSignatures(e.target.checked)} className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-600 bg-slate-800" />
                              <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">Incluir assinaturas</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={shrinkToFit} onChange={e => setShrinkToFit(e.target.checked)} className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-600 bg-slate-800" />
                              <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">Modo Compacto</span>
                          </label>
                          {printSignatures && (
                              <input 
                                type="text" 
                                maxLength={100} 
                                value={signatureText} 
                                onChange={e => setSignatureText(e.target.value)} 
                                placeholder="Texto customizado (max 2 linhas)" 
                                className="flex-grow text-xs px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-w-[200px]"
                              />
                          )}
                      </div>
                      <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-8 py-2.5 rounded-xl font-black shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
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
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-icons-round text-3xl text-emerald-600">account_balance_wallet</span>
                                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Vírgula Contábil</h1>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Demonstrativo de Rescisão ({calculo.isPedidoDemissao ? 'Pedido de Demissão' : 'Dispensa sem Justa Causa'})</p>
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
                            <div className="mb-4 text-xs italic text-slate-600 bg-slate-50 p-2 border-l-4 border-emerald-400 leading-relaxed whitespace-pre-line">
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
                             <span className="material-icons-round text-3xl text-slate-300">verified</span>
                             <div className="text-[9px] text-slate-400 uppercase font-medium">Documento gerado eletronicamente via Vírgula Contábil</div>
                        </div>
                    </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-300">
      <div className="max-w-6xl mx-auto p-4 md:p-8 no-print">
        <header className="mb-8">
            <a href="/" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="flex items-center space-x-4 cursor-pointer group no-underline">
                <div className="w-12 h-12 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-transform group-hover:scale-105">
                    <span className="material-icons-round text-3xl">calculate</span>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-3xl font-bold text-white tracking-tight leading-none mb-0.5">Vírgula</span>
                    <span className="text-base font-semibold text-emerald-500 tracking-widest leading-none uppercase">Contábil</span>
                </div>
            </a>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-1/3 bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-slate-800 h-fit sticky top-6">
                <div className="mb-4">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Motivo da Rescisão</label>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button onClick={() => setFormData(prev => ({ ...prev, motivo: 'dispensa' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wide ${formData.motivo === 'dispensa' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}>Demitido</button>
                        <button onClick={() => setFormData(prev => ({ ...prev, motivo: 'pedido' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wide ${formData.motivo === 'pedido' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}>Pedido</button>
                    </div>
                </div>
                <FormInput label="Salário Base (R$)" name="salarioBase" type="number" value={formData.salarioBase} onChange={handleInputChange} />
                <FormInput label="Adicional Insalubridade (R$)" name="insalubridade" type="number" value={formData.insalubridade} onChange={handleInputChange} />
                <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Admissão" name="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={handleInputChange} />
                    <FormInput label="Demissão" name="dataDemissao" type="date" value={formData.dataDemissao} onChange={handleInputChange} />
                </div>
                <FormInput label="Tipo de Aviso Prévio" name="avisoTipo" options={[{ value: 'trabalhado', label: 'Trabalhado' }, { value: 'indenizado', label: 'Indenizado' }]} value={formData.avisoTipo} onChange={handleInputChange} />
                
                <FormInput label="Férias Vencidas (Períodos)" name="feriasVencidasQtd" type="number" value={formData.feriasVencidasQtd} onChange={handleInputChange} />

                <div className="space-y-2.5 mt-4">
                    <button onClick={handleCalcular} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex justify-center items-center gap-2 text-[11px] uppercase tracking-widest transform active:scale-[0.98]"><span className="material-icons-round text-lg">play_arrow</span> Calcular Rescisão</button>
                    <button onClick={() => setShowFGTSModal(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-500 font-bold py-2.5 rounded-xl border border-slate-700 transition-all flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest"><span className="material-icons-round text-base">savings</span> Ajustar FGTS</button>
                </div>
            </div>

            <div className="w-full lg:w-2/3">
                {!calculo ? (
                    <div className="bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800 h-full min-h-[500px] flex flex-col items-center justify-center text-slate-600">
                        <span className="material-icons-round text-6xl mb-4 bg-slate-900 p-6 rounded-full border border-slate-800 shadow-xl text-slate-700">analytics</span>
                        <span className="font-black uppercase tracking-[0.2em] text-xs">Aguardando Parâmetros</span>
                    </div>
                ) : (
                    <div className="space-y-5 animate-fade-in">
                        <div className="grid grid-cols-2 gap-5">
                            <ResultCard title="Total Geral" value={formatCurrency(calculo.totalGeral)} subtext="Líquido + FGTS" highlight />
                            <ResultCard title="Líquido a Receber" value={formatCurrency(calculo.rescisaoLiquida)} subtext="Disponível em conta" />
                        </div>
                        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden relative">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full"></div>
                             <div className="px-5 py-4 flex justify-between items-center border-b border-slate-800/50 bg-slate-950/30">
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-round text-emerald-500 text-lg">savings</span>
                                    <span className="text-xs font-black text-slate-300 uppercase tracking-wide">FGTS + Multa 40%</span>
                                </div>
                                <button onClick={() => setShowFGTSModal(true)} className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded uppercase tracking-wider transition-colors border border-emerald-500/20">Editar Saldo</button>
                             </div>
                             {calculo.isPedidoDemissao ? <div className="p-6 text-sm text-slate-500 italic text-center bg-slate-950/20">Sem saque de FGTS para pedidos de demissão.</div> : (
                                <div className="p-5 space-y-3 relative z-10">
                                    <div className="flex justify-between items-center text-sm"><div><div className="text-slate-400 font-bold text-xs uppercase">Saldo Fins Rescisórios</div><div className="text-[10px] text-slate-600 font-bold">Base para multa</div></div><div className="font-mono font-bold text-slate-300">{formatCurrency(calculo.saldoFGTSBase + calculo.fgtsRescisao + calculo.fgtsAvisoIndenizado)}</div></div>
                                    <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-3"><div className="text-slate-400 font-bold text-xs uppercase">Multa 40%</div><div className="font-mono font-bold text-emerald-500">{formatCurrency(calculo.multa40)}</div></div>
                                    <div className="flex justify-between items-center pt-1"><div className="text-slate-200 font-black text-sm uppercase tracking-wide">Total Saque FGTS</div><div className="font-mono font-black text-emerald-400 text-lg">{formatCurrency(calculo.totalContaFGTS)}</div></div>
                                </div>
                             )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
                                <div className="px-5 py-3 flex justify-between items-center border-b border-slate-800 bg-slate-950/30">
                                    <div className="flex items-center gap-2"><span className="material-icons-round text-emerald-500 text-sm">add_circle</span><span className="text-xs font-black text-emerald-500 uppercase tracking-wide">Proventos</span></div>
                                    <button onClick={() => setShowAdjustModal(true)} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-wide transition-colors">Adicionar</button>
                                </div>
                                <div className="p-2 flex-grow">
                                    <LineItem label="Saldo de Salário" value={calculo.saldoSalario} subtext={`${calculo.diasTrabalhados} dias`} type="plus" />
                                    <LineItem label="Aviso Prévio Indenizado" value={calculo.valorAviso} subtext={calculo.diasAviso > 0 ? `${calculo.diasAviso} dias` : ''} type="plus" />
                                    <LineItem label="13º Salário Prop." value={calculo.valor13} subtext={`${calculo.avos13}/12 avos`} type="plus" />
                                    <LineItem label="13º s/ Aviso" value={calculo.valor13Indenizado} type="plus" />
                                    
                                    {calculo.valorFeriasVencidas > 0 && (
                                        <LineItem label="Férias Vencidas + 1/3" value={calculo.valorFeriasVencidas + calculo.tercoFeriasVencidas} subtext={`${calculo.feriasVencidasQtd} período(s)`} type="plus" />
                                    )}

                                    {calculo.valorFeriasDobro > 0 && (
                                        <LineItem label="Férias em Dobro + 1/3" value={calculo.valorFeriasDobro + calculo.tercoFeriasDobro} subtext={`${calculo.feriasDobroQtd} multa(s)`} type="plus" />
                                    )}

                                    <LineItem label="Férias Proporcionais" value={calculo.valorFeriasProp} subtext={`${calculo.avosFerias}/12 avos`} type="plus" />
                                    <LineItem label="1/3 Férias Prop." value={calculo.tercoFeriasProp} type="plus" />
                                    {ajustes.filter(a => a.tipo === 'Provento').map((aj, idx) => <LineItem key={`aj-p-${idx}`} label={aj.descricao} value={aj.valor} subtext="Ajuste Manual" type="plus" />)}
                                </div>
                            </div>
                            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
                                <div className="px-5 py-3 flex justify-between items-center border-b border-slate-800 bg-slate-950/30">
                                    <div className="flex items-center gap-2"><span className="material-icons-round text-rose-500 text-sm">remove_circle</span><span className="text-xs font-black text-rose-500 uppercase tracking-wide">Descontos</span></div>
                                </div>
                                <div className="p-2 flex-grow">
                                    <LineItem label="INSS" value={calculo.descontoINSS} type="minus" />
                                    <LineItem label="IRRF" value={calculo.totalIRRF} type="minus" />
                                    <LineItem label="Aviso Prévio (Desc)" value={calculo.valorAvisoDesconto} type="minus" />
                                    {ajustes.filter(a => a.tipo === 'Desconto').map((aj, idx) => <LineItem key={`aj-d-${idx}`} label={aj.descricao} value={aj.valor} subtext="Ajuste Manual" type="minus" />)}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center border-t border-slate-800 mt-6">
                             <button onClick={() => setShowAdjustModal(true)} className="text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all"><span className="material-icons-round text-lg">post_add</span> Lançamento Manual</button>
                             <button onClick={togglePrintPreview} className="text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"><span className="material-icons-round text-lg">description</span> Gerar PDF / Imprimir</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* MODAL FGTS - CORREÇÃO DE ABERTURA E Z-INDEX */}
      {showFGTSModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in no-print">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up border border-slate-800">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">Ajuste de FGTS</h3>
                    <button onClick={() => setShowFGTSModal(false)} className="text-slate-500 hover:text-white transition-colors p-1"><span className="material-icons-round">close</span></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-900">
                    <div className="mb-6 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <label className="block text-xs font-black text-emerald-500 mb-2 uppercase tracking-wide">Saldo Atual Disponível (Extrato)</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder-slate-600 text-sm font-mono" placeholder="0.00" value={fgtsSaldoManual} onChange={(e) => setFgtsSaldoManual(Number(e.target.value))} />
                    </div>
                    <div className="flex justify-between items-end mb-4"><h4 className="font-bold text-slate-400 text-xs uppercase tracking-wide">Lançamentos Mensais (8%)</h4><button onClick={preencherSalarioMinimo} className="text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/10 px-3 py-1.5 rounded transition-colors uppercase border border-emerald-500/20">Preencher c/ Mínimo</button></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{fgtsManualData.map((item, idx) => (<div key={idx} className="bg-slate-950 p-2 rounded-xl border border-slate-800"><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase text-center">{item.date}</label><input type="number" className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono" value={item.value} onChange={(e) => updateFgtsValue(idx, Number(e.target.value))} /></div>))}</div>
                </div>
                <div className="p-5 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 z-10"><button onClick={() => setShowFGTSModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:text-white transition-colors text-xs uppercase tracking-wide">Cancelar</button><button onClick={() => { handleCalcular(); setShowFGTSModal(false); }} className="px-6 py-2.5 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 font-black shadow-lg shadow-emerald-900/20 text-xs uppercase tracking-wide transition-all">Salvar Dados</button></div>
            </div>
        </div>
      )}

      {/* MODAL AJUSTES */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[9998] flex items-center justify-center p-4 backdrop-blur-md no-print">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-800">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50"><h3 className="text-sm font-black text-white uppercase tracking-wide">Lançamento Manual</h3><button onClick={() => setShowAdjustModal(false)} className="text-slate-500 hover:text-white transition-colors p-1"><span className="material-icons-round">close</span></button></div>
                <form onSubmit={addAjuste} className="p-6 space-y-4">
                    <div><label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Descrição</label><input name="descAjuste" required className="w-full bg-slate-950 border border-slate-700 px-3 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm" placeholder="Ex: Horas Extras..." /></div>
                    <div><label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Valor (R$)</label><input name="valAjuste" type="number" step="0.01" required className="w-full bg-slate-950 border border-slate-700 px-3 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm font-mono" placeholder="0.00" /></div>
                    <div><label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Tipo</label><select name="tipoAjuste" className="w-full bg-slate-950 border border-slate-700 px-3 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm font-medium"><option value="Provento">Provento (+)</option><option value="Desconto">Desconto (-)</option></select></div>
                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black mt-2 shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-widest">Adicionar Item</button>
                </form>
                <div className="px-6 pb-6">
                    <h4 className="font-bold text-[9px] uppercase text-slate-600 mb-3 tracking-widest">Itens Adicionados</h4>
                    {ajustes.length === 0 ? <div className="text-xs text-slate-600 italic text-center py-4 bg-slate-950 rounded-xl border border-dashed border-slate-800">Nenhum ajuste manual.</div> : (
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {ajustes.map((aj, i) => (<li key={i} className="flex justify-between items-center text-xs bg-slate-950 p-3 rounded-xl border border-slate-800"><span className="font-bold text-slate-300 uppercase tracking-tight">{aj.descricao}</span><div className="flex items-center gap-3"><span className={`font-black font-mono ${aj.tipo === 'Provento' ? 'text-emerald-500' : 'text-rose-500'}`}>{aj.tipo === 'Provento' ? '+' : '-'} {formatCurrency(aj.valor)}</span><button onClick={() => setAjustes(ajustes.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-rose-500"><span className="material-icons-round text-sm">delete</span></button></div></li>))}
                        </ul>
                    )}
                    <div className="mt-6 pt-4 border-t border-slate-800"><button onClick={() => { handleCalcular(); setShowAdjustModal(false); }} className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white font-black text-xs uppercase tracking-widest transition-colors">Fechar Painel</button></div>
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