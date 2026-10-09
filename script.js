/**
 * FinControl Pro - Módulo Principal JS
 */

const STATE_KEY = "FINCONTROL_PRO_DATA_V1";

let state = {
  transactions: [],
  goals: [],
  bills: [],
  categories: {
    receita: ["Salário", "Vendas", "Comissões", "Renda Extra", "Investimentos", "Outras Receitas"],
    despesa: ["Alimentação", "Moradia", "Transporte", "Lazer", "Academia", "Estudos", "Assinaturas", "Compras", "Saúde", "Outras Despesas"]
  },
  settings: {
    monthlyIncome: 0,
    budgetNeedsPct: 50,
    budgetWantsPct: 30,
    budgetSavingsPct: 20
  }
};

let chartDashBar, chartDashPie, chartCategoryPie, chartBalanceLine, chartSimulation;

document.addEventListener("DOMContentLoaded", () => {
  loadStateFromLocalStorage();
  initNavigation();
  initModals();
  initFormEvents();
  initCharts();
  populateCategorySelects();
  renderAll();
});

function loadStateFromLocalStorage() {
  const saved = localStorage.getItem(STATE_KEY);
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar dados do LocalStorage", e);
    }
  } else {
    state.transactions = [
      { id: "1", desc: "Salário Mensal", amount: 4500, type: "receita", category: "Salário", date: getTodayIso(), payment: "Pix", status: "pago" },
      { id: "2", desc: "Supermercado", amount: 650, type: "despesa", category: "Alimentação", date: getTodayIso(), payment: "Cartão de Débito", status: "pago" },
      { id: "3", desc: "Aluguel", amount: 1200, type: "despesa", category: "Moradia", date: getTodayIso(), payment: "Boleto", status: "pago" }
    ];
    saveState();
  }
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  renderAll();
}

function getTodayIso() {
  return new Date().toISOString().split("T")[0];
}

function formatBRL(val) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
}

// FECHAMENTO DE ABAS E MENU SOBREPOSTO
function closeOverlays() {
  document.getElementById("sidebar").classList.remove("active");
  document.getElementById("sidebarOverlay").classList.remove("active");

  // Fechar modais se abertos
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
}

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".content-section");
  const title = document.getElementById("pageTitle");

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const mobileToggle = document.getElementById("mobileToggle");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");

  // Abrir menu no mobile
  mobileToggle.addEventListener("click", () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  });

  // Fechar aba/menu ao clicar no X ou na sobreposição escura
  closeSidebarBtn.addEventListener("click", closeOverlays);
  overlay.addEventListener("click", closeOverlays);

  // Troca de páginas
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(n => n.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      item.classList.add("active");
      const target = item.dataset.target;
      document.getElementById(target).classList.add("active");
      title.innerText = item.innerText.trim();

      closeOverlays();
    });
  });

  // Fechar com a tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlays();
  });
}

function initModals() {
  document.getElementById("btnNewTransaction").addEventListener("click", () => openTxModal());
  document.getElementById("closeTxModal").addEventListener("click", closeTxModal);
  document.getElementById("btnCancelTx").addEventListener("click", closeTxModal);

  document.getElementById("btnNewGoal").addEventListener("click", openGoalModal);
  document.getElementById("closeGoalModal").addEventListener("click", closeGoalModal);

  document.getElementById("closeDepositModal").addEventListener("click", closeDepositModal);

  document.getElementById("btnNewBill").addEventListener("click", openBillModal);
  document.getElementById("closeBillModal").addEventListener("click", closeBillModal);

  // Fechar modal ao clicar fora da caixa do modal
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeOverlays();
    });
  });
}

function openTxModal(editTx = null) {
  const modal = document.getElementById("txModal");
  const form = document.getElementById("txForm");
  form.reset();

  if (editTx) {
    document.getElementById("modalTxTitle").innerText = "Editar Transação";
    document.getElementById("txId").value = editTx.id;
    document.getElementById("txDesc").value = editTx.desc;
    document.getElementById("txAmount").value = editTx.amount;
    document.getElementById("txType").value = editTx.type;
    populateCategorySelects();
    document.getElementById("txCategory").value = editTx.category;
    document.getElementById("txDate").value = editTx.date;
    document.getElementById("txPayment").value = editTx.payment;
    document.getElementById("txStatus").value = editTx.status;
  } else {
    document.getElementById("modalTxTitle").innerText = "Nova Transação";
    document.getElementById("txId").value = "";
    document.getElementById("txDate").value = getTodayIso();
  }

  modal.classList.add("active");
}

function closeTxModal() { document.getElementById("txModal").classList.remove("active"); }
function openGoalModal() { document.getElementById("goalModal").classList.add("active"); }
function closeGoalModal() { document.getElementById("goalModal").classList.remove("active"); }
function closeDepositModal() { document.getElementById("depositModal").classList.remove("active"); }
function openBillModal() { document.getElementById("billModal").classList.add("active"); }
function closeBillModal() { document.getElementById("billModal").classList.remove("active"); }

function populateCategorySelects() {
  const txType = document.getElementById("txType").value || "despesa";
  const txCatSelect = document.getElementById("txCategory");
  const filterCatSelect = document.getElementById("txFilterCategory");
  const billCatSelect = document.getElementById("billCategory");

  txCatSelect.innerHTML = "";
  state.categories[txType].forEach(c => {
    txCatSelect.innerHTML += `<option value="${c}">${c}</option>`;
  });

  if (filterCatSelect) {
    filterCatSelect.innerHTML = `<option value="">Todas as Categorias</option>`;
    const allCats = [...state.categories.receita, ...state.categories.despesa];
    allCats.forEach(c => filterCatSelect.innerHTML += `<option value="${c}">${c}</option>`);
  }

  if (billCatSelect) {
    billCatSelect.innerHTML = "";
    state.categories.despesa.forEach(c => billCatSelect.innerHTML += `<option value="${c}">${c}</option>`);
  }
}

function initFormEvents() {
  document.getElementById("txType").addEventListener("change", populateCategorySelects);

  document.getElementById("txForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("txId").value;
    const txData = {
      id: id || Date.now().toString(),
      desc: document.getElementById("txDesc").value,
      amount: parseFloat(document.getElementById("txAmount").value),
      type: document.getElementById("txType").value,
      category: document.getElementById("txCategory").value,
      date: document.getElementById("txDate").value,
      payment: document.getElementById("txPayment").value,
      status: document.getElementById("txStatus").value
    };

    if (id) {
      const idx = state.transactions.findIndex(t => t.id === id);
      if (idx !== -1) state.transactions[idx] = txData;
    } else {
      state.transactions.push(txData);
    }

    saveState();
    closeTxModal();
  });

  ["txSearch", "txFilterType", "txFilterCategory", "txFilterStatus"].forEach(id => {
    document.getElementById(id).addEventListener("input", renderTransactionsTable);
  });

  document.getElementById("goalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const newGoal = {
      id: Date.now().toString(),
      name: document.getElementById("goalName").value,
      target: parseFloat(document.getElementById("goalTarget").value),
      current: parseFloat(document.getElementById("goalCurrent").value) || 0,
      monthly: parseFloat(document.getElementById("goalMonthly").value) || 0,
      deadline: document.getElementById("goalDeadline").value
    };
    state.goals.push(newGoal);
    saveState();
    closeGoalModal();
  });

  document.getElementById("depositForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const goalId = document.getElementById("depositGoalId").value;
    const amount = parseFloat(document.getElementById("depositAmount").value);
    const goal = state.goals.find(g => g.id === goalId);
    if (goal && amount > 0) {
      goal.current += amount;
      saveState();
    }
    closeDepositModal();
  });

  document.getElementById("billForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const newBill = {
      id: Date.now().toString(),
      name: document.getElementById("billName").value,
      amount: parseFloat(document.getElementById("billAmount").value),
      dueDate: document.getElementById("billDueDate").value,
      category: document.getElementById("billCategory").value,
      status: "pendente"
    };
    state.bills.push(newBill);
    saveState();
    closeBillModal();
  });

  document.getElementById("simForm").addEventListener("submit", (e) => {
    e.preventDefault();
    runInvestmentSimulation();
  });

  ["b503020Income", "pctNeeds", "pctWants", "pctSavings"].forEach(id => {
    document.getElementById(id).addEventListener("input", renderBudget503020);
  });

  ["emCost", "emMonths"].forEach(id => {
    document.getElementById(id).addEventListener("input", renderEmergencyPlanner);
  });

  document.getElementById("btnExportJSON").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `FinControl_Backup_${getTodayIso()}.json`);
    dlAnchor.click();
  });

  document.getElementById("btnImportJSON").addEventListener("click", () => {
    document.getElementById("importFileInput").click();
  });

  document.getElementById("importFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && imported.transactions) {
          state = imported;
          saveState();
          alert("Backup restaurado com sucesso!");
        } else {
          alert("Arquivo JSON inválido.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  });
}

function renderAll() {
  renderDashboardKPIs();
  renderTransactionsTable();
  renderBudget503020();
  renderGoals();
  renderEmergencyPlanner();
  renderBillsTable();
  updateChartsData();
}

function renderDashboardKPIs() {
  let totalIncomes = 0;
  let totalExpenses = 0;

  state.transactions.forEach(t => {
    if (t.status === "pago") {
      if (t.type === "receita") totalIncomes += t.amount;
      if (t.type === "despesa") totalExpenses += t.amount;
    }
  });

  const balance = totalIncomes - totalExpenses;
  const spentPct = totalIncomes > 0 ? ((totalExpenses / totalIncomes) * 100).toFixed(1) : 0;
  const totalSavedGoals = state.goals.reduce((acc, g) => acc + g.current, 0);

  document.getElementById("kpiBalance").innerText = formatBRL(balance);
  document.getElementById("kpiIncomes").innerText = formatBRL(totalIncomes);
  document.getElementById("kpiExpenses").innerText = formatBRL(totalExpenses);
  document.getElementById("kpiSpentPercent").innerText = `${spentPct}% da renda gasto`;
  document.getElementById("kpiSaved").innerText = formatBRL(totalSavedGoals);

  const healthBadge = document.getElementById("healthBadge");
  if (balance > 0 && spentPct <= 70) {
    healthBadge.innerText = "Saúde: Excelente 🟢";
    healthBadge.style.color = "var(--accent-green)";
  } else if (balance >= 0) {
    healthBadge.innerText = "Saúde: Estável 🟡";
    healthBadge.style.color = "var(--accent-yellow)";
  } else {
    healthBadge.innerText = "Saúde: ATENÇÃO 🔴";
    healthBadge.style.color = "var(--accent-red)";
  }
}

function renderTransactionsTable() {
  const tbody = document.getElementById("txTableBody");
  const search = document.getElementById("txSearch").value.toLowerCase();
  const typeFilter = document.getElementById("txFilterType").value;
  const catFilter = document.getElementById("txFilterCategory").value;
  const statusFilter = document.getElementById("txFilterStatus").value;

  const filtered = state.transactions.filter(t => {
    const matchSearch = t.desc.toLowerCase().includes(search);
    const matchType = !typeFilter || t.type === typeFilter;
    const matchCat = !catFilter || t.category === catFilter;
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchType && matchCat && matchStatus;
  });

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = "";
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhuma movimentação encontrada.</td></tr>`;
    return;
  }

  filtered.forEach(t => {
    const tr = document.createElement("tr");
    const isIncome = t.type === "receita";
    const amountFormatted = (isIncome ? "+ " : "- ") + formatBRL(t.amount);
    const badgeClass = t.status === "pago" ? "badge-green" : "badge-yellow";

    tr.innerHTML = `
      <td>${new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</td>
      <td><strong>${t.desc}</strong></td>
      <td>${t.category}</td>
      <td><span class="badge ${isIncome ? "badge-green" : "badge-red"}">${t.type.toUpperCase()}</span></td>
      <td><span class="badge ${badgeClass}">${t.status.toUpperCase()}</span></td>
      <td style="color:${isIncome ? "var(--accent-green)" : "var(--accent-red)"}; font-weight:600;">${amountFormatted}</td>
      <td>
        <button class="btn btn-secondary" onclick="editTransaction('${t.id}')">✏️</button>
        <button class="btn btn-danger" onclick="deleteTransaction('${t.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editTransaction(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (tx) openTxModal(tx);
}

function deleteTransaction(id) {
  if (confirm("Tem certeza que deseja excluir esta movimentação?")) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveState();
  }
}

function renderBudget503020() {
  const incomeInput = parseFloat(document.getElementById("b503020Income").value);
  let income = incomeInput;

  if (isNaN(income) || income <= 0) {
    income = state.transactions
      .filter(t => t.type === "receita" && t.status === "pago")
      .reduce((acc, t) => acc + t.amount, 0);
  }

  const needsPct = parseFloat(document.getElementById("pctNeeds").value) || 50;
  const wantsPct = parseFloat(document.getElementById("pctWants").value) || 30;
  const savingsPct = parseFloat(document.getElementById("pctSavings").value) || 20;

  document.getElementById("lblNeedsPct").innerText = needsPct;
  document.getElementById("lblWantsPct").innerText = wantsPct;
  document.getElementById("lblSavingsPct").innerText = savingsPct;

  const targetNeeds = income * (needsPct / 100);
  const targetWants = income * (wantsPct / 100);
  const targetSavings = income * (savingsPct / 100);

  let spentNeeds = 0;
  let spentWants = 0;

  const needsCategories = ["Moradia", "Alimentação", "Transporte", "Saúde", "Estudos"];
  
  state.transactions.forEach(t => {
    if (t.type === "despesa" && t.status === "pago") {
      if (needsCategories.includes(t.category)) {
        spentNeeds += t.amount;
      } else {
        spentWants += t.amount;
      }
    }
  });

  const totalSavedGoals = state.goals.reduce((acc, g) => acc + g.current, 0);

  document.getElementById("bNeedsTarget").innerText = formatBRL(targetNeeds);
  document.getElementById("bNeedsSpent").innerText = formatBRL(spentNeeds);
  updateProgressBar("pbNeeds", "statusNeeds", spentNeeds, targetNeeds);

  document.getElementById("bWantsTarget").innerText = formatBRL(targetWants);
  document.getElementById("bWantsSpent").innerText = formatBRL(spentWants);
  updateProgressBar("pbWants", "statusWants", spentWants, targetWants);

  document.getElementById("bSavingsTarget").innerText = formatBRL(targetSavings);
  document.getElementById("bSavingsSpent").innerText = formatBRL(totalSavedGoals);
  updateProgressBar("pbSavings", "statusSavings", totalSavedGoals, targetSavings, true);
}

function updateProgressBar(barId, statusId, current, target, isSavings = false) {
  const bar = document.getElementById(barId);
  const status = document.getElementById(statusId);
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  bar.style.width = `${pct}%`;

  if (!isSavings) {
    if (current > target) {
      bar.style.backgroundColor = "var(--accent-red)";
      status.innerText = "Orçamento Excedido!";
      status.style.color = "var(--accent-red)";
    } else {
      bar.style.backgroundColor = "var(--primary)";
      status.innerText = "Dentro do limite";
      status.style.color = "var(--accent-green)";
    }
  } else {
    bar.style.backgroundColor = "var(--accent-green)";
    status.innerText = pct >= 100 ? "Meta de Investimento Atingida!" : "Em progresso";
    status.style.color = "var(--accent-green)";
  }
}

function renderGoals() {
  const container = document.getElementById("goalsGrid");
  container.innerHTML = "";

  if (state.goals.length === 0) {
    container.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align:center; color: var(--text-muted);">Nenhuma meta cadastrada ainda.</div>`;
    return;
  }

  state.goals.forEach(goal => {
    const missing = Math.max(0, goal.target - goal.current);
    const pct = Math.min(100, ((goal.current / goal.target) * 100)).toFixed(1);

    let monthsLeftText = "N/A";
    if (goal.monthly > 0 && missing > 0) {
      const months = Math.ceil(missing / goal.monthly);
      monthsLeftText = `~${months} mês(es)`;
    } else if (missing === 0) {
      monthsLeftText = "Concluída 🎉";
    }

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4>${goal.name}</h4>
        <button class="btn btn-danger" onclick="deleteGoal('${goal.id}')">🗑️</button>
      </div>
      <div style="margin: 0.75rem 0;">
        <span style="font-size:1.25rem; font-weight:700;">${formatBRL(goal.current)}</span> 
        <span style="color:var(--text-muted); font-size:0.85rem;">/ ${formatBRL(goal.target)}</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:0.5rem; font-size:0.8rem; color:var(--text-muted);">
        <span>${pct}% concluído</span>
        <span>Falta: ${formatBRL(missing)}</span>
      </div>
      <div style="margin-top: 0.75rem; font-size:0.8rem; color: var(--text-muted);">
        Tempo estimado no aporte atual: <strong>${monthsLeftText}</strong>
      </div>
      <button class="btn btn-secondary" style="width:100%; margin-top: 1rem;" onclick="openDepositModal('${goal.id}')">+ Adicionar Aporte</button>
    `;
    container.appendChild(card);
  });
}

function openDepositModal(id) {
  document.getElementById("depositGoalId").value = id;
  document.getElementById("depositModal").classList.add("active");
}

function deleteGoal(id) {
  if (confirm("Deseja remover esta meta?")) {
    state.goals = state.goals.filter(g => g.id !== id);
    saveState();
  }
}

function renderEmergencyPlanner() {
  const cost = parseFloat(document.getElementById("emCost").value) || 0;
  const months = parseInt(document.getElementById("emMonths").value) || 6;

  const target = cost * months;
  const saved = state.goals.reduce((acc, g) => acc + g.current, 0);
  const missing = Math.max(0, target - saved);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

  document.getElementById("emTargetValue").innerText = formatBRL(target);
  document.getElementById("emCurrentValue").innerText = formatBRL(saved);
  document.getElementById("emProgressBar").style.width = `${pct}%`;

  const missingText = document.getElementById("emMissingText");
  if (missing > 0) {
    missingText.innerText = `Faltam ${formatBRL(missing)} para você completar sua reserva de segurança de ${months} meses.`;
  } else {
    missingText.innerText = "Parabéns! Sua reserva de emergência está totalmente coberta!";
  }
}

function renderBillsTable() {
  const tbody = document.getElementById("billsTableBody");
  tbody.innerHTML = "";

  if (state.bills.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhuma conta pendente cadastrada.</td></tr>`;
    return;
  }

  state.bills.forEach(bill => {
    const tr = document.createElement("tr");
    const isPaid = bill.status === "pago";

    tr.innerHTML = `
      <td>${new Date(bill.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}</td>
      <td><strong>${bill.name}</strong></td>
      <td>${bill.category}</td>
      <td>${formatBRL(bill.amount)}</td>
      <td><span class="badge ${isPaid ? "badge-green" : "badge-yellow"}">${bill.status.toUpperCase()}</span></td>
      <td>
        ${!isPaid ? `<button class="btn btn-primary" onclick="payBill('${bill.id}')">Pagar</button>` : ""}
        <button class="btn btn-danger" onclick="deleteBill('${bill.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function payBill(id) {
  const bill = state.bills.find(b => b.id === id);
  if (bill) {
    bill.status = "pago";
    state.transactions.push({
      id: Date.now().toString(),
      desc: `Pagamento: ${bill.name}`,
      amount: bill.amount,
      type: "despesa",
      category: bill.category,
      date: getTodayIso(),
      payment: "Boleto/Pix",
      status: "pago"
    });
    saveState();
  }
}

function deleteBill(id) {
  state.bills = state.bills.filter(b => b.id !== id);
  saveState();
}

function runInvestmentSimulation() {
  const initial = parseFloat(document.getElementById("simInitial").value) || 0;
  const monthly = parseFloat(document.getElementById("simMonthly").value) || 0;
  let rateInput = parseFloat(document.getElementById("simRate").value) || 0;
  const rateType = document.getElementById("simRateType").value;
  let periodInput = parseInt(document.getElementById("simPeriod").value) || 0;
  const periodType = document.getElementById("simPeriodType").value;

  const totalMonths = periodType === "years" ? periodInput * 12 : periodInput;

  let monthlyRate = 0;
  if (rateType === "annual") {
    monthlyRate = Math.pow(1 + (rateInput / 100), 1 / 12) - 1;
  } else {
    monthlyRate = rateInput / 100;
  }

  let totalBalance = initial;
  let totalInvested = initial;
  const labels = [];
  const dataTotal = [];
  const dataInvested = [];

  for (let m = 1; m <= totalMonths; m++) {
    totalBalance = totalBalance * (1 + monthlyRate) + monthly;
    totalInvested += monthly;

    if (m % (totalMonths > 24 ? 12 : 1) === 0 || m === totalMonths) {
      labels.push(`Mês ${m}`);
      dataTotal.push(totalBalance.toFixed(2));
      dataInvested.push(totalInvested.toFixed(2));
    }
  }

  const totalInterest = totalBalance - totalInvested;

  document.getElementById("simResultInvested").innerText = formatBRL(totalInvested);
  document.getElementById("simResultInterest").innerText = formatBRL(totalInterest);
  document.getElementById("simResultTotal").innerText = formatBRL(totalBalance);

  updateSimulationChart(labels, dataTotal, dataInvested);
}

function initCharts() {
  const ctxDashBar = document.getElementById("chartDashBar").getContext("2d");
  chartDashBar = new Chart(ctxDashBar, {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctxDashPie = document.getElementById("chartDashPie").getContext("2d");
  chartDashPie = new Chart(ctxDashPie, {
    type: "doughnut",
    data: { labels: [], datasets: [] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctxCategoryPie = document.getElementById("chartCategoryPie").getContext("2d");
  chartCategoryPie = new Chart(ctxCategoryPie, {
    type: "pie",
    data: { labels: [], datasets: [] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctxBalanceLine = document.getElementById("chartBalanceLine").getContext("2d");
  chartBalanceLine = new Chart(ctxBalanceLine, {
    type: "line",
    data: { labels: [], datasets: [] },
    options: { responsive: true, maintainAspectRatio