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
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none text-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-800/50"
          {...props}
        >
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-2 top-2 pointer-events-none text-emerald-500">
          <span className="material-icons-round text-sm">expand_more</span>
        </div>
      </div>
    ) : (
      <input 
        type={type}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-200 placeholder-slate-600 text-xs font-medium"
        {...props}
      />
    )}
  </div>
);

const ResultCard = ({ title, value, subtext, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-slate-900 p-4 rounded-2xl border ${highlight ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-emerald-900/20 shadow-xl' : 'border-slate-800 shadow-sm'} ${onClick ? 'cursor-pointer hover:border-emerald-500/50 transition-all hover:bg-slate-800/80' : ''}`}>
    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-2">
        {title}
        {onClick && <span className="material-icons-round text-[9px] text-emerald-500">edit</span>}
    </div>
    <div className={`text-xl font-black ${highlight ? 'text-emerald-400' : 'text-slate-200'} font-mono`}>{value}</div>
    {subtext && <div className="text-[9px] text-slate-500 mt-0.5 font-bold">{subtext}</div>}
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
        <div className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors px-2 rounded-lg group">
            <div>
              <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{label}</div>
              {subtext && <div className="text-[9px] text-slate-500 font-bold">{subtext}</div>}
            </div>
            <span className={`text-xs font-mono font-black ${type === 'plus' ? 'text-emerald-400' : type === 'minus' ? 'text-rose-500' : 'text-slate-400'}`}>
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
    zerarFGTS: false,
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

    // 1. Cálculo do Aviso Prévio Total (Lei 12.506/2011)
    // 30 dias base + 3 dias por ano completo, até o máximo de 90 dias (60 proporcionais)
    let diasAvisoTotal = 30;
    if (!isPedidoDemissao) {
        const anosTrabalhados = Math.floor(diffDays(demissao, admissao) / 365.25);
        diasAvisoTotal += Math.min(anosTrabalhados * 3, 60);
    }

    // 2. Definir quantos dias são INDENIZADOS e quantos TRABALHADOS
    // Se indenizado: Todos os dias contam como indenizados.
    // Se trabalhado: Os primeiros 30 são trabalhados, o restante (proporcional) é indenizado.
    let diasAvisoIndenizados = 0;
    let valorAvisoProvento = 0;
    let valorAvisoDesconto = 0;

    if (formData.avisoTipo === 'indenizado') {
        if (isPedidoDemissao) {
            // No pedido de demissão, se não cumprir, desconta-se (em regra limitado a 30 dias)
            valorAvisoDesconto = (salarioTotal / 30) * 30; 
        } else {
            // Dispensa sem justa causa com aviso indenizado: Paga-se tudo
            diasAvisoIndenizados = diasAvisoTotal;
            valorAvisoProvento = (salarioTotal / 30) * diasAvisoIndenizados;
        }
    } else {
        // Aviso Trabalhado
        if (isPedidoDemissao) {
            // Cumpriu o aviso, recebe saldo de salário normal. Sem indenização extra.
        } else {
            // Dispensa sem justa causa com aviso trabalhado
            // Trabalha 30 dias (já estará no saldo de salário através da data de demissão)
            // O excedente (proporcional) é indenizado
            const diasProporcionais = diasAvisoTotal - 30;
            if (diasProporcionais > 0) {
                diasAvisoIndenizados = diasProporcionais;
                valorAvisoProvento = (salarioTotal / 30) * diasAvisoIndenizados;
            }
        }
    }

    // 3. Definir Data de Projeção para Reflexos
    // A projeção soma SOMENTE os dias indenizados à data de desligamento.
    // Se aviso trabalhado: demissao já inclui os 30 dias. Soma-se apenas o proporcional indenizado.
    // Se aviso indenizado: demissao é o último dia trabalhado. Soma-se o aviso total indenizado.
    const projecaoAviso = new Date(demissao);
    if (!isPedidoDemissao) {
        projecaoAviso.setDate(demissao.getDate() + diasAvisoIndenizados);
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
    
    // 13º Salário Normal (até data demissão)
    const avos13 = calcularAvos13(admissao, demissao);
    const valor13 = (salarioTotal / 12) * avos13;
    
    const valorFeriasVencidas = feriasVencidasQtd * salarioTotal;
    const tercoFeriasVencidas = valorFeriasVencidas / 3;

    const valorFeriasDobro = feriasDobroQtd * salarioTotal;
    const tercoFeriasDobro = valorFeriasDobro / 3;

    // Férias Proporcionais Normais (até data demissão)
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

    // Reflexos sobre Aviso Indenizado (13º e Férias)
    // Calcula-se a diferença de avos entre (admissão -> demissão) e (admissão -> projeção)
    let valor13Indenizado = 0;
    let valorFeriasIndenizado = 0;
    let tercoFeriasIndenizado = 0;
    
    // A condição agora verifica se EXISTEM dias indenizados, independente de ser 'trabalhado' ou 'indenizado'
    if (!isPedidoDemissao && diasAvisoIndenizados > 0) {
        // Reflexo 13º
        const avos13ComProjecao = calcularAvos13(admissao, projecaoAviso);
        const diffAvos13 = Math.max(0, avos13ComProjecao - avos13);
        if (diffAvos13 > 0) valor13Indenizado = (salarioTotal / 12) * diffAvos13;
        
        // Reflexo Férias
        let avosFeriasProj = 0;
        let cursorProj = new Date(inicioPeriodoAquisitivo);
        // Calcula avos totais até a projeção
        while (cursorProj < projecaoAviso) {
            let fimMes = new Date(cursorProj);
            fimMes.setMonth(fimMes.getMonth() + 1);
            let limite = fimMes > projecaoAviso ? projecaoAviso : fimMes;
            if (diffDays(limite, cursorProj) >= 14) avosFeriasProj++;
            cursorProj.setMonth(cursorProj.getMonth() + 1);
        }
        if (avosFeriasProj > 12) avosFeriasProj = 12;
        
        // A diferença é o que deve ser pago como indenizado
        const diffAvosFerias = Math.max(0, avosFeriasProj - avosFeriasCalc);
        if (diffAvosFerias > 0) {
             valorFeriasIndenizado = (salarioTotal / 12) * diffAvosFerias;
             tercoFeriasIndenizado = valorFeriasIndenizado / 3;
        }
    }

    let saldoFGTSParaMulta = fgtsSaldoManual !== '' ? Number(fgtsSaldoManual) : fgtsManualData.reduce((acc, curr) => acc + curr.value, 0);
    const baseFGTSRescisao = saldoSalario + valor13 + (valorAvisoProvento > 0 ? valorAvisoProvento : 0);
    const fgtsRescisao = formData.zerarFGTS ? 0 : baseFGTSRescisao * 0.08;
    const fgtsAvisoIndenizado = formData.zerarFGTS ? 0 : valor13Indenizado * 0.08;
    if (formData.zerarFGTS) saldoFGTSParaMulta = 0;
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
        diasAviso: diasAvisoIndenizados, // Ajustado para exibir os dias efetivamente indenizados na tabela
        valor13, avos13,
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
                                <div className="flex items-center space-x-4 mb-2">
                                    <div className="w-12 h-12 bg-virgula-card rounded-xl border border-slate-200 flex items-center justify-center text-virgula-green shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator">
                                            <rect width="16" height="20" x="4" y="2" rx="2"/>
                                            <line x1="8" x2="16" y1="6" y2="6"/>
                                            <line x1="16" x2="16" y1="14" y2="18"/>
                                            <path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/>
                                            <path d="M12 14h.01"/><path d="M8 14h.01"/>
                                            <path d="M12 18h.01"/><path d="M8 18h.01"/>
                                        </svg>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-0.5">Vírgula</span>
                                        <span className="text-base font-semibold text-virgula-green tracking-widest leading-none uppercase">Contábil</span>
                                    </div>
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
                                
                                {calculo.valorFeriasIndenizado > 0 && <tr className="border-b border-slate-100"><td className="py-2 px-3">Férias s/ Aviso Indenizado</td><td className="py-2 px-3 text-center text-slate-400">-</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.valorFeriasIndenizado)}</td><td className="py-2 px-3"></td></tr>}
                                {calculo.tercoFeriasIndenizado > 0 && <tr className="border-b border-slate-100"><td className="py-2 px-3">1/3 Férias s/ Aviso Indenizado</td><td className="py-2 px-3 text-center text-slate-400">1/3</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(calculo.tercoFeriasIndenizado)}</td><td className="py-2 px-3"></td></tr>}
                                
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
        <header className="mb-6">
            <a href="/" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="flex items-center space-x-4 cursor-pointer group">
                <div className="w-12 h-12 bg-virgula-card rounded-xl border border-white/10 flex items-center justify-center text-virgula-green shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-transform group-hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator">
                      <rect width="16" height="20" x="4" y="2" rx="2"/>
                      <line x1="8" x2="16" y1="6" y2="6"/>
                      <line x1="16" x2="16" y1="14" y2="18"/>
                      <path d="M16 10h.01"/>
                      <path d="M12 10h.01"/>
                      <path d="M8 10h.01"/>
                      <path d="M12 14h.01"/>
                      <path d="M8 14h.01"/>
                      <path d="M12 18h.01"/>
                      <path d="M8 18h.01"/>
                    </svg>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-3xl font-bold text-white tracking-tight leading-none mb-0.5">Vírgula</span>
                    <span className="text-base font-semibold text-virgula-green tracking-widest leading-none uppercase">Contábil</span>
                </div>
            </a>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-1/3 bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-800 h-fit sticky top-4">
                <div className="mb-3">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">Motivo da Rescisão</label>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                        <button onClick={() => setFormData(prev => ({ ...prev, motivo: 'dispensa' }))} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all uppercase tracking-wide ${formData.motivo === 'dispensa' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}>Demitido</button>
                        <button onClick={() => setFormData(prev => ({ ...prev, motivo: 'pedido' }))} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all uppercase tracking-wide ${formData.motivo === 'pedido' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}>Pedido</button>
                    </div>
                </div>
                <FormInput label="Salário Base (R$)" name="salarioBase" type="number" value={formData.salarioBase} onChange={handleInputChange} />
                <FormInput label="Adicional Insalubridade (R$)" name="insalubridade" type="number" value={formData.insalubridade} onChange={handleInputChange} />
                <div className="grid grid-cols-2 gap-2">
                    <FormInput label="Admissão" name="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={handleInputChange} />
                    <FormInput label="Demissão" name="dataDemissao" type="date" value={formData.dataDemissao} onChange={handleInputChange} />
                </div>
                <FormInput label="Tipo de Aviso Prévio" name="avisoTipo" options={[{ value: 'trabalhado', label: 'Trabalhado' }, { value: 'indenizado', label: 'Indenizado' }]} value={formData.avisoTipo} onChange={handleInputChange} />
                
                <FormInput label="Férias Vencidas (Períodos)" name="feriasVencidasQtd" type="number" value={formData.feriasVencidasQtd} onChange={handleInputChange} />

                <div className="mt-3 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="zerarFGTS"
                      checked={formData.zerarFGTS}
                      onChange={(e) => setFormData(prev => ({ ...prev, zerarFGTS: e.target.checked }))}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-600 bg-slate-800"
                    />
                    <label htmlFor="zerarFGTS" className="text-xs font-bold text-slate-400 cursor-pointer">
                        Não calcular FGTS da rescisão
                    </label>
                </div>

                <div className="mt-4">
                    <button onClick={handleCalcular} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest transform active:scale-[0.98]"><span className="material-icons-round text-base">play_arrow</span> Calcular Rescisão</button>
                </div>
            </div>

            <div className="w-full lg:w-2/3">
                {!calculo ? (
                    <div className="bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800 h-full min-h-[480px] flex flex-col items-center justify-center text-slate-600">
                        <span className="material-icons-round text-5xl mb-3 bg-slate-900 p-5 rounded-full border border-slate-800 shadow-xl text-slate-700">analytics</span>
                        <span className="font-black uppercase tracking-[0.2em] text-[10px]">Aguardando Parâmetros</span>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <ResultCard title="Total Geral" value={formatCurrency(calculo.totalGeral)} subtext="Líquido + FGTS" highlight />
                            <ResultCard title="Líquido a Receber" value={formatCurrency(calculo.rescisaoLiquida)} subtext="Disponível em conta" />
                        </div>
                        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden relative">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full"></div>
                             <div className="px-5 py-3.5 flex justify-between items-center border-b border-slate-800/50 bg-slate-950/30 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-round text-emerald-500 text-base">savings</span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide">FGTS + Multa 40%</span>
                                </div>
                                <button onClick={() => setShowFGTSModal(true)} className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded uppercase tracking-wider transition-colors border border-emerald-500/20 cursor-pointer relative">Editar Saldo</button>
                             </div>
                             {calculo.isPedidoDemissao ? <div className="p-5 text-xs text-slate-500 italic text-center bg-slate-950/20 relative z-10">Sem saque de FGTS para pedidos de demissão.</div> : (
                                <div className="p-4 space-y-2 relative z-10">
                                    <div className="flex justify-between items-center text-xs"><div><div className="text-slate-400 font-bold text-[10px] uppercase">Saldo Fins Rescisórios</div><div className="text-[9px] text-slate-600 font-bold">Base para multa</div></div><div className="font-mono font-bold text-slate-300">{formatCurrency(calculo.saldoFGTSBase + calculo.fgtsRescisao + calculo.fgtsAvisoIndenizado)}</div></div>
                                    <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2"><div className="text-slate-400 font-bold text-[10px] uppercase">Multa 40%</div><div className="font-mono font-bold text-emerald-500">{formatCurrency(calculo.multa40)}</div></div>
                                    <div className="flex justify-between items-center pt-0.5"><div className="text-slate-200 font-black text-xs uppercase tracking-wide">Total Saque FGTS</div><div className="font-mono font-black text-emerald-400 text-base">{formatCurrency(calculo.totalContaFGTS)}</div></div>
                                </div>
                             )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
                                <div className="px-5 py-2.5 flex justify-between items-center border-b border-slate-800 bg-slate-950/30">
                                    <div className="flex items-center gap-2"><span className="material-icons-round text-emerald-500 text-xs">add_circle</span><span className="text-[9px] font-black text-emerald-500 uppercase tracking-wide">Proventos</span></div>
                                    <button onClick={() => setShowAdjustModal(true)} className="text-[8px] font-bold text-slate-500 hover:text-white uppercase tracking-wide transition-colors cursor-pointer">Adicionar</button>
                                </div>
                                <div className="p-1.5 flex-grow">
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
                                    
                                    <LineItem label="Férias s/ Aviso" value={calculo.valorFeriasIndenizado} type="plus" />
                                    <LineItem label="1/3 Férias s/ Aviso" value={calculo.tercoFeriasIndenizado} type="plus" />
                                    
                                    {ajustes.filter(a => a.tipo === 'Provento').map((aj, idx) => <LineItem key={`aj-p-${idx}`} label={aj.descricao} value={aj.valor} subtext="Ajuste Manual" type="plus" />)}
                                </div>
                            </div>
                            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
                                <div className="px-5 py-2.5 flex justify-between items-center border-b border-slate-800 bg-slate-950/30">
                                    <div className="flex items-center gap-2"><span className="material-icons-round text-rose-500 text-xs">remove_circle</span><span className="text-[9px] font-black text-rose-500 uppercase tracking-wide">Descontos</span></div>
                                </div>
                                <div className="p-1.5 flex-grow">
                                    <LineItem label="INSS" value={calculo.descontoINSS} type="minus" />
                                    <LineItem label="IRRF" value={calculo.totalIRRF} type="minus" />
                                    <LineItem label="Aviso Prévio (Desc)" value={calculo.valorAvisoDesconto} type="minus" />
                                    {ajustes.filter(a => a.tipo === 'Desconto').map((aj, idx) => <LineItem key={`aj-d-${idx}`} label={aj.descricao} value={aj.valor} subtext="Ajuste Manual" type="minus" />)}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center border-t border-slate-800 mt-4">
                             <button onClick={() => setShowAdjustModal(true)} className="text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:text-white px-5 py-2.5 rounded-xl font-bold text-[9px] uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"><span className="material-icons-round text-base">post_add</span> Lançamento Manual</button>
                             <button onClick={togglePrintPreview} className="text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"><span className="material-icons-round text-base">description</span> Gerar PDF / Imprimir</button>
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
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h3 className="text-xs font-black text-white uppercase tracking-wide">Ajuste de FGTS</h3>
                    <button onClick={() => setShowFGTSModal(false)} className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"><span className="material-icons-round">close</span></button>
                </div>
                <div className="p-5 overflow-y-auto custom-scrollbar bg-slate-900">
                    <div className="mb-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <label className="block text-[10px] font-black text-emerald-500 mb-1.5 uppercase tracking-wide">Saldo Atual Disponível (Extrato)</label>
                        <input type="number" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder-slate-600 text-xs font-mono" placeholder="0.00" value={fgtsSaldoManual} onChange={(e) => setFgtsSaldoManual(Number(e.target.value))} />
                    </div>
                    <div className="flex justify-between items-end mb-3"><h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wide">Lançamentos Mensais (8%)</h4><button onClick={preencherSalarioMinimo} className="text-[9px] font-bold text-emerald-500 hover:bg-emerald-500/10 px-2.5 py-1 rounded transition-colors uppercase border border-emerald-500/20 cursor-pointer">Preencher c/ Mínimo</button></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{fgtsManualData.map((item, idx) => (<div key={idx} className="bg-slate-950 p-1.5 rounded-xl border border-slate-800"><label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase text-center">{item.date}</label><input type="number" className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-white text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono" value={item.value} onChange={(e) => updateFgtsValue(idx, Number(e.target.value))} /></div>))}</div>
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-2.5 z-10"><button onClick={() => setShowFGTSModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:text-white transition-colors text-[10px] uppercase tracking-wide cursor-pointer">Cancelar</button><button onClick={() => { handleCalcular(); setShowFGTSModal(false); }} className="px-5 py-2 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 font-black shadow-lg shadow-emerald-900/20 text-[10px] uppercase tracking-wide transition-all cursor-pointer">Salvar Dados</button></div>
            </div>
        </div>
      )}

      {/* MODAL AJUSTES */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[9998] flex items-center justify-center p-4 backdrop-blur-md no-print">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-800">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50"><h3 className="text-xs font-black text-white uppercase tracking-wide">Lançamento Manual</h3><button onClick={() => setShowAdjustModal(false)} className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"><span className="material-icons-round">close</span></button></div>
                <form onSubmit={addAjuste} className="p-5 space-y-3">
                    <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Descrição</label><input name="descAjuste" required className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-xs" placeholder="Ex: Horas Extras..." /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Valor (R$)</label><input name="valAjuste" type="number" step="0.01" required className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-xs font-mono" placeholder="0.00" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Tipo</label><select name="tipoAjuste" className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white text-xs font-medium"><option value="Provento">Provento (+)</option><option value="Desconto">Desconto (-)</option></select></div>
                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl font-black mt-1 shadow-lg flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest cursor-pointer">Adicionar Item</button>
                </form>
                <div className="px-5 pb-5">
                    <h4 className="font-bold text-[8px] uppercase text-slate-600 mb-2 tracking-widest">Itens Adicionados</h4>
                    {ajustes.length === 0 ? <div className="text-[10px] text-slate-600 italic text-center py-3 bg-slate-950 rounded-xl border border-dashed border-slate-800">Nenhum ajuste manual.</div> : (
                        <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                            {ajustes.map((aj, i) => (<li key={i} className="flex justify-between items-center text-[10px] bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span className="font-bold text-slate-300 uppercase tracking-tight">{aj.descricao}</span><div className="flex items-center gap-2.5"><span className={`font-black font-mono ${aj.tipo === 'Provento' ? 'text-emerald-500' : 'text-rose-500'}`}>{aj.tipo === 'Provento' ? '+' : '-'} {formatCurrency(aj.valor)}</span><button onClick={() => setAjustes(ajustes.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-rose-500 cursor-pointer"><span className="material-icons-round text-sm">delete</span></button></div></li>))}
                        </ul>
                    )}
                    <div className="mt-4 pt-3 border-t border-slate-800"><button onClick={() => { handleCalcular(); setShowAdjustModal(false); }} className="w-full py-2 bg-slate-800 text-slate-400 rounded-xl hover:text-white font-black text-[9px] uppercase tracking-widest transition-colors cursor-pointer">Fechar Painel</button></div>
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