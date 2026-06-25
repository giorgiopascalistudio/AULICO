/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, ArrowUpRight, ArrowDownRight, Briefcase, Plus, Trash2,
  FileText, Calculator, TrendingUp, Calendar, CheckCircle2, AlertCircle,
  ArrowRightLeft, FileCheck, Layers, Landmark, Download, RefreshCw,
  Check, ChevronRight, Activity, Link2, Sliders, ShieldCheck, Info,
  Upload, Building2, Percent, BarChart3
} from 'lucide-react';
import { FinanceMovement, Project, Furnishing, MatericoRequest, UnicoDeal, Cantiere, CantiereSal, Quote, ClientRecord, Task, UserProfile } from '../types';
import { eur, fmtDay, numIt, todayISO } from '../utils';
import { watchNode, writeNode } from '../firebase';
import {
  Company, COMPANY_LABEL, COMPANY_INVOICE_PREFIX,
  Computo, ComputoItem, InvoiceActive, InvoicePassive, ScadenzaItem,
  computoTotal, arrediTotals, studioParcella, matericoMargin, unicoMargin, consolidato,
  parseCsv, guessMapping, rowsToComputoItems, ColumnMapping, ParsedSheet,
  invoiceTotals, CASSA_PCT_DEFAULT
} from '../finance';
import { QuotesView } from './QuotesView';
import { StatsView } from './StatsView';

interface FinanzeViewProps {
  finance: FinanceMovement[];
  projects: Project[];
  furnishings: Record<string, Record<string, Furnishing>>;
  matericoRequests: MatericoRequest[];
  unicoDeals: UnicoDeal[];
  onNewMovement: () => void;
  onDeleteMovement: (id: string) => void;
  // Modulo Cantiere → SAL collegati alla fatturazione
  cantieri?: Record<string, Cantiere>;
  cantSal?: Record<string, Record<string, CantiereSal>>;
  onLinkCantiereSal?: (cid: string, salId: string, invoiceId: string) => void;
  // Preventivi & Parcelle (tab "Preventivi": QuotesView vive qui, non più in sidebar)
  quotes?: Record<string, Quote>;
  clientRecords?: Record<string, ClientRecord>;
  myUid?: string;
  onSaveQuote?: (q: Quote) => void;
  onDeleteQuote?: (id: string) => void;
  onSetQuoteStatus?: (id: string, status: Quote['status']) => void;
  onEmitMilestone?: (quoteId: string, milestoneId: string) => void;
  /** Tab iniziale (es. 'preventivi' quando si arriva da #preventivi). */
  initialTab?: string | null;
  /** Doppia conferma eliminazione (modale condivisa in App). */
  askDelete?: (title: string, message: string | null, onConfirm: () => void) => void;
  /** Statistiche & BEP (tab "Statistiche": StatsView vive qui, non più in sidebar). */
  tasks?: Task[];
  members?: UserProfile[];
  /** RBAC: società su cui l'utente ha accesso finanza (default tutte = comportamento legacy). */
  financeSectors?: ('studio' | 'strategico' | 'materico' | 'unico')[];
}

interface BankMovementSim {
  id: string;
  date: string;
  desc: string;
  amount: number;
  reconciled: boolean;
  linkedInvoiceId?: string;
}

export const FinanzeView: React.FC<FinanzeViewProps> = ({
  finance: initialFinanceProp,
  projects,
  furnishings,
  matericoRequests,
  unicoDeals,
  onNewMovement,
  onDeleteMovement,
  cantieri = {},
  cantSal = {},
  onLinkCantiereSal,
  quotes = {},
  clientRecords = {},
  myUid = '',
  onSaveQuote,
  onDeleteQuote,
  onSetQuoteStatus,
  onEmitMilestone,
  initialTab = null,
  askDelete,
  tasks = [],
  members = [],
  financeSectors = ['studio', 'strategico', 'materico', 'unico']
}) => {
  // RBAC finanza per-società: con accesso a tutte → comportamento legacy (Tutte/Consolidato).
  const allFinanceSectors = financeSectors.length >= 4;
  const canSeeSector = (s: 'studio' | 'strategico' | 'materico' | 'unico') => financeSectors.includes(s);
  // --- SUB-TABS STATE ---
  type FinTab = 'panoramica' | 'preventivi' | 'computi' | 'parcella' | 'fatture' | 'scadenziario' | 'sal' | 'conto_economico' | 'statistiche';
  const [activeTab, setActiveTab] = useState<FinTab>((initialTab as FinTab) || 'panoramica');

  // Arrivo da #preventivi (o link notifica): apre il tab richiesto.
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab as FinTab);
  }, [initialTab]);

  // --- TOP BAR FILTERS (società) ---
  type SectorFilter = 'all' | Company | 'consolidato';
  const [selectedSector, setSelectedSector] = useState<SectorFilter>(allFinanceSectors ? 'all' : (financeSectors[0] as SectorFilter) || 'studio');
  // Per il filtraggio dei libri, 'consolidato' equivale a 'all' (mostra tutto).
  const matchesSector = (s: Company) =>
    selectedSector === 'all' || selectedSector === 'consolidato' || s === selectedSector;
  // Società di un progetto (la divisione; default Studio).
  const projCompany = (p?: Project | null): Company => ((p?.division as Company) || 'studio');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  // Load distinct clients for dropdown filtered by selected sector
  const filteredClientsList = useMemo(() => {
    const list = new Set<string>();
    projects.forEach(p => {
      if (selectedSector !== 'all' && p.division !== selectedSector) return;
      if (p.client) list.add(p.client);
    });
    return Array.from(list);
  }, [projects, selectedSector]);

  // Master list of all clients (used for creation forms/inputs)
  const allClientsList = useMemo(() => {
    const list = new Set<string>();
    projects.forEach(p => {
      if (p.client) list.add(p.client);
    });
    return Array.from(list);
  }, [projects]);

  // Auto-reset selected client when selected sector changes if the client is not in the filtered list
  useEffect(() => {
    if (selectedClient !== 'all' && !filteredClientsList.includes(selectedClient)) {
      setSelectedClient('all');
    }
  }, [selectedSector, filteredClientsList, selectedClient]);

  // --- PERSISTENT SEEDED DATA STATES OR LOCALSTORAGE HOOKS ---
  const [computi, setComputi] = useState<Computo[]>([]);
  const [activeInvoices, setActiveInvoices] = useState<InvoiceActive[]>([]);
  const [passiveInvoices, setPassiveInvoices] = useState<InvoicePassive[]>([]);
  const [scadenze, setScadenze] = useState<ScadenzaItem[]>([]);
  const [bankMovements, setBankMovements] = useState<BankMovementSim[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Simulated Bank Sync process state
  const [isSyncingBank, setIsSyncingBank] = useState(false);

  // Trigger transient message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // --- DATI FINANZIARI CONDIVISI SUL DATABASE (niente più dati fissi) ---
  useEffect(() => {
    const toArr = (v: any) => (Array.isArray(v) ? v : v ? Object.values(v) : []);
    const subs = [
      // items normalizzato ad array: Firebase non salva gli array vuoti → un
      // computo senza voci tornerebbe con items=undefined e farebbe crashare il tab.
      watchNode('finComputi', (v) => setComputi(toArr(v).map((c: any) => ({ ...c, items: Array.isArray(c.items) ? c.items : c.items ? Object.values(c.items) : [] }))), () => {}),
      watchNode('finInvoicesActive', (v) => setActiveInvoices(toArr(v)), () => {}),
      watchNode('finInvoicesPassive', (v) => setPassiveInvoices(toArr(v)), () => {}),
      watchNode('finScadenze', (v) => setScadenze(toArr(v)), () => {}),
      watchNode('finBank', (v) => setBankMovements(toArr(v)), () => {})
    ];
    return () => subs.forEach((u) => u());
  }, []);

  // --- PERSISTENCE WRITERS (scrivono sul Database condiviso) ---
  const saveComputi = (data: Computo[]) => {
    setComputi(data);
    writeNode('finComputi', data).catch(() => {});
  };

  const saveActiveInvoices = (data: InvoiceActive[]) => {
    setActiveInvoices(data);
    writeNode('finInvoicesActive', data).catch(() => {});
  };

  const savePassiveInvoices = (data: InvoicePassive[]) => {
    setPassiveInvoices(data);
    writeNode('finInvoicesPassive', data).catch(() => {});
  };

  const saveScadenze = (data: ScadenzaItem[]) => {
    setScadenze(data);
    writeNode('finScadenze', data).catch(() => {});
  };

  const saveBankMovements = (data: BankMovementSim[]) => {
    setBankMovements(data);
    writeNode('finBank', data).catch(() => {});
  };

  // --- STATE FOR NEW ENTRY CREATION BOARDS ---
  const [activeProjectForComputo, setActiveProjectForComputo] = useState<string>('');
  const [newCompDesc, setNewCompDesc] = useState('');
  const [newCompCat, setNewCompCat] = useState('Edile');
  const [newCompQty, setNewCompQty] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('');

  // --- IMPORT COMPUTO da file (.csv/.tsv parse nativo; .xlsx/.pdf = allegato) ---
  const [importComputoId, setImportComputoId] = useState<string | null>(null); // computo target
  const [importSheet, setImportSheet] = useState<ParsedSheet | null>(null);
  const [importMapping, setImportMapping] = useState<ColumnMapping | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');

  // Active Invoice form states
  const [invClient, setInvClient] = useState('');
  const [invProjId, setInvProjId] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invTax, setInvTax] = useState(22);
  const [invVatOn, setInvVatOn] = useState(true);        // IVA spuntabile
  const [invCassaOn, setInvCassaOn] = useState(false);   // Cassa previdenziale spuntabile
  const [invCassaPct, setInvCassaPct] = useState(CASSA_PCT_DEFAULT);
  const [invSdi, setInvSdi] = useState('M5UXCR1');

  // Passive Invoice form states
  const [pasSupplier, setPasSupplier] = useState('');
  const [pasProjId, setPasProjId] = useState('');
  const [pasAmount, setPasAmount] = useState('');
  const [pasCat, setPasCat] = useState('Materiali');
  const [pasDesc, setPasDesc] = useState('');

  // --- FILTERING LOGIC DEPENDING ON SECTOR & CLIENT ---
  const filteredActiveInvoices = useMemo(() => {
    return activeInvoices.filter(inv => {
      const matchSector = matchesSector(inv.sector);
      const matchClient = selectedClient === 'all' || inv.clientName.toLowerCase().includes(selectedClient.toLowerCase());
      return matchSector && matchClient;
    });
  }, [activeInvoices, selectedSector, selectedClient]);

  const filteredPassiveInvoices = useMemo(() => {
    return passiveInvoices.filter(inv => {
      const matchSector = matchesSector(inv.sector);
      const associatedProj = projects.find(p => p.id === inv.projectId);
      const matchClient = selectedClient === 'all' || (associatedProj && associatedProj.client?.toLowerCase().includes(selectedClient.toLowerCase()));
      return matchSector && matchClient;
    });
  }, [passiveInvoices, selectedSector, selectedClient, projects]);

  const filteredScadenze = useMemo(() => {
    return scadenze.filter(sc => {
      const matchSector = matchesSector(sc.sector);
      const matchClient = selectedClient === 'all' || sc.clientOrSupplier.toLowerCase().includes(selectedClient.toLowerCase());
      return matchSector && matchClient;
    });
  }, [scadenze, selectedSector, selectedClient]);

  // Combined totals for the KPI Cards based on Filters
  const totalInvoiced = useMemo(() => {
    return filteredActiveInvoices
      .filter(i => i.status === 'pagata' || i.status === 'consegnata_sdi' || i.status === 'inviata_sdi')
      .reduce((s, i) => s + i.amount, 0);
  }, [filteredActiveInvoices]);

  const totalInterestsPaid = useMemo(() => {
    return filteredActiveInvoices
      .filter(i => i.status === 'pagata')
      .reduce((s, i) => s + i.amount, 0);
  }, [filteredActiveInvoices]);

  const totalExpenses = useMemo(() => {
    return filteredPassiveInvoices.reduce((s, i) => s + i.amount, 0);
  }, [filteredPassiveInvoices]);

  const currentOutstandingAccounts = useMemo(() => {
    return filteredActiveInvoices
      .filter(i => i.status === 'inviata_sdi' || i.status === 'consegnata_sdi')
      .reduce((s, i) => s + i.amount, 0);
  }, [filteredActiveInvoices]);

  // --- MOCK BANK SYNCHRONIZER AND RECONCILIATION ENG ---
  const handleBankSync = () => {
    setIsSyncingBank(true);
    setTimeout(() => {
      setIsSyncingBank(false);
      // Generate a new simulated incoming payment from Cliente Bianchi or Studio Gallone
      const hasUnreconciled = bankMovements.some(bm => !bm.reconciled);
      if (hasUnreconciled) {
        triggerToast("🔄 Sincronizzazione completata: Trovati movimenti da riconciliare.");
      } else {
        triggerToast("✅ Estratto conto Unicredit aggiornato. Nessun nuovo movimento individuato.");
      }
    }, 1200);
  };

  const reconcileMovement = (bmId: string, associatedInvoiceId: string) => {
    // 1. Mark bank movement as reconciled
    const updatedBank = bankMovements.map(bm => {
      if (bm.id === bmId) {
        return { ...bm, reconciled: true, linkedInvoiceId: associatedInvoiceId };
      }
      return bm;
    });
    saveBankMovements(updatedBank);

    // 2. Mark active or passive invoice as Paid
    const targetActive = activeInvoices.find(i => i.id === associatedInvoiceId);
    if (targetActive) {
      const updatedAct = activeInvoices.map(i => {
        if (i.id === associatedInvoiceId) return { ...i, status: 'pagata' as const };
        return i;
      });
      saveActiveInvoices(updatedAct);
      
      // Also mark associated Scadenza as pagato
      const updatedScad = scadenze.map(sc => {
        if (sc.projectId === targetActive.projectId && sc.amount === targetActive.amount) {
          return { ...sc, status: 'pagato' as const };
        }
        return sc;
      });
      saveScadenze(updatedScad);
      triggerToast(`💸 Riconciliato con successo! Fattura attiva ${associatedInvoiceId} contrassegnata come PAGATA.`);
    } else {
      // Check if it's passive
      const targetPassive = passiveInvoices.find(p => p.id === associatedInvoiceId);
      if (targetPassive) {
        const updatedPas = passiveInvoices.map(i => {
          if (i.id === associatedInvoiceId) return { ...i, status: 'pagata' as const };
          return i;
        });
        savePassiveInvoices(updatedPas);
        triggerToast(`💳 Uscita registrata! Fattura passiva fornitori ${associatedInvoiceId} saldata.`);
      }
    }
  };

  // --- DETAILED COMPUTO METRICO ACTIONS ---
  const handleAddComputoItem = (idComputo: string) => {
    if (!newCompDesc || !newCompQty || !newCompPrice) {
      triggerToast("⚠️ Compila tutti i campi della riga.");
      return;
    }
    const q = parseFloat(newCompQty);
    const p = parseFloat(newCompPrice);
    if (isNaN(q) || isNaN(p)) return;

    const newItem: ComputoItem = {
      id: `ci-${Date.now()}`,
      desc: newCompDesc,
      category: newCompCat,
      quantity: q,
      unitPrice: p
    };

    const updated = computi.map(c => {
      if (c.id === idComputo) {
        return { ...c, items: [...c.items, newItem] };
      }
      return c;
    });

    saveComputi(updated);
    // Clear inputs
    setNewCompDesc('');
    setNewCompQty('');
    setNewCompPrice('');
    triggerToast("✨ Voce aggiunta al computo metrico con successo!");
  };

  const handleDeleteComputoItem = (idComputo: string, idItem: string) => {
    const doDelete = () => {
      const updated = computi.map(c => {
        if (c.id === idComputo) {
          return { ...c, items: c.items.filter(it => it.id !== idItem) };
        }
        return c;
      });
      saveComputi(updated);
      triggerToast("🗑️ Riga del computo eliminata.");
    };
    const item = computi.find(c => c.id === idComputo)?.items.find(it => it.id === idItem);
    if (askDelete) askDelete('Eliminare la riga del computo?', item ? `"${item.desc}" verrà rimossa dal computo metrico.` : null, doDelete);
    else doDelete();
  };

  const handleCreateNewComputo = () => {
    if (computi.some(c => c.projectId === activeProjectForComputo)) {
      triggerToast("⚠️ Esiste già un computo per questo progetto!");
      return;
    }
    const relatedProj = projects.find(p => p.id === activeProjectForComputo);
    const newComp: Computo = {
      id: `cp-${Date.now()}`,
      projectId: activeProjectForComputo,
      title: `Computo Metrico — ${relatedProj ? relatedProj.name : 'Nuovo Lavoro'}`,
      items: [
        { id: `ci-init-${Date.now()}`, desc: 'Rilievi e progettazione preliminare architettonica', category: 'Finiture', quantity: 1, unitPrice: 3500 }
      ]
    };
    saveComputi([...computi, newComp]);
    triggerToast("📂 Nuovo computo metrico inizializzato!");
  };

  // --- IMPORT COMPUTO da file ---
  const handleComputoFile = (idComputo: string, file: File) => {
    setImportFileName(file.name);
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        const sheet = parseCsv(String(reader.result || ''));
        if (sheet.headers.length === 0) {
          triggerToast('⚠️ File vuoto o non leggibile.');
          return;
        }
        setImportComputoId(idComputo);
        setImportSheet(sheet);
        setImportMapping(guessMapping(sheet.headers));
      };
      reader.onerror = () => triggerToast('⚠️ Errore nella lettura del file.');
      reader.readAsText(file);
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      // Excel richiede SheetJS (non installato): salviamo come allegato di riferimento.
      const updated = computi.map(c => c.id === idComputo ? { ...c, sourceFileName: file.name } : c);
      saveComputi(updated);
      triggerToast('📎 Excel allegato come riferimento. Per l\'estrazione automatica esporta il computo in CSV.');
    } else {
      // PDF / altro: solo allegato di riferimento (no parsing).
      const updated = computi.map(c => c.id === idComputo ? { ...c, sourceFileName: file.name } : c);
      saveComputi(updated);
      triggerToast('📎 File allegato come riferimento (PDF non viene estratto automaticamente).');
    }
  };

  const confirmImport = () => {
    if (!importComputoId || !importSheet || !importMapping) return;
    const items = rowsToComputoItems(importSheet.rows, importMapping);
    if (items.length === 0) {
      triggerToast('⚠️ Nessuna riga valida estratta: controlla la mappatura colonne.');
      return;
    }
    const updated = computi.map(c =>
      c.id === importComputoId ? { ...c, items: [...c.items, ...items], sourceFileName: importFileName || c.sourceFileName } : c
    );
    saveComputi(updated);
    setImportComputoId(null);
    setImportSheet(null);
    setImportMapping(null);
    setImportFileName('');
    triggerToast(`✨ Importate ${items.length} voci dal file.`);
  };

  const cancelImport = () => {
    setImportComputoId(null);
    setImportSheet(null);
    setImportMapping(null);
    setImportFileName('');
  };

  // Numerazione fatture per società (libri separati).
  const nextInvoiceId = (company: Company) => {
    const count = activeInvoices.filter(i => i.sector === company).length + 1;
    return `${COMPANY_INVOICE_PREFIX[company]}-2026-${String(count).padStart(3, '0')}`;
  };

  // --- INVOICING TRIGGER CORES ---
  const handleAddActiveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invClient || !invProjId || !invAmount) {
      triggerToast("⚠️ Compila tutti i campi della fattura attiva.");
      return;
    }
    const val = parseFloat(invAmount);
    if (isNaN(val)) return;

    const relatedProj = projects.find(p => p.id === invProjId);
    const company = projCompany(relatedProj);
    const newInv: InvoiceActive = {
      id: nextInvoiceId(company),
      clientName: invClient,
      projectId: invProjId,
      projectName: relatedProj ? relatedProj.name : 'Bespoke Project',
      amount: val,
      taxRate: invVatOn ? invTax : 0,
      cassaPct: invCassaOn ? invCassaPct : null,
      status: 'bozza',
      sdiCode: invSdi || 'M5UXCR1',
      date: todayISO(),
      dueDate: todayISO(),
      sector: company
    };

    saveActiveInvoices([...activeInvoices, newInv]);
    // Append a corresponding expected Scadenza
    const newScad: ScadenzaItem = {
      id: `sc-act-${Date.now()}`,
      kind: 'entrata',
      desc: `Scadenza Fattura ${newInv.id}`,
      clientOrSupplier: invClient,
      amount: val,
      dueDate: todayISO(),
      status: 'pago_attesa',
      projectId: invProjId,
      sector: newInv.sector
    };
    saveScadenze([...scadenze, newScad]);

    // Clear
    setInvAmount('');
    triggerToast("📄 Bozza Invoice creata! Ora puoi inviarla al Sistema di Interscambio (SDI).");
  };

  const handleTransmitSDI = (id: string) => {
    const updated = activeInvoices.map(inv => {
      if (inv.id === id) {
        return { ...inv, status: 'inviata_sdi' as const };
      }
      return inv;
    });
    saveActiveInvoices(updated);
    triggerToast(`📬 Inviata al Sistema di Interscambio (SDI) ricevuta di avvenuto invio per ${id}!`);
    
    // Simulate immediate mock feedback of acceptance
    setTimeout(() => {
      const delivered = activeInvoices.map(inv => {
        if (inv.id === id) return { ...inv, status: 'consegnata_sdi' as const };
        return inv;
      });
      saveActiveInvoices(delivered);
    }, 3000);
  };

  // Passive invoice submission
  const handleAddPassiveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasSupplier || !pasAmount || !pasDesc) {
      triggerToast("⚠️ Compila tutti i campi della fattura passiva.");
      return;
    }
    const val = parseFloat(pasAmount);
    if (isNaN(val)) return;

    const relatedProj = projects.find(p => p.id === pasProjId);
    const newInv: InvoicePassive = {
      id: `FP-2026-${String(passiveInvoices.length + 1).padStart(2, '0')}`,
      supplierName: pasSupplier,
      projectId: pasProjId,
      projectName: relatedProj ? relatedProj.name : '— Spese Generali Studio —',
      amount: val,
      category: pasCat,
      status: 'ricevuta',
      date: todayISO(),
      dueDate: todayISO(),
      sector: projCompany(relatedProj),
      description: pasDesc
    };

    savePassiveInvoices([...passiveInvoices, newInv]);

    // Append outgoing expected Scadenza
    const newScad: ScadenzaItem = {
      id: `sc-pas-${Date.now()}`,
      kind: 'uscita',
      desc: `Fattura passiva ${newInv.id} - ${pasDesc}`,
      clientOrSupplier: pasSupplier,
      amount: val,
      dueDate: todayISO(),
      status: 'pago_attesa',
      projectId: pasProjId || undefined,
      sector: newInv.sector
    };
    saveScadenze([...scadenze, newScad]);

    setPasSupplier('');
    setPasAmount('');
    setPasDesc('');
    triggerToast("📉 Fattura passiva fornitori registrata con successo nel archivio.");
  };

  const handleRegisterPaymentFromScadenza = (scId: string) => {
    const updated = scadenze.map(sc => {
      if (sc.id === scId) {
        return { ...sc, status: 'pagato' as const };
      }
      return sc;
    });
    saveScadenze(updated);

    const targetSc = scadenze.find(s => s.id === scId);
    if (targetSc) {
      // Find corresponding invoice and mark as pagata
      if (targetSc.kind === 'entrata') {
        const matchAct = activeInvoices.find(i => i.projectId === targetSc.projectId && i.amount === targetSc.amount);
        if (matchAct) {
          const uAct = activeInvoices.map(i => i.id === matchAct.id ? { ...i, status: 'pagata' as const } : i);
          saveActiveInvoices(uAct);
        }
      } else {
        const matchPas = passiveInvoices.find(p => p.projectId === targetSc.projectId && p.amount === targetSc.amount);
        if (matchPas) {
          const uPas = passiveInvoices.map(p => p.id === matchPas.id ? { ...p, status: 'pagata' as const } : p);
          savePassiveInvoices(uPas);
        }
      }
      triggerToast(`✅ Scadenza registrata come PAGATA! Transazione allineata.`);
    }
  };

  // --- EXCELLENT SAL LINKED ENGINE TRIGGER ---
  const handleGenerateSalInvoice = (projId: string, phaseName: string, amount: number, idx: number) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;

    const company = projCompany(proj);
    const newInv: InvoiceActive = {
      id: `${COMPANY_INVOICE_PREFIX[company]}-SAL-${String(activeInvoices.filter(i => i.sector === company && i.isSal).length + 1).padStart(3, '0')}`,
      clientName: proj.client || 'Cliente Studio',
      projectId: projId,
      projectName: proj.name,
      amount: amount,
      taxRate: 22,
      status: 'bozza',
      sdiCode: 'M5UXCR1',
      date: todayISO(),
      dueDate: todayISO(),
      sector: company,
      isSal: true,
      salNumber: idx + 1
    };

    saveActiveInvoices([...activeInvoices, newInv]);

    // Also register scheduled payment scadenza
    const newScad: ScadenzaItem = {
      id: `sc-sal-${Date.now()}`,
      kind: 'entrata',
      desc: `${idx + 1}° SAL Finanziario - Fase ${phaseName}`,
      clientOrSupplier: proj.client || 'Cliente Studio',
      amount: amount,
      dueDate: todayISO(),
      status: 'pago_attesa',
      projectId: projId,
      sector: newInv.sector
    };
    saveScadenze([...scadenze, newScad]);

    triggerToast(`⚡ Collegato SAL Tecnico! Creata Bozza di Fattura Attiva per ${proj.name} [SAL ${idx + 1}] pari a ${eur(amount)}.`);
    setActiveTab('fatture');
  };

  // --- SAL DI CANTIERE APPROVATO → BOZZA FATTURA ATTIVA (riusa la logica SAL) ---
  const handleGenerateCantiereSalInvoice = (cid: string, sal: CantiereSal, proj: Project) => {
    const company = projCompany(proj);
    const amount = sal.importo || 0;
    const invId = `${COMPANY_INVOICE_PREFIX[company]}-SAL-${String(activeInvoices.filter(i => i.sector === company && i.isSal).length + 1).padStart(3, '0')}`;
    const newInv: InvoiceActive = {
      id: invId,
      clientName: proj.client || 'Cliente Studio',
      projectId: proj.id,
      projectName: proj.name,
      amount,
      taxRate: 22,
      status: 'bozza',
      sdiCode: 'M5UXCR1',
      date: todayISO(),
      dueDate: todayISO(),
      sector: company,
      isSal: true,
      salNumber: sal.number
    };
    saveActiveInvoices([...activeInvoices, newInv]);
    saveScadenze([...scadenze, {
      id: `sc-cant-${Date.now()}`,
      kind: 'entrata',
      desc: `SAL Cantiere ${sal.number} - ${proj.name}`,
      clientOrSupplier: proj.client || 'Cliente Studio',
      amount,
      dueDate: todayISO(),
      status: 'pago_attesa',
      projectId: proj.id,
      sector: company
    }]);
    onLinkCantiereSal?.(cid, sal.id, invId);
    triggerToast(`⚡ Bozza fattura da SAL di cantiere creata per ${proj.name} (${eur(amount)}).`);
    setActiveTab('fatture');
  };

  // SAL di cantiere approvati e NON ancora fatturati (pronti per la bozza fattura)
  const cantiereSalToBill = useMemo(() => {
    const out: { cid: string; sal: CantiereSal; proj: Project }[] = [];
    Object.entries(cantSal).forEach(([cid, sals]) => {
      const c = cantieri[cid];
      const proj = c && projects.find(p => p.id === c.projectId);
      if (!proj) return;
      Object.values(sals || {}).forEach((s) => {
        if (s.status === 'approvato' && !s.linkedInvoiceId) out.push({ cid, sal: s, proj });
      });
    });
    return out;
  }, [cantSal, cantieri, projects]);

  // ============================================================
  // DERIVAZIONI DAL MOTORE FINANZIARIO (finance.ts)
  // ============================================================
  // Totale computo metrico per progetto.
  const computoByProject = useMemo(() => {
    const m: Record<string, number> = {};
    computi.forEach((c) => { m[c.projectId] = (m[c.projectId] || 0) + computoTotal(c); });
    return m;
  }, [computi]);

  // Parcella Studio per progetto (15% computo+fissi, +20% mobili gestiti).
  const parcellaByProject = useMemo(() => {
    const m: Record<string, ReturnType<typeof studioParcella> & { arrediFissi: number; arrediMobili: number }> = {};
    projects.forEach((p) => {
      const at = arrediTotals(Object.values(furnishings[p.id] || {}));
      // SOLO gli arredi confermati concorrono alla parcella/contabilità.
      const parc = studioParcella(p, computoByProject[p.id] || 0, at.fissiConfermati, at.mobiliConfermati);
      m[p.id] = { ...parc, arrediFissi: at.fissiConfermati, arrediMobili: at.mobiliConfermati };
    });
    return m;
  }, [projects, furnishings, computoByProject]);

  // Libri per società (ricavi/costi) per Conto Economico + Consolidato.
  const companyBooks = useMemo(() => {
    const base: Record<Company, { ricavi: number; costi: number }> = {
      studio: { ricavi: 0, costi: 0 }, strategico: { ricavi: 0, costi: 0 },
      materico: { ricavi: 0, costi: 0 }, unico: { ricavi: 0, costi: 0 }
    };
    activeInvoices.forEach((i) => { if (base[i.sector]) base[i.sector].ricavi += i.amount; });
    passiveInvoices.forEach((p) => { if (base[p.sector]) base[p.sector].costi += p.amount; });
    // Rollup Materico: margine = clientPrice − costo partner.
    matericoRequests.forEach((r) => {
      if (r.status === 'inviata_cliente' || r.status === 'accettata') {
        const mm = matericoMargin(r);
        base.materico.ricavi += mm.clientPrice;
        base.materico.costi += mm.baseCost;
      }
    });
    // Rollup Unico: rivendita vs acquisto+ristrutturazione.
    unicoDeals.forEach((d) => {
      base.unico.ricavi += d.targetSalePrice || 0;
      base.unico.costi += (d.acquisitionCost || 0) + (d.renovationBudget || 0);
    });
    return base;
  }, [activeInvoices, passiveInvoices, matericoRequests, unicoDeals]);

  // Giri interni (commesse interne intercompany): elisi dal totale di gruppo.
  const intercompanyTotals = useMemo(() => ({
    ricavi: activeInvoices.filter((i) => i.intercompany).reduce((s, i) => s + (i.amount || 0), 0),
    costi: passiveInvoices.filter((p) => p.intercompany).reduce((s, p) => s + (p.amount || 0), 0),
  }), [activeInvoices, passiveInvoices]);

  const consolidatedBooks = useMemo(() => consolidato(companyBooks, intercompanyTotals), [companyBooks, intercompanyTotals]);

  // Piano SAL derivato dalla parcella: quote uguali sulle fasi del progetto.
  const salPlanForProject = (proj: Project) => {
    const phases = (proj.phases ? Object.values(proj.phases) : []) as any[];
    const tot = parcellaByProject[proj.id]?.totaleParcella || 0;
    const per = phases.length ? Math.round(tot / phases.length) : 0;
    return { phases, per, tot };
  };

  // --- SNAPSHOT per il portale cliente (nodo client-readable projectEconomics/<pid>) ---
  useEffect(() => {
    projects.forEach((p) => {
      if (!p.clientUid) return;
      const parc = parcellaByProject[p.id];
      const snap = {
        pid: p.id,
        company: projCompany(p),
        computoTotal: computoByProject[p.id] || 0,
        arrediFissi: parc?.arrediFissi || 0,
        arrediMobili: parc?.arrediMobili || 0,
        parcella: parc || null,
        invoices: activeInvoices.filter((i) => i.projectId === p.id),
        scadenze: scadenze.filter((s) => s.projectId === p.id),
        updatedAt: Date.now()
      };
      writeNode(`projectEconomics/${p.id}`, snap).catch(() =>
        console.warn('projectEconomics: scrittura negata (ripubblicare le regole Firebase?)', p.id)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, computoByProject, parcellaByProject, activeInvoices, scadenze]);

  return (
    <div className="flex flex-col gap-6 text-left animate-[riseIn_0.42s_ease_both]">
      {/* Toast helper */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] text-white border border-[#2d2d2d] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 max-w-sm font-sans animate-[bounceIn_0.3s_ease]">
          <ShieldCheck className="text-green-400 w-5 h-5 flex-shrink-0" />
          <p className="text-[12.5px] font-bold leading-tight">{toastMessage}</p>
        </div>
      )}

      {/* HEADER CONTROLLER BANNER */}
      <div className="bg-[#1b1b1b] text-white p-5 md:p-6 rounded-[28px] overflow-hidden relative shadow-md">
        <div className="absolute right-0 top-0 opacity-20 transform translate-x-10 -translate-y-10 scale-150">
          <Landmark className="w-48 h-48 text-[#ececec]" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-stone-400">AMMINISTRAZIONE ONIRICO TECHNOLOGY Suite</span>
            <h1 className="text-[24px] md:text-[28px] font-black tracking-tight mt-0.5">Controllo Finanziario Multidivisione</h1>
            <p className="text-[12.5px] text-stone-300 mt-1 max-w-xl font-medium leading-normal">
              Contabilità generale integrata con preventivi, fatture SDI attive/passive, controllo cash-flow, scadenziari e collegamento SAL tecnici.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors p-2.5 rounded-2xl self-start md:self-auto">
            <Sliders className="w-5 h-5 text-stone-400" />
            <div className="text-[11.5px] font-bold">
              <span className="block text-stone-400 uppercase text-[9px] font-black tracking-widest">Modalità contabile</span>
              <span className="text-white block mt-0.5">Semplificata & SDI Elettronica</span>
            </div>
          </div>
        </div>

        {/* SWISS QUICK FILTER ZONE */}
        <div className="bg-[#242424] border border-[#2a2a2a] rounded-2xl p-4 mt-5 grid grid-cols-1 md:flex md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
            {/* Sector selectors */}
            <div className="flex flex-col gap-1 w-full sm:w-auto text-left">
              <label className="text-[10px] uppercase font-black tracking-wider text-stone-400">Società</label>
              <div className="pillbar flex bg-[#161616] rounded-xl p-1 mt-1 border border-stone-800 whitespace-nowrap">
                {allFinanceSectors && (
                  <button
                    onClick={() => setSelectedSector('all')}
                    className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg transition-all ${
                      selectedSector === 'all' ? 'bg-[#333] text-white font-black' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Tutte
                  </button>
                )}
                {canSeeSector('studio') && (
                  <button
                    onClick={() => setSelectedSector('studio')}
                    className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg transition-all ${
                      selectedSector === 'studio' ? 'bg-[#333] text-white font-black' : 'text-[#85aed4] hover:text-white'
                    }`}
                  >
                    Onirico
                  </button>
                )}
                {canSeeSector('strategico') && (
                  <button
                    onClick={() => setSelectedSector('strategico')}
                    className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg transition-all ${
                      selectedSector === 'strategico' ? 'bg-[#333] text-white font-black' : 'text-[#b9a5e8] hover:text-white'
                    }`}
                  >
                    Strategico
                  </button>
                )}
                {canSeeSector('materico') && (
                  <button
                    onClick={() => setSelectedSector('materico')}
                    className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg transition-all ${
                      selectedSector === 'materico' ? 'bg-[#333] text-white font-black' : 'text-[#f2bc88] hover:text-white'
                    }`}
                  >
                    Materico
                  </button>
                )}
                {canSeeSector('unico') && (
                  <button
                    onClick={() => setSelectedSector('unico')}
                    className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg transition-all ${
                      selectedSector === 'unico' ? 'bg-[#333] text-white font-black' : 'text-[#a5b4fc] hover:text-white'
                    }`}
                  >
                    Unico
                  </button>
                )}
                {allFinanceSectors && (
                  <button
                    onClick={() => setSelectedSector('consolidato')}
                    className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg transition-all ${
                      selectedSector === 'consolidato' ? 'bg-emerald-700 text-white font-black' : 'text-emerald-400 hover:text-white'
                    }`}
                  >
                    Consolidato
                  </button>
                )}
              </div>
            </div>

            {/* Client selector */}
            <div className="flex flex-col gap-1 w-full sm:w-auto text-left">
              <label className="text-[10px] uppercase font-black tracking-wider text-stone-400">Cliente Committente</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-[#161616] text-[#fafafa] border border-stone-800 rounded-xl px-3 py-1.5 text-[11.5px] font-bold mt-1 focus:ring-1 focus:ring-stone-600 focus:outline-none cursor-pointer w-full"
              >
                <option value="all">Filtra per cliente (Tutti)</option>
                {filteredClientsList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase font-black text-stone-400 block tracking-wider">Mostrando per filtri</span>
            <b className="text-[14px] text-green-400 block font-extrabold mt-0.5">
              {selectedSector !== 'all' ? selectedSector.toUpperCase() : 'Tutti i settori'} 
              {selectedClient !== 'all' ? ` — ${selectedClient}` : ''}
            </b>
          </div>
        </div>
      </div>

      {/* SWISS TAB CONTROLLER CONTROLLER */}
      <div className="flex border-b border-[#e5e5e5] gap-1 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-stone-200">
        <button
          onClick={() => setActiveTab('panoramica')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'panoramica' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Activity className="w-4 h-4" /> Panoramica & Banca
        </button>
        <button
          onClick={() => setActiveTab('preventivi')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'preventivi' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Preventivi & Parcelle
        </button>
        <button
          onClick={() => setActiveTab('computi')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'computi' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Calculator className="w-4 h-4" /> Computi metrici
        </button>
        <button
          onClick={() => setActiveTab('parcella')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'parcella' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Percent className="w-4 h-4" /> Parcelle & Onorari
        </button>
        <button
          onClick={() => setActiveTab('fatture')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'fatture' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Fatturazione Attiva/Passiva
        </button>
        <button
          onClick={() => setActiveTab('scadenziario')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'scadenziario' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> Scadenziario Pagamenti
        </button>
        <button
          onClick={() => setActiveTab('sal')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'sal' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Collegamenti SAL
        </button>
        <button
          onClick={() => setActiveTab('conto_economico')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'conto_economico' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Conto Economico
        </button>
        <button
          onClick={() => setActiveTab('statistiche')}
          className={`flex items-center gap-1.5 py-3 px-4 text-[12.5px] font-black tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'statistiche' ? 'border-[#1b1b1b] text-[#1b1b1b]' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Statistiche & BEP
        </button>
      </div>

      {/* --- TAB CONTENT: STATISTICHE & BREAK EVEN POINT (cruscotto direzionale, ex voce sidebar) --- */}
      {activeTab === 'statistiche' && (
        <StatsView
          projects={projects}
          invoicesActive={activeInvoices}
          invoicesPassive={passiveInvoices}
          scadenze={scadenze}
          quotes={Object.values(quotes)}
          tasks={tasks}
          members={members}
          erogato={Object.values(cantSal || {}).reduce((s, m) => s + Object.values(m || {}).filter((x: any) => x.status === 'approvato').reduce((a, x: any) => a + (Number(x.importo) || 0), 0), 0)}
          onNav={(r) => { window.location.hash = r; }}
        />
      )}

      {/* --- TAB CONTENT: PREVENTIVI & PARCELLE (per società, ex voce sidebar) --- */}
      {activeTab === 'preventivi' && (
        <QuotesView
          quotes={quotes}
          clients={clientRecords}
          projects={projects}
          myUid={myUid}
          company={selectedSector}
          onSaveQuote={onSaveQuote || (() => {})}
          onDeleteQuote={onDeleteQuote || (() => {})}
          onSetStatus={onSetQuoteStatus || (() => {})}
          onEmitMilestone={onEmitMilestone || (() => {})}
        />
      )}

      {/* --- TAB CONTENT 1: PANORAMICA & BANCA SYSTEM --- */}
      {activeTab === 'panoramica' && (
        <div className="flex flex-col gap-6">
          {/* KPI Display Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4 shadow-sm">
              <span className="text-[10px] uppercase font-black text-[#8a8a8a] tracking-widest block">Fatturato per Filtro</span>
              <div className="text-[22px] font-black text-[#1b1b1b] mt-1">{eur(totalInvoiced)}</div>
              <p className="text-[11px] text-[#666] mt-0.5">Fatturato attivo valido</p>
            </div>

            <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4 shadow-sm">
              <span className="text-[10px] uppercase font-black text-green-600 tracking-widest block">Incassato Reale</span>
              <div className="text-[22px] font-black text-green-700 mt-1">{eur(totalInterestsPaid)}</div>
              <p className="text-[11px] text-[#666] mt-0.5">Importi già riconciliati</p>
            </div>

            <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4 shadow-sm">
              <span className="text-[10px] uppercase font-black text-amber-600 tracking-widest block">Crediti Eccezionali</span>
              <div className="text-[22px] font-black text-amber-700 mt-1">{eur(currentOutstandingAccounts)}</div>
              <p className="text-[11px] text-[#666] mt-0.5">In attesa di incasso o sollecito</p>
            </div>

            <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4 shadow-sm">
              <span className="text-[10px] uppercase font-black text-red-600 tracking-widest block">Fatturato Passivo Spese</span>
              <div className="text-[22px] font-black text-red-700 mt-1">{eur(totalExpenses)}</div>
              <p className="text-[11px] text-[#666] mt-0.5">Uscite passive registrate</p>
            </div>
          </div>

          {/* DYNAMIC CASH FLOW GRAPH */}
          <div className="bg-white border border-[#e2e2e2] rounded-[28px] p-5 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Analisi Previsionale Economica <span className="text-amber-600">· Simulato</span></span>
                <h3 className="text-[17px] font-extrabold text-[#1a1a1a] tracking-tight">Proiezione Cash Flow Aziendale Globale (6 Mesi)</h3>
              </div>
              <div className="text-left sm:text-right text-[11px] font-bold text-stone-500">
                Stima basata su scadenze contrattuali e fatture attive in essere.
              </div>
            </div>

            {/* Custom SVG Line/Bar Chart designed for pixel perfection */}
            <div className="py-2 overflow-x-auto scrollbar-none">
              <div className="flex items-end justify-between gap-2 h-44 border-b border-stone-100 min-w-[480px] pb-1">
                {[
                  { m: 'Giu 2026', cash: 18500, out: 14000, active: true },
                  { m: 'Lug 2026', cash: 26500, out: 1200, active: true },
                  { m: 'Ago 2026', cash: 32000, out: 600, active: false },
                  { m: 'Set 2026', cash: 38200, out: 3000, active: false },
                  { m: 'Ott 2026', cash: 41000, out: 0, active: false },
                  { m: 'Nov 2026', cash: 48000, out: 1500, active: false },
                ].map((item, i) => {
                  const maxPercent = 55000;
                  const flowH = Math.max(10, (item.cash / maxPercent) * 100);
                  const spendH = Math.max(4, (item.out / maxPercent) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative cursor-help">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-[#1b1b1b] text-white text-[10px] p-2.5 rounded-xl hidden group-hover:block z-25 min-w-[130px] font-sans shadow-md border border-stone-850">
                        <b className="block text-stone-400 uppercase tracking-wide text-[8px]">{item.m}</b>
                        <span className="block mt-1 font-semibold">Cassa Proiettata: <span className="text-green-400 font-extrabold">{eur(item.cash)}</span></span>
                        <span className="block text-red-300">Spese Previste: <span className="font-extrabold">{eur(item.out)}</span></span>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        {/* Outflows pillar */}
                        <div 
                          style={{ height: `${spendH}%` }} 
                          className="w-2.5 bg-red-400 rounded-t-sm transition-all duration-300 group-hover:bg-red-500" 
                        />
                        {/* Projected Cash Pillar */}
                        <div 
                          style={{ height: `${flowH}%` }} 
                          className={`w-4 rounded-t-sm transition-all duration-300 ${
                            item.active ? 'bg-zinc-800 group-hover:bg-black' : 'bg-zinc-400 group-hover:bg-zinc-500'
                          }`} 
                        />
                      </div>
                      <span className="text-[10px] font-black text-stone-500 mt-2 block">{item.m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-center mt-3 text-[11px] font-bold text-stone-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-800 inline-block" /> Cassa Prevista Attiva</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-400 inline-block" /> Mesi futuri stimati</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Uscite monetarie stimate</span>
            </div>
          </div>

          {/* INTEGRATION BANCA AND AUTOMATIC RECONCILIATION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bank Open Banking Panel */}
            <div className="lg:col-span-8 bg-white border border-[#e2e2e2] rounded-[28px] p-5 md:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Integrazione Multi-Cash Privata</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-[16px] font-black text-[#1a1a1a]">Flusso Bancario d'Impresa UNICREDIT (Simulato)</h3>
                    <span className="bg-green-100 text-green-800 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">● Connesso API</span>
                  </div>
                </div>
                
                <button
                  onClick={handleBankSync}
                  disabled={isSyncingBank}
                  className="btn btn-sm text-[11.5px] font-extrabold bg-[#1b1b1b] text-white hover:bg-black px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBank ? 'animate-spin' : ''}`} />
                  Sincronizza Estratto Conto
                </button>
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#e2e2e2] bg-[#fafafa]">
                      <th className="py-2.5 px-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">Data</th>
                      <th className="py-2.5 px-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">Causale Movimento</th>
                      <th className="py-2.5 px-3 text-right text-[10px] font-black text-stone-500 uppercase tracking-wider">Importo (€)</th>
                      <th className="py-2.5 px-3 text-center text-[10px] font-black text-stone-500 uppercase tracking-wider">Riconciliazione SDI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankMovements.map(bm => {
                      // Attempt to auto search matching active invoice code by parsing simple rules
                      const isUnreconciledInflow = !bm.reconciled && bm.amount > 0;
                      // Let's search if any active invoice matches the amount
                      const matchedInvoice = isUnreconciledInflow 
                        ? activeInvoices.find(i => i.amount === bm.amount && i.status !== 'pagata')
                        : null;

                      return (
                        <tr key={bm.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors last:border-0">
                          <td className="py-3 px-3 text-[12px] font-bold text-stone-600">{fmtDay(bm.date)}</td>
                          <td className="py-3 px-3 text-[12px] font-semibold text-[#1a1a1a]">
                            <span>{bm.desc}</span>
                            {bm.reconciled && (
                              <span className="block text-[10px] text-zinc-500 mt-0.5">
                                Codice collegato: <span className="font-extrabold text-blue-800 bg-blue-50 px-1 py-0.2 rounded">{bm.linkedInvoiceId || 'FP-01'}</span>
                              </span>
                            )}
                          </td>
                          <td className={`py-3 px-3 text-right font-extrabold text-[13px] ${
                            bm.amount > 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {bm.amount > 0 ? '+' : ''}{eur(bm.amount)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {bm.reconciled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                                <Check className="w-3 h-3" /> Riconciliato
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                {matchedInvoice ? (
                                  <button
                                    onClick={() => reconcileMovement(bm.id, matchedInvoice.id)}
                                    className="text-[11px] font-extrabold whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                                  >
                                    <Link2 className="w-3 h-3" /> Associa a {matchedInvoice.id}
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-bold text-[#8a8a8a] bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-lg">
                                    Generico / Manuale
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card-List View */}
              <div className="sm:hidden flex flex-col gap-3">
                {bankMovements.map(bm => {
                  const isUnreconciledInflow = !bm.reconciled && bm.amount > 0;
                  const matchedInvoice = isUnreconciledInflow 
                    ? activeInvoices.find(i => i.amount === bm.amount && i.status !== 'pagata')
                    : null;

                  return (
                    <div key={bm.id} className="bg-stone-50/50 p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col gap-3 text-left">
                      <div className="flex justify-between items-center pb-2.5 border-b border-stone-150">
                        <span className="text-[11.5px] font-bold text-stone-500 font-mono">{fmtDay(bm.date)}</span>
                        <span className={`font-black text-[14px] font-mono ${bm.amount > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {bm.amount > 0 ? '+' : ''}{eur(bm.amount)}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-[#1a1a1a]">{bm.desc}</p>
                        {bm.reconciled && (
                          <span className="inline-block text-[10.5px] text-stone-500 mt-1.5 font-medium">
                            Codice collegato: <span className="font-extrabold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-mono">{bm.linkedInvoiceId || 'FP-01'}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-stone-150 bg-stone-100/50 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Riconciliazione SDI</span>
                        {bm.reconciled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                            <Check className="w-3 h-3" /> Riconciliato
                          </span>
                        ) : (
                          <div>
                            {matchedInvoice ? (
                              <button
                                onClick={() => reconcileMovement(bm.id, matchedInvoice.id)}
                                className="text-[11px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                              >
                                <Link2 className="w-3 h-3" /> Associa a {matchedInvoice.id}
                              </button>
                            ) : (
                              <span className="text-[11px] font-extrabold text-stone-500 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-lg">
                                Generico / Manuale
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary of Cash Burn & Runway Info */}
            <div className="lg:col-span-4 bg-white border border-[#e2e2e2] rounded-[28px] p-5 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-[#8a8a8a] uppercase tracking-widest block">Metrica di Sostenibilità <span className="text-amber-600">· Simulato</span></span>
                <h4 className="text-[15px] font-black text-[#1a1a1a] mt-0.5">Cash Runway & Burn Rate</h4>
                <p className="text-[12px] text-stone-500 mt-1 leading-normal">
                  Indicatore basato sul tasso medio di uscite fisse dei fornitori del mese corrente.
                </p>

                <div className="bg-[#fcfdfc] border border-green-200 p-4 rounded-2xl mt-4">
                  <span className="text-[10.5px] font-bold text-green-800 uppercase block">Runway in Mesi</span>
                  <div className="text-[28px] font-black text-green-900 mt-1">24.5 Mesi</div>
                  <p className="text-[11.5px] text-stone-600 mt-1 leading-normal">
                    La liquidità attuale consente l’operatività anche in assenza di nuovi contratti stipulati.
                  </p>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 mt-4">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#1a1a1a]">
                  <ShieldCheck className="text-[#1a1a1a] w-5 h-5 flex-shrink-0" />
                  <span>Protocollo Fiscale Certificato SDI</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Tracciamento digitale in linea con le direttive Agenzia delle Entrate per il regime forfettario e ordinario 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2: PREVENTIVI E COMPUTI METRICI (CUSTOMIZABLE) --- */}
      {activeTab === 'computi' && (
        <div className="bg-white border border-[#e2e2e2] rounded-[28px] p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-stone-100">
            <div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Redazione Tecnica Estimativa</span>
              <h2 className="text-[19px] font-extrabold tracking-tight text-[#161616]">Computo Metrico Estimativo e Finiture</h2>
              <span className="text-[12.5px] text-[#8a8a8a]">Gestisci e personalizza le voci per tipologia di lavoro dei progetti attivi</span>
            </div>
            
            {/* Inizializza Computo */}
            <div className="flex items-center gap-2">
              <select
                value={activeProjectForComputo}
                onChange={(e) => setActiveProjectForComputo(e.target.value)}
                className="select select-sm text-[12px] h-9"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={handleCreateNewComputo}
                className="btn btn-sm bg-[#1b1b1b] text-white hover:bg-black font-bold h-9 px-3 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nuovo Computo
              </button>
            </div>
          </div>

          {/* MAIN COMPUTI METRICI LIST */}
          <div className="flex flex-col gap-8">
            {computi.map(comp => {
              // Match project & client details
              const correlatedProj = projects.find(p => p.id === comp.projectId);
              
              // Apply top filters
              const isFilteredOutSector = !matchesSector(projCompany(correlatedProj));
              const isFilteredOutClient = selectedClient !== 'all' && correlatedProj?.client !== selectedClient;

              if (isFilteredOutSector || isFilteredOutClient) {
                return null;
              }

              const sumTotal = comp.items.reduce((acc, current) => acc + (current.quantity * current.unitPrice), 0);
              
              return (
                <div key={comp.id} className="border border-[#e5e5e5] rounded-2xl p-5 bg-[#fafafa]">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-zinc-805 text-white px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
                          {correlatedProj?.division || 'Studio'}
                        </span>
                        <h3 className="text-[15px] font-black text-[#1b1b1b]">{comp.title}</h3>
                      </div>
                      <p className="text-[12px] font-semibold text-stone-500 mt-1">
                        Cliente: <span className="text-[#1a1a1a]">{correlatedProj?.client || 'Cliente Studio'}</span> | Località: <span className="text-[#1a1a1a]">{correlatedProj?.location || 'Italia'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-black text-stone-400 block tracking-wider">Importo Totale Computato</span>
                      <strong className="text-[18px] font-black text-green-700">{eur(sumTotal)}</strong>
                    </div>
                  </div>

                  {/* Voci di Computo Item Table - Desktop Only */}
                  <div className="hidden sm:block overflow-x-auto bg-white rounded-xl border border-[#e5e5e5] shadow-xs">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#e2e2e2] bg-[#fdfdfd]">
                          <th className="py-2 px-3 text-[11px] font-bold text-stone-500">Descrizione dell'intervento / Lavoro</th>
                          <th className="py-2 px-3 text-[11px] font-bold text-stone-500">Categoria</th>
                          <th className="py-2 px-3 text-right text-[11px] font-bold text-stone-500">Q.tà</th>
                          <th className="py-2 px-3 text-right text-[11px] font-bold text-stone-500">P. Unitario</th>
                          <th className="py-2 px-3 text-right text-[11px] font-bold text-stone-500">Totale voce</th>
                          <th className="py-2 px-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {comp.items.map((it, idx) => (
                          <tr key={it.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] last:border-0 test-row">
                            <td className="py-2.5 px-3 text-[12.5px] font-bold text-[#1a1a1a]">{it.desc}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="text-[10px] font-extrabold bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                                {it.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-[12.5px] font-medium text-stone-600">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-[12.5px] font-medium text-stone-600">{eur(it.unitPrice)}</td>
                            <td className="py-2.5 px-3 text-right text-[12.5px] font-extrabold text-[#1a1a1a]">{eur(it.quantity * it.unitPrice)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteComputoItem(comp.id, it.id)}
                                className="text-red-500 hover:text-red-800 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Voci di Computo - Mobile Only Responsive Cards list */}
                  <div className="sm:hidden flex flex-col gap-3.5">
                    {comp.items.map((it, idx) => (
                      <div key={it.id} className="bg-white p-4 rounded-2xl border border-stone-250 shadow-xs flex flex-col gap-2.5 text-left">
                        <div className="flex justify-between items-start gap-2">
                          <b className="text-[14px] font-black text-stone-900 leading-tight">{it.desc}</b>
                          <button
                            onClick={() => handleDeleteComputoItem(comp.id, it.id)}
                            className="text-red-500 hover:text-red-800 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-lg border border-stone-200 uppercase">
                            {it.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2.5 border-t border-stone-150 font-mono text-[12px]">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 block mb-0.5">Q.tà</span>
                            <b className="text-stone-700">{it.quantity}</b>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 block mb-0.5">P. Unitario</span>
                            <b className="text-stone-700">{eur(it.unitPrice)}</b>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 block mb-0.5">Totale</span>
                            <b className="text-emerald-700 font-black">{eur(it.quantity * it.unitPrice)}</b>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* FORM TO ADD A ROW TO THE COMPUTO */}
                  <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4 flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Descrizione lavoro personalizzabile</label>
                      <input
                        type="text"
                        placeholder="Es. Rasatura intonaco o Fornitura rubinetteria"
                        value={newCompDesc}
                        onChange={(e) => setNewCompDesc(e.target.value)}
                        className="input h-8 text-[12px] bg-[#fafafa]"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Categoria</label>
                      <select
                        value={newCompCat}
                        onChange={(e) => setNewCompCat(e.target.value)}
                        className="select h-8 py-0.5 text-[11.5px] font-bold bg-[#fafafa]"
                      >
                        <option value="Opere Edili">Opere Edili</option>
                        <option value="Demolizioni">Demolizioni</option>
                        <option value="Murature">Murature</option>
                        <option value="Impianti">Impianti</option>
                        <option value="Finiture">Finiture</option>
                        <option value="Infissi">Infissi</option>
                        <option value="Strategia">Strategia</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Development">Development</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Q.tà</label>
                      <input
                        type="number"
                        placeholder="es. 10"
                        value={newCompQty}
                        onChange={(e) => setNewCompQty(e.target.value)}
                        className="input h-8 text-[12px] bg-[#fafafa]"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Prezzo (€)</label>
                      <input
                        type="number"
                        placeholder="es. 45"
                        value={newCompPrice}
                        onChange={(e) => setNewCompPrice(e.target.value)}
                        className="input h-8 text-[12px] bg-[#fafafa]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        onClick={() => handleAddComputoItem(comp.id)}
                        className="btn bg-[#1b1b1b] text-white hover:bg-black text-[11px] font-bold w-full h-8 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Aggiungi Riga
                      </button>
                    </div>
                  </div>

                  {/* IMPORT DA FILE (.csv/.tsv parse; .xlsx/.pdf allegato) */}
                  <div className="bg-white border border-dashed border-[#d4d4d4] rounded-xl p-3.5 mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11.5px] text-stone-600 font-semibold">
                      <Upload className="w-4 h-4 text-stone-500" />
                      <span>Importa voci da <b>CSV</b> · Excel/PDF allegati come riferimento</span>
                      {comp.sourceFileName && (
                        <span className="text-[10.5px] bg-stone-100 border border-stone-200 px-2 py-0.5 rounded font-bold text-stone-700">📎 {comp.sourceFileName}</span>
                      )}
                    </div>
                    <label className="btn text-[11px] py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-xl flex items-center gap-1 border-0 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> Carica file
                      <input
                        type="file"
                        accept=".csv,.tsv,.txt,.xlsx,.xls,.pdf"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleComputoFile(comp.id, f); e.currentTarget.value = ''; }}
                      />
                    </label>
                  </div>

                  {/* PANNELLO MAPPATURA COLONNE (dopo parsing CSV) */}
                  {importComputoId === comp.id && importSheet && importMapping && (
                    <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <b className="text-[12.5px] text-stone-850">Mappa le colonne del file <span className="font-mono text-[11px]">{importFileName}</span></b>
                        <span className="text-[10.5px] text-stone-500">{importSheet.rows.length} righe rilevate</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {([
                          { key: 'desc', label: 'Descrizione' },
                          { key: 'category', label: 'Categoria' },
                          { key: 'quantity', label: 'Q.tà' },
                          { key: 'unitPrice', label: 'Prezzo unit.' }
                        ] as { key: keyof ColumnMapping; label: string }[]).map(({ key, label }) => (
                          <div key={key} className="flex flex-col gap-1 text-left">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">{label}</label>
                            <select
                              value={importMapping[key]}
                              onChange={(e) => setImportMapping({ ...importMapping, [key]: Number(e.target.value) })}
                              className="select h-8 py-0.5 text-[11.5px] bg-white"
                            >
                              <option value={-1}>— ignora —</option>
                              {importSheet.headers.map((h, i) => (
                                <option key={i} value={i}>{h || `Col ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={cancelImport} className="btn text-[11px] py-1.5 px-3 bg-stone-100 hover:bg-stone-200 rounded-xl border-0 cursor-pointer">Annulla</button>
                        <button onClick={confirmImport} className="btn text-[11px] py-1.5 px-3 bg-[#1b1b1b] hover:bg-black text-white rounded-xl border-0 cursor-pointer flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Importa voci
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PREVENTIVO ACTION TOOLBAR */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => triggerToast(`📊 Esportazione in corso per: ${comp.title}...`)}
                      className="btn text-[11.5px] py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-xl flex items-center gap-1 border-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Esporta Computo XLS
                    </button>
                    <button
                      onClick={() => triggerToast(`🖨️ Stampa preventiva pronta per il cantiere!`)}
                      className="btn text-[11.5px] py-1.5 bg-[#1b1b1b] hover:bg-black text-white rounded-xl flex items-center gap-1 border-0 cursor-pointer"
                    >
                      📃 Stampa Stampabile PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2b: PARCELLE & ONORARI (motore finanziario) --- */}
      {activeTab === 'parcella' && (
        <div className="bg-white border border-[#e2e2e2] rounded-[28px] p-5 md:p-6 shadow-sm">
          <div className="pb-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Calcolo automatico onorari Studio</span>
              <h2 className="text-[19px] font-extrabold tracking-tight text-[#161616]">Parcelle & Onorari di commessa</h2>
              <span className="text-[12.5px] text-[#8a8a8a]">
                15% su (computo lavori + arredi fissi e finiture) + 20% sugli arredi mobili se gestiti dallo Studio.
                Concorrono solo gli arredi <b>confermati</b>. Pagamento a SAL.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            {projects.map((proj) => {
              if (!matchesSector(projCompany(proj))) return null;
              if (selectedClient !== 'all' && proj.client !== selectedClient) return null;
              const parc = parcellaByProject[proj.id];
              if (!parc) return null;
              const computoTot = computoByProject[proj.id] || 0;
              return (
                <div key={proj.id} className="border border-stone-200 rounded-2xl p-5 bg-stone-50/30">
                  <div className="flex justify-between items-start gap-3 border-b border-stone-150 pb-3 mb-4">
                    <div>
                      <h4 className="text-[15px] font-black text-[#1a1a1a]">{proj.name}</h4>
                      <span className="text-[11px] text-stone-500 font-semibold">{proj.client || 'Cliente Studio'}</span>
                    </div>
                    <span className="text-[10.5px] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg font-black uppercase">
                      {COMPANY_LABEL[projCompany(proj)]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-stone-200 rounded-xl p-3">
                      <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Computo lavori</span>
                      <b className="text-[14px] font-black text-[#1a1a1a]">{eur(computoTot)}</b>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-xl p-3">
                      <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Arredi fissi e finiture</span>
                      <b className="text-[14px] font-black text-[#1a1a1a]">{eur(parc.arrediFissi)}</b>
                      <span className="text-[9px] text-stone-400 block mt-0.5">solo confermati</span>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-xl p-3">
                      <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Base opera</span>
                      <b className="text-[14px] font-black text-[#1a1a1a]">{eur(parc.baseOpera)}</b>
                    </div>
                    <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3">
                      <span className="text-[9.5px] uppercase font-black text-indigo-700 tracking-wider block">Onorari {Math.round(parc.feePct * 100)}%</span>
                      <b className="text-[14px] font-black text-indigo-800">{eur(parc.onorari)}</b>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="bg-white border border-stone-200 rounded-xl p-3">
                      <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Arredi mobili <span className="normal-case text-stone-300">(confermati)</span></span>
                      <b className="text-[14px] font-black text-[#1a1a1a]">{eur(parc.arrediMobili)}</b>
                      <span className="text-[10px] text-stone-500 block mt-0.5">{parc.managesMobili ? `Gestiti dallo Studio · fee ${Math.round(parc.mobiliFeePct * 100)}%` : 'Gestiti dal cliente · nessuna fee'}</span>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-xl p-3">
                      <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Fee arredi mobili</span>
                      <b className="text-[14px] font-black text-indigo-800">{eur(parc.feeMobili)}</b>
                    </div>
                    <div className="bg-[#1b1b1b] text-white rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Totale parcella Studio</span>
                      <b className="text-[18px] font-black text-green-400">{eur(parc.totaleParcella)}</b>
                    </div>
                  </div>

                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => setActiveTab('sal')}
                      className="text-[11px] font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-850 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" /> Genera SAL dalla parcella
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 3: FATTURAZIONE E SDI --- */}
      {activeTab === 'fatture' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Invoices Panel */}
          <div className="lg:col-span-7 bg-white border border-[#e2e2e2] rounded-[28px] p-5 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">SDI Registro Fatture Attive</span>
                <h3 className="text-[17px] font-extrabold text-[#1a1a1a] tracking-tight">Fatturazione Elettronica Attiva</h3>
              </div>
            </div>

            {/* Invoices list */}
            <div className="flex flex-col gap-4">
              {filteredActiveInvoices.map(inv => {
                let badgeClass = "bg-stone-100 text-stone-800";
                if (inv.status === 'pagata') badgeClass = "bg-green-100 text-green-800";
                if (inv.status === 'inviata_sdi') badgeClass = "bg-blue-105 text-blue-800";
                if (inv.status === 'consegnata_sdi') badgeClass = "bg-amber-100 text-amber-850 animate-[pulse_2s_infinite]";

                return (
                  <div key={inv.id} className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black text-stone-850 uppercase bg-stone-200 px-2 py-0.5 rounded">
                          {inv.id}
                        </span>
                        <span className="text-[11px] text-stone-500 font-semibold">{fmtDay(inv.date)}</span>
                        {inv.isSal && (
                          <span className="bg-blue-50 text-blue-800 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-blue-200">
                            SAL {inv.salNumber}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 text-left">
                        <b className="text-[14px] font-black text-[#1a1a1a] tracking-tight">{inv.clientName}</b>
                        <span className="block text-[11px] text-stone-500 truncate mt-0.5">{inv.projectName}</span>
                      </div>

                      <div className="mt-2 text-[10.5px] text-zinc-500 font-bold text-left">
                        Cod. SDI: <span className="font-mono bg-stone-100 text-[#121212] px-1 rounded">{inv.sdiCode}</span> | IVA: {inv.taxRate > 0 ? `${inv.taxRate}%` : 'no'}{(inv.cassaPct || 0) > 0 ? ` | Cassa: ${inv.cassaPct}%` : ''}
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-200/60 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <div className="text-[15px] font-black text-[#1b1b1b] sm:mb-0.5">{eur(inv.amount)}</div>
                        {(inv.taxRate > 0 || (inv.cassaPct || 0) > 0) && (
                          <div className="text-[10px] font-bold text-stone-500 sm:mb-0.5">tot. doc. {eur(invoiceTotals(inv).totale)}</div>
                        )}
                        <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${badgeClass}`}>
                          {inv.status}
                        </span>
                      </div>
                      
                      {inv.status === 'bozza' && (
                        <button
                          onClick={() => handleTransmitSDI(inv.id)}
                          className="text-[11px] font-extrabold text-blue-600 bg-blue-50/50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                        >
                          Invia a SDI 🚀
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredActiveInvoices.length === 0 && (
                <div className="text-center py-8 text-[#8a8a8a]">
                  Nessuna fattura attiva individuata per la selezione corrente.
                </div>
              )}
            </div>

            {/* Live New Active Invoice Setup Wrapper Form */}
            <form onSubmit={handleAddActiveInvoice} className="bg-[#fafafa] border border-stone-200 rounded-2xl p-4 mt-6">
              <h4 className="text-[13px] font-black text-stone-850 flex items-center gap-1">
                <Plus className="w-4 h-4 text-stone-550" /> Generatore Bozza Fattura Elettronica SDI
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5">Emetti bozza di fattura da trasmettere elettronicamente all’agenzia entrate.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Seleziona Cliente</label>
                  <select
                    value={invClient}
                    onChange={(e) => {
                      setInvClient(e.target.value);
                      // Set associated project ID automatically
                      const relative = projects.find(p => p.client === e.target.value);
                      if (relative) setInvProjId(relative.id);
                    }}
                    className="select select-sm text-[11.5px]"
                  >
                    <option value="">-- Seleziona Cl. --</option>
                    {allClientsList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Commessa Progetto</label>
                  <select
                    value={invProjId}
                    onChange={(e) => setInvProjId(e.target.value)}
                    className="select select-sm text-[11.5px]"
                  >
                    <option value="">-- Scegli commessa --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Importo Imponibile (€)</label>
                  <input
                    type="number"
                    placeholder="es. 3200"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="input h-8 text-[12px] bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Codice Destinatario SDI</label>
                  <input
                    type="text"
                    value={invSdi}
                    onChange={(e) => setInvSdi(e.target.value)}
                    className="input h-8 text-[12px] bg-white font-mono"
                  />
                </div>
              </div>

              {/* IVA & Cassa previdenziale spuntabili */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3.5">
                <label className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={invVatOn} onChange={(e) => setInvVatOn(e.target.checked)} className="w-4 h-4 accent-[#161616] cursor-pointer" />
                  <span className="text-[12px] font-bold text-stone-800 flex-1">IVA</span>
                  <select value={invTax} onChange={(e) => setInvTax(Number(e.target.value))} disabled={!invVatOn} className="bg-transparent text-[11.5px] font-extrabold focus:ring-0 cursor-pointer disabled:opacity-40">
                    <option value="22">22% Ordinario</option>
                    <option value="10">10% Ristrutturazioni</option>
                    <option value="4">4% Agevolato prima casa</option>
                  </select>
                </label>
                <label className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={invCassaOn} onChange={(e) => setInvCassaOn(e.target.checked)} className="w-4 h-4 accent-[#161616] cursor-pointer" />
                  <span className="text-[12px] font-bold text-stone-800 flex-1">Cassa previdenziale</span>
                  <input
                    value={invCassaPct}
                    onChange={(e) => setInvCassaPct(Number(String(e.target.value).replace(',', '.')) || 0)}
                    disabled={!invCassaOn}
                    inputMode="decimal"
                    className="w-[52px] text-right text-[11.5px] font-extrabold bg-transparent border border-stone-200 rounded-lg px-1.5 py-0.5 outline-none disabled:opacity-40"
                  />
                  <span className="text-[11px] font-bold text-stone-500">%</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 mt-4">
                <span className="text-[11px] text-stone-500 font-semibold">
                  {(() => {
                    const val = parseFloat(invAmount) || 0;
                    if (!val) return 'Totale documento: —';
                    const t = invoiceTotals({ amount: val, taxRate: invVatOn ? invTax : 0, cassaPct: invCassaOn ? invCassaPct : null });
                    return <>Totale documento: <b className="text-stone-800">{eur(t.totale)}</b>{t.cassa > 0 && <> (cassa {eur(t.cassa)})</>}{t.iva > 0 && <> (IVA {eur(t.iva)})</>}</>;
                  })()}
                </span>

                <button
                  type="submit"
                  className="btn bg-[#1b1b1b] text-white hover:bg-black font-extrabold text-[11.5px] px-3.5 py-1.5 rounded-xl cursor-pointer"
                >
                  Salva in Bozza
                </button>
              </div>
            </form>
          </div>

          {/* Passive Invoices panel for suppliers */}
          <div className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[28px] p-5 shadow-sm">
            <div>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">Uscite passive e subappalti</span>
              <h3 className="text-[17px] font-extrabold text-[#1a1a1a] tracking-tight">Fatturazione Passiva (Fornitori)</h3>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              {filteredPassiveInvoices.map(fp => {
                return (
                  <div key={fp.id} className="border border-stone-250 p-3.5 rounded-2xl bg-stone-50/20 hover:bg-stone-50/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold bg-[#ffebeb] text-red-700 px-2 py-0.5 rounded">
                        {fp.id}
                      </span>
                      <span className="text-[12px] font-extrabold text-stone-700">{eur(fp.amount)}</span>
                    </div>

                    <div className="mt-2 text-[13px] font-extrabold text-[#1a1a1a]">{fp.supplierName}</div>
                    <p className="text-[11px] text-stone-500 mt-0.5 italic">{fp.description}</p>
                    
                    <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-stone-500 font-semibold border-t border-stone-100 pt-2">
                      <span>Scadenza: {fmtDay(fp.dueDate)}</span>
                      <span className={`uppercase font-black block text-[9.5px] ${fp.status === 'pagata' ? 'text-green-700' : 'text-red-700'}`}>
                        {fp.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredPassiveInvoices.length === 0 && (
                <div className="text-center py-6 text-[#8a8a8a]">
                  Nessuna fattura passiva trovata per la selezione.
                </div>
              )}
            </div>

            {/* Form to submit a passive invoice */}
            <form onSubmit={handleAddPassiveInvoice} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mt-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#8a8a8a] block">Registra Documento Fornitore</span>
              <h4 className="text-[13.5px] font-black text-stone-750 mt-0.5">Sottomissione Fattura Passiva</h4>

              <div className="flex flex-col gap-3 mt-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10.5px] font-bold text-stone-500">Ragione Sociale Fornitore Partner</label>
                  <input
                    type="text"
                    placeholder="Es. Resine d'Arte Apulia o Alluminio d'Apulia"
                    value={pasSupplier}
                    onChange={(e) => setPasSupplier(e.target.value)}
                    className="input h-8 text-[12px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Commessa Associata</label>
                  <select
                    value={pasProjId}
                    onChange={(e) => setPasProjId(e.target.value)}
                    className="select h-8 py-0.5 text-[11.5px]"
                  >
                    <option value="">-- Sotto-Spesa Libera Studio --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500">Importo Tot. Lordo (€)</label>
                    <input
                      type="number"
                      placeholder="es. 1400"
                      value={pasAmount}
                      onChange={(e) => setPasAmount(e.target.value)}
                      className="input h-8 text-[12px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500">Categoria Costo</label>
                    <select
                      value={pasCat}
                      onChange={(e) => setPasCat(e.target.value)}
                      className="select h-8 py-0.5 text-[11.5px]"
                    >
                      <option value="Materiali">Materiali</option>
                      <option value="Noleggi">Noleggi</option>
                      <option value="Subappaltatori">Subappalti</option>
                      <option value="Consulenze">Consulenze</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-stone-500">Descrizione sintetica della fornitura</label>
                  <input
                    type="text"
                    placeholder="Sostituzione infissi o materiali posa"
                    value={pasDesc}
                    onChange={(e) => setPasDesc(e.target.value)}
                    className="input h-8 text-[12px]"
                  />
                </div>

                <button
                  type="submit"
                  className="btn bg-[#1b1b1b] text-white hover:bg-black font-extrabold text-[11.5px] h-9 rounded-xl mt-2 cursor-pointer"
                >
                  Registra Fattura Passiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 4: SCADENZIARIO & INCASSI/USCITE --- */}
      {activeTab === 'scadenziario' && (
        <div className="bg-white border border-[#e2e2e2] rounded-[28px] p-5 md:p-6 shadow-sm">
          <div className="pb-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Scadenze Cronologiche Monetarie</span>
              <h2 className="text-[19px] font-extrabold text-[#161616]">Scadenziario Pagamenti (Incassi e Uscite)</h2>
              <span className="text-[12.5px] text-[#8a8a8a]">Flusso temporale dei flussi di cassa programmati ed eseguiti</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
            {/* INFLOWS / INCASSI */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <h4 className="text-[14px] font-black text-green-900 uppercase tracking-wide">Incassi Previsti (Entrate)</h4>
              </div>

              <div className="flex flex-col gap-3">
                {filteredScadenze.filter(s => s.kind === 'entrata').map(sc => {
                  return (
                    <div key={sc.id} className="border border-stone-200 p-4 rounded-2xl bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 transition-all hover:border-stone-300">
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            sc.status === 'pagato' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sc.status === 'pagato' ? 'Incassato' : 'In attesa'}
                          </span>
                          <span className="text-[11px] text-stone-400 font-bold">Scad. {fmtDay(sc.dueDate)}</span>
                        </div>
                        <div className="text-[13.5px] font-black text-[#111] mt-2 leading-snug">{sc.desc}</div>
                        <span className="text-[11.5px] text-stone-500 font-semibold block mt-0.5">{sc.clientOrSupplier}</span>
                      </div>

                      <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-150 w-full sm:w-auto">
                        <strong className="text-[15px] font-black text-green-700">+{eur(sc.amount)}</strong>
                        {sc.status !== 'pagato' && (
                          <button
                            onClick={() => handleRegisterPaymentFromScadenza(sc.id)}
                            className="bg-green-700 hover:bg-green-900 text-white text-[10.5px] font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs transition-colors"
                          >
                            Registra Incasso ✔
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OUTFLOWS / USCITE */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h4 className="text-[14px] font-black text-red-900 uppercase tracking-wide">Scadenze Uscite (Spese/Fornitori)</h4>
              </div>

              <div className="flex flex-col gap-3">
                {filteredScadenze.filter(s => s.kind === 'uscita').map(sc => {
                  return (
                    <div key={sc.id} className="border border-stone-200 p-4 rounded-2xl bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 transition-all hover:border-stone-300">
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            sc.status === 'pagato' ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'
                          }`}>
                            {sc.status === 'pagato' ? 'Saldato' : 'Da pagare'}
                          </span>
                          <span className="text-[11px] text-stone-400 font-bold">Scad. {fmtDay(sc.dueDate)}</span>
                        </div>
                        <div className="text-[13.5px] font-black text-[#111] mt-2 leading-snug">{sc.desc}</div>
                        <span className="text-[11.5px] text-stone-500 font-semibold block mt-0.5">{sc.clientOrSupplier}</span>
                      </div>

                      <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-150 w-full sm:w-auto">
                        <strong className="text-[15px] font-black text-red-700">-{eur(sc.amount)}</strong>
                        {sc.status !== 'pagato' && (
                          <button
                            onClick={() => handleRegisterPaymentFromScadenza(sc.id)}
                            className="bg-red-700 hover:bg-red-900 text-white text-[10.5px] font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs transition-colors"
                          >
                            Saldato ✔
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 5: SAL FINANZIARI E SAL TECNICI --- */}
      {activeTab === 'sal' && (
        <div className="bg-white border border-[#e2e2e2] rounded-[28px] p-5 md:p-6 shadow-sm animate-fadeIn">
          <div className="pb-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">Asseverazione e Fatturazione a tappe</span>
              <h2 className="text-[19px] font-extrabold tracking-tight text-[#161616]">SAL Finanziari Collegati ai SAL Tecnici</h2>
              <span className="text-[12.5px] text-[#8a8a8a]">Verifica l'avanzamento dei lavori reali e genera istantaneamente lo stato di cassa corrispondente</span>
            </div>
          </div>

          {/* SAL di CANTIERE approvati dallo studio → bozza fattura (modulo Cantiere) */}
          {cantiereSalToBill.length > 0 && (
            <div className="mt-4 border border-emerald-200 bg-emerald-50/40 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-emerald-700" />
                <h4 className="text-[13px] font-black text-emerald-800 uppercase tracking-wide">SAL di Cantiere approvati — pronti per la fattura</h4>
              </div>
              <div className="flex flex-col gap-2">
                {cantiereSalToBill.map(({ cid, sal, proj }) => (
                  <div key={`${cid}-${sal.id}`} className="flex items-center justify-between gap-3 bg-white border border-emerald-100 rounded-xl px-3 py-2.5">
                    <div className="text-[12.5px]">
                      <span className="font-black text-[#161616]">{proj.name}</span>
                      <span className="text-stone-500"> · SAL {sal.number}{sal.descrizione ? ` — ${sal.descrizione}` : ''}</span>
                      <span className="block text-[11px] text-stone-500">{sal.importo != null ? eur(sal.importo) : 'importo non indicato'} · {COMPANY_LABEL[projCompany(proj)]}</span>
                    </div>
                    <button
                      onClick={() => handleGenerateCantiereSalInvoice(cid, sal, proj)}
                      className="shrink-0 inline-flex items-center gap-1.5 bg-[#161616] hover:bg-black text-white text-[11.5px] font-black py-2 px-3 rounded-xl cursor-pointer transition-all active:scale-95"
                    >
                      <Layers className="w-3.5 h-3.5" /> Emetti bozza fattura
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6 mt-4">
            {projects.map(proj => {
              // Filters
              const isFilteredOutSector = !matchesSector(projCompany(proj));
              const isFilteredOutClient = selectedClient !== 'all' && proj.client !== selectedClient;

              if (isFilteredOutSector || isFilteredOutClient) {
                return null;
              }

              // Access associated phases and calculate technical completion %
              const { phases: phasesList, per: salPerPhase, tot: parcellaTot } = salPlanForProject(proj);

              return (
                <div key={proj.id} className="border border-stone-200 rounded-2xl p-5 bg-stone-50/30">
                  <div className="flex justify-between items-center border-b border-stone-150 pb-3 mb-4">
                    <div>
                      <h4 className="text-[15px] font-black text-[#1a1a1a]">{proj.name}</h4>
                      <span className="text-[11px] text-stone-500 font-semibold">{proj.client}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg font-bold block">
                        {COMPANY_LABEL[projCompany(proj)]}
                      </span>
                      <span className="text-[10.5px] text-stone-500 font-bold block mt-1">Parcella: <b className="text-[#161616]">{eur(parcellaTot)}</b></span>
                    </div>
                  </div>

                  {/* Table of phase technical vs finance SAL */}
                  <div className="flex flex-col gap-3">
                    {phasesList.length === 0 ? (
                      <p className="text-[12px] text-stone-500">Nessuna fase di cantiere registrata per questa commessa.</p>
                    ) : (
                      phasesList.map((ph, idx) => {
                        // Calc technical advance %
                        const tasks = (ph.tasks ? Object.values(ph.tasks) : []) as any[];
                        const completed = tasks.filter(t => t.done).length;
                        const techPercent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

                        // Quota SAL derivata dalla parcella (ripartizione uguale sulle fasi)
                        const phaseEstimatedInflow = salPerPhase;

                        // Check if a SAL active invoice was already generated for this phase
                        let isAlreadyInvoiced = activeInvoices.some(
                          i => i.projectId === proj.id && i.isSal && i.salNumber === idx + 1
                        );

                        return (
                          <div key={ph.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-stone-150 text-left">
                            {/* Phase Header */}
                            <div className="md:col-span-4 min-w-0">
                              <span className="text-[11px] font-bold text-stone-400 block">Fase {idx + 1}</span>
                              <b className="text-[13.5px] font-black text-[#1a1a1a] block truncate mt-0.5">{ph.name}</b>
                            </div>

                            {/* Technical Progress (SAL LOGIC) */}
                            <div className="md:col-span-3">
                              <span className="text-[10px] uppercase font-black tracking-wider text-green-700 block">Progresso Tecnico Cantiere</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[12px] font-bold text-stone-700">{techPercent}%</span>
                                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden max-w-[120px]">
                                  <div 
                                    style={{ width: `${techPercent}%` }} 
                                    className={`h-full rounded-full ${techPercent === 100 ? 'bg-green-600' : 'bg-amber-500'}`} 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Financial SAL Correlated Step */}
                            <div className="md:col-span-3">
                              <span className="text-[10px] uppercase font-black text-rose-600 tracking-wider block">Quota SAL (da parcella)</span>
                              <span className="text-[13px] font-extrabold block text-stone-850 mt-0.5">{eur(phaseEstimatedInflow)}</span>
                            </div>

                            {/* Trigger action to link */}
                            <div className="md:col-span-2 text-left md:text-right flex md:block justify-between items-center pt-2 md:pt-0 border-t md:border-t-0 border-stone-200/60 w-full md:w-auto">
                              <span className="md:hidden text-[10px] font-bold text-stone-400 uppercase">Stato Azione</span>
                              {isAlreadyInvoiced ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-lg border border-green-200">
                                  ✓ SDI Inviato
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleGenerateSalInvoice(proj.id, ph.name, phaseEstimatedInflow, idx)}
                                  className="text-[10.5px] font-extrabold bg-[#1b1b1b] hover:bg-black text-white px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1 inline-flex"
                                >
                                  Emetti 1° SAL ⚡
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 6: CONTO ECONOMICO PER COMMESSA --- */}
      {activeTab === 'conto_economico' && (
        <div className="bg-white border border-[#e2e2e2] rounded-[28px] p-5 md:p-6 shadow-sm">
          <div className="pb-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Marginalità & Redditualità Commessa</span>
              <h2 className="text-[19px] font-extrabold text-[#161616]">Conto Economico di Commessa (Costi vs Ricavi)</h2>
              <span className="text-[12.5px] text-[#8a8a8a]">Dettaglio economico analitico e calcolo dei margini operativi lordi per singolo lavoro</span>
            </div>
          </div>

          {/* LIBRI PER SOCIETÀ + CONSOLIDATO HOLDING */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-stone-500" />
              <b className="text-[13px] font-black text-[#1a1a1a]">
                {selectedSector === 'consolidato' ? 'Consolidato Holding Onirico' : 'Libri per società'}
              </b>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {consolidatedBooks.books.map((b) => {
                const dim = selectedSector !== 'all' && selectedSector !== 'consolidato' && selectedSector !== b.company;
                return (
                  <div key={b.company} className={`bg-white border rounded-xl p-3 ${dim ? 'opacity-40 border-stone-150' : 'border-stone-200'}`}>
                    <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">{COMPANY_LABEL[b.company]}</span>
                    <b className="text-[14px] font-black text-[#1a1a1a] block">{eur(b.netto)}</b>
                    <span className="text-[10px] text-stone-500 block mt-0.5">R {eur(b.ricavi)} · C {eur(b.costi)}</span>
                  </div>
                );
              })}
              <div className="bg-[#1b1b1b] text-white rounded-xl p-3">
                <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Totale Gruppo</span>
                <b className="text-[14px] font-black text-green-400 block">{eur(consolidatedBooks.totale.netto)}</b>
                <span className="text-[10px] text-stone-400 block mt-0.5">R {eur(consolidatedBooks.totale.ricavi)} · C {eur(consolidatedBooks.totale.costi)}</span>
              </div>
            </div>
            <p className="text-[10.5px] text-stone-400 mt-2">
              Materico = margine sulle richieste inviate/accettate; Unico = rivendita attesa − acquisto − ristrutturazione (proiezione).
            </p>
          </div>

          {/* Desktop view */}
          <div className="hidden sm:block overflow-x-auto mt-4">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2e2e2] bg-[#fafafa]">
                  <th className="py-3 px-4 text-[11px] font-bold text-stone-500 uppercase tracking-wider">Commessa Progetto</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-stone-500 uppercase tracking-wider">Divisione</th>
                  <th className="py-3 px-4 text-right text-[11px] font-bold text-stone-500 uppercase tracking-wider">Ricavi Attivi (€)</th>
                  <th className="py-3 px-4 text-right text-[11px] font-bold text-stone-500 uppercase tracking-wider">Costi Forniture (€)</th>
                  <th className="py-3 px-4 text-right text-[11px] font-bold text-stone-500 uppercase tracking-wider">Utile Netto (€)</th>
                  <th className="py-3 px-4 text-center text-[11px] font-bold text-stone-500 uppercase tracking-wider">Margine Operativo</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(proj => {
                  // Apply Filters
                  const isFilteredOutSector = !matchesSector(projCompany(proj));
                  const isFilteredOutClient = selectedClient !== 'all' && proj.client !== selectedClient;

                  if (isFilteredOutSector || isFilteredOutClient) {
                    return null;
                  }

                  // Sum active invoice payments corresponding to this project
                  const ricavi = activeInvoices
                    .filter(i => i.projectId === proj.id)
                    .reduce((s, i) => s + i.amount, 0);

                  // Sum supplier invoices
                  const costi = passiveInvoices
                    .filter(p => p.projectId === proj.id)
                    .reduce((s, p) => s + p.amount, 0);

                  const utile = ricavi - costi;
                  const marginPercent = ricavi > 0 ? Math.round((utile / ricavi) * 100) : (costi > 0 ? -100 : 0);

                  // Division class color
                  let divBg = "bg-blue-50 text-blue-800";
                  if (proj.division === 'strategico') divBg = "bg-purple-50 text-purple-850";
                  if (proj.division === 'materico') divBg = "bg-amber-50 text-amber-850";

                  return (
                    <tr key={proj.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] last:border-0">
                      <td className="py-3.5 px-4">
                        <b className="text-[13.5px] font-black text-[#1a1a1a] block">{proj.name}</b>
                        <span className="text-[11.5px] text-stone-500 mt-0.5">{proj.client}</span>
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <span className={`text-[10.5px] font-black rounded-lg px-2 py-0.5 uppercase tracking-wide inline-block ${divBg}`}>
                          {proj.division || 'Studio'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[13px] text-green-700">
                        {eur(ricavi)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[13px] text-red-700">
                        {eur(costi)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-black text-[14px] ${utile >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {utile > 0 ? '+' : ''}{eur(utile)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block py-0.5 px-2.5 rounded-full text-[11.5px] font-black ${
                          marginPercent > 35 ? 'bg-green-100 text-green-800' : (marginPercent > 0 ? 'bg-amber-100 text-amber-850' : 'bg-red-100 text-red-800')
                        }`}>
                          {marginPercent > 0 ? `+${marginPercent}%` : `${marginPercent}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="sm:hidden flex flex-col gap-3 mt-4">
            {projects.map(proj => {
              // Apply Filters
              const isFilteredOutSector = !matchesSector(projCompany(proj));
              const isFilteredOutClient = selectedClient !== 'all' && proj.client !== selectedClient;

              if (isFilteredOutSector || isFilteredOutClient) {
                return null;
              }

              // Sum active invoice payments corresponding to this project
              const ricavi = activeInvoices
                .filter(i => i.projectId === proj.id)
                .reduce((s, i) => s + i.amount, 0);

              // Sum supplier invoices
              const costi = passiveInvoices
                .filter(p => p.projectId === proj.id)
                .reduce((s, p) => s + p.amount, 0);

              const utile = ricavi - costi;
              const marginPercent = ricavi > 0 ? Math.round((utile / ricavi) * 100) : (costi > 0 ? -100 : 0);

              // Division class color
              let divBg = "bg-blue-50 text-blue-800";
              if (proj.division === 'strategico') divBg = "bg-purple-50 text-purple-855";
              if (proj.division === 'materico') divBg = "bg-amber-50 text-amber-855";

              return (
                <div key={proj.id} className="bg-stone-50/50 p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col gap-3.5 text-left">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <b className="text-[14px] font-black text-[#1a1a1a] block leading-snug">{proj.name}</b>
                      <span className="text-[11.5px] text-stone-500 mt-0.5 block">{proj.client}</span>
                    </div>
                    <span className={`text-[10px] font-black rounded-lg px-2.5 py-0.5 uppercase tracking-wide inline-block ${divBg}`}>
                      {proj.division || 'Studio'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-stone-150 font-mono text-[12.5px]">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 block mb-0.5">Ricavi Attivi</span>
                      <b className="text-green-700 font-extrabold">{eur(ricavi)}</b>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 block mb-0.5">Costi Forniture</span>
                      <b className="text-red-700 font-extrabold">{eur(costi)}</b>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-dashed border-stone-150 pt-2.5 bg-stone-100/50 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 block">Utile Netto</span>
                      <b className={`text-[13.5px] font-black ${utile >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {utile > 0 ? '+' : ''}{eur(utile)}
                      </b>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 block mb-0.5">Margine</span>
                      <span className={`inline-block py-0.5 px-2 rounded-lg text-[11px] font-extrabold ${
                        marginPercent > 35 ? 'bg-green-150 text-green-900' : (marginPercent > 0 ? 'bg-amber-100 text-amber-850' : 'bg-red-100 text-red-900')
                      }`}>
                        {marginPercent > 0 ? `+${marginPercent}%` : `${marginPercent}%`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mt-5 flex items-start gap-2 text-[12px] text-stone-600">
            <Info className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />
            <p className="leading-normal">
              La marginalità della commessa tiene conto delle fatture attive saldate e di quelle trasmesse al SDI, sottratte delle fatture di subappaltatori, noleggi cantiere e spese speciali. I costi generali dello studio (consulenze generali, spese telefoniche) non influiscono sul calcolo delle singole marginalità.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
