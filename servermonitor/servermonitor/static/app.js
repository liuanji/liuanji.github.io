"use strict";

const $ = (selector) => document.querySelector(selector);
const POLL_MS = 30_000;
let knownGpuCount = -1;
let selectedPeriod = "1h";
let selectedHost = null;
let overviewData = null;
let periodData = new Map();
const PERIOD_LABELS = { "1h": "Last hour", "24h": "Last day", "7d": "Last week", "30d": "Last month", "90d": "Last 3 months", "365d": "Last year" };
const PERIOD_HOURS = { "1h": 1, "24h": 24, "7d": 7 * 24, "30d": 30 * 24, "90d": 90 * 24, "365d": 365 * 24 };

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getJSON(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

function localTime(timestamp, withDate = false) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    month: withDate ? "2-digit" : undefined,
    day: withDate ? "2-digit" : undefined,
    hour: "2-digit",
    minute: "2-digit",
    second: withDate ? undefined : "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1000));
}

function memoryGB(mb) {
  return `${(Number(mb || 0) / 1024).toFixed(1)} GB`;
}

function statusLabel(status) {
  return { online: "Online", stale: "Stale data", error: "Collection error", unseen: "Awaiting first sample" }[status] || status;
}

function setConnectionState(kind, label) {
  const state = $("#live-state");
  state.className = `live-state ${kind}`;
  state.querySelector("span").textContent = label;
}

function showNotice(message) {
  const notice = $("#notice");
  notice.textContent = message;
  notice.classList.toggle("hidden", !message);
}

function processDetails(processes) {
  if (!processes.length) return "";
  const rows = processes.map((process) => `
    <li title="PID ${Number(process.pid)}">
      <b>${escapeHTML(process.process_name)}</b>
      <span>${memoryGB(process.used_memory_mb)}</span>
    </li>`).join("");
  return `<details><summary>${processes.length} compute process${processes.length === 1 ? "" : "es"}</summary><ul class="process-list">${rows}</ul></details>`;
}

function gpuCard(gpu) {
  const util = Math.max(0, Math.min(100, Number(gpu.utilization || 0)));
  const memory = gpu.memory_total_mb > 0
    ? Math.max(0, Math.min(100, gpu.memory_used_mb / gpu.memory_total_mb * 100))
    : 0;
  const users = gpu.users.length
    ? gpu.users.map((user) => `<span class="user-chip" title="${memoryGB(user.used_memory_mb)}">${escapeHTML(user.username)} · ${memoryGB(user.used_memory_mb)}</span>`).join("")
    : `<span class="no-user">No compute processes</span>`;
  const thermal = gpu.temperature_c == null ? "—" : `${Math.round(gpu.temperature_c)}°C`;
  const power = gpu.power_w == null ? "—" : `${Math.round(gpu.power_w)} W`;
  return `
    <article class="gpu-card ${gpu.busy ? "busy" : "idle"}">
      <div class="gpu-top">
        <span class="gpu-id">GPU ${Number(gpu.index)}</span>
        <span class="gpu-state"><i></i>${gpu.busy ? "BUSY" : "IDLE"}</span>
      </div>
      <div class="util-row"><strong>${Math.round(util)}%</strong><small>Compute load</small></div>
      <progress class="meter" max="100" value="${util}" aria-label="Compute load ${Math.round(util)}%"></progress>
      <div class="stat-line"><span>GPU memory</span><span>${memoryGB(gpu.memory_used_mb)} / ${memoryGB(gpu.memory_total_mb)}</span></div>
      <progress class="meter memory" max="100" value="${memory}" aria-label="GPU memory usage ${Math.round(memory)}%"></progress>
      <div class="stat-line"><span>Temperature / Power</span><span>${thermal} · ${power}</span></div>
      <div class="user-list">${users}</div>
      ${processDetails(gpu.processes)}
    </article>`;
}

function hostPanel(host) {
  const gpus = host.gpus.map(gpuCard).join("");
  const meta = host.data_sampled_at
    ? `${host.gpus.length} GPUs · data at ${localTime(host.data_sampled_at)}`
    : "No data available";
  const error = !host.gpus.length && host.error
    ? `<div class="host-error">${escapeHTML(host.error)}</div>`
    : "";
  return `
    <article class="host-panel">
      <header class="host-header">
        <div class="host-identity">
          <span class="host-icon">▦</span>
          <div><div class="host-name">${escapeHTML(host.name)}</div><div class="host-meta">${meta}</div></div>
        </div>
        <div class="host-health">
          <span>${host.duration_ms == null ? "" : `${Number(host.duration_ms)} ms`}</span>
          <span class="status-pill ${escapeHTML(host.status)}">${statusLabel(host.status)}</span>
        </div>
      </header>
      ${gpus ? `<div class="gpu-grid">${gpus}</div>` : error}
    </article>`;
}

function updateGpuFilter(hosts) {
  const maxGpu = Math.max(-1, ...hosts.flatMap((host) => host.gpus.map((gpu) => gpu.index)));
  if (maxGpu === knownGpuCount) return;
  knownGpuCount = maxGpu;
  const gpuSelect = $("#history-gpu");
  const selected = gpuSelect.value;
  gpuSelect.innerHTML = `<option value="all">All GPUs</option>` + Array.from(
    { length: maxGpu + 1 }, (_, index) => `<option value="${index}">GPU ${index}</option>`
  ).join("");
  if (selected === "all" || Number(selected) <= maxGpu) gpuSelect.value = selected;
}

function summaryForHost(host) {
  const gpus = host.gpus;
  const busy = gpus.filter((gpu) => gpu.busy).length;
  const totalMemory = gpus.reduce((total, gpu) => total + Number(gpu.memory_total_mb || 0), 0);
  const usedMemory = gpus.reduce((total, gpu) => total + Number(gpu.memory_used_mb || 0), 0);
  return {
    hosts_online: host.status === "online" ? 1 : 0,
    hosts_total: 1,
    gpus_total: gpus.length,
    gpus_busy: busy,
    gpus_idle: gpus.length - busy,
    compute_load: gpus.length
      ? (gpus.reduce((total, gpu) => total + Number(gpu.utilization || 0), 0) / gpus.length).toFixed(1)
      : 0,
    memory_percent: totalMemory ? (usedMemory / totalMemory * 100).toFixed(1) : 0,
    power_w: gpus.reduce((total, gpu) => total + Number(gpu.power_w || 0), 0),
  };
}

function formatPower(watts) {
  const value = Number(watts || 0);
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)} kW`;
  return `${Math.round(value)} W`;
}

function renderHostTabs(hosts) {
  const target = $("#host-tabs");
  const allStatus = hosts.every((host) => host.status === "online") ? "online" : "error";
  const tabs = [{ name: "all", label: "All", status: allStatus }, ...hosts];
  target.innerHTML = tabs.map((host) => `
    <button class="${host.name === selectedHost ? "active " : ""}${escapeHTML(host.status)}" type="button" role="tab" aria-selected="${host.name === selectedHost}" data-host="${escapeHTML(host.name)}">
      <i class="host-tab-state"></i>${escapeHTML(host.label || host.name)}
    </button>`).join("");
  for (const button of target.querySelectorAll("[data-host]")) {
    button.addEventListener("click", () => selectHost(button.dataset.host));
  }
}

function renderOverview() {
  if (!overviewData || !selectedHost) return;
  const allSelected = selectedHost === "all";
  const selectedHosts = allSelected
    ? overviewData.hosts
    : overviewData.hosts.filter((item) => item.name === selectedHost);
  if (!selectedHosts.length) return;
  const summary = allSelected ? overviewData.summary : summaryForHost(selectedHosts[0]);
  $("#brand-subtitle").textContent = `${allSelected ? "all hosts" : selectedHost} · centralized monitor`;
  $("#hero-description").textContent = allSelected
    ? `Live usage across ${summary.gpus_total} GPUs on ${summary.hosts_total} hosts.`
    : `Live usage across ${selectedHost}'s ${summary.gpus_total} GPUs.`;
  $("#hosts-online").textContent = `${summary.hosts_online}/${summary.hosts_total}`;
  $("#hosts-caption").textContent = allSelected ? "Monitored hosts" : "Selected host";
  $("#gpu-usage").textContent = `${summary.gpus_busy}/${summary.gpus_total}`;
  $("#gpus-caption").textContent = `${summary.gpus_busy} in use · ${summary.gpus_idle} idle`;
  $("#compute-load").textContent = `${summary.compute_load}%`;
  $("#compute-caption").textContent = `Current average across ${summary.gpus_total} GPUs`;
  $("#memory-percent").textContent = `${summary.memory_percent}%`;
  $("#power-total").textContent = formatPower(summary.power_w);
  $("#updated-at").textContent = localTime(overviewData.generated_at);
  $("#poll-caption").textContent = `Read-only collection every ${overviewData.interval_seconds}s · ${overviewData.hosts.length} monitored hosts`;
  $("#hosts").innerHTML = selectedHosts.map(hostPanel).join("");
  updateGpuFilter(selectedHosts);
  const failed = selectedHosts.filter((host) => host.status !== "online");
  showNotice(failed.length ? failed.map((host) => `${host.name}: ${statusLabel(host.status)}${host.error ? ` (${host.error})` : ""}`).join("; ") : "");
  setConnectionState(failed.length ? "error" : "online", failed.length ? `${summary.hosts_online}/${summary.hosts_total} hosts online` : "Live collection");
}

function selectHost(host) {
  const validHost = host === "all" || overviewData?.hosts.some((item) => item.name === host);
  if (!overviewData || host === selectedHost || !validHost) return;
  selectedHost = host;
  const url = new URL(window.location.href);
  url.searchParams.set("host", host);
  window.history.replaceState(null, "", url);
  periodData = new Map();
  renderHostTabs(overviewData.hosts);
  renderOverview();
  $("#period-content").innerHTML = `<div class="loading-card">Calculating historical statistics…</div>`;
  $("#users-body").innerHTML = `<tr><td colspan="4" class="empty-cell">Loading user ranking…</td></tr>`;
  $("#history-chart").innerHTML = `<div class="empty-state">Loading usage trend…</div>`;
  Promise.all([loadPeriods(), loadHistory(), loadUsers()]);
}

function observedLabel(hours) {
  const value = Number(hours || 0);
  if (value < 1) return `${Math.max(1, Math.round(value * 60))} min observed`;
  if (value < 24) return `${value.toFixed(value < 10 ? 1 : 0)} hr observed`;
  return `${(value / 24).toFixed(value < 240 ? 1 : 0)} days observed`;
}

function periodCard(period) {
  const label = PERIOD_LABELS[period.range] || period.range;
  if (!period.has_data) {
    return `<article class="period-card"><header><strong>${escapeHTML(label)}</strong><span class="coverage">Waiting for data</span></header><div class="period-primary"><strong>—</strong><span>GPU usage</span></div><div class="period-details"><div><small>Average GPUs in use</small><b>—</b></div><div><small>Compute load</small><b>—</b></div><div><small>Memory usage</small><b>—</b></div><div><small>Average total power</small><b>—</b></div></div></article>`;
  }
  const coverage = Number(period.observed_hours) + 0.02 < PERIOD_HOURS[period.range]
    ? `<span class="coverage">Incomplete data · ${observedLabel(period.observed_hours)}</span>`
    : "";
  return `<article class="period-card">
    <header><strong>${escapeHTML(label)}</strong>${coverage}</header>
    <div class="period-primary"><strong>${Number(period.gpu_usage_percent).toFixed(1)}%</strong><span>GPU usage</span></div>
    <div class="period-details">
      <div><small>Average GPUs in use</small><b>${Number(period.average_busy_gpus).toFixed(1)} / ${Number(period.gpu_count)}</b></div>
      <div><small>Compute load</small><b>${Number(period.compute_load).toFixed(1)}%</b></div>
      <div><small>Memory usage</small><b>${Number(period.memory_percent).toFixed(1)}%</b></div>
      <div><small>Average total power</small><b>${formatPower(period.average_power_w)}</b></div>
    </div>
  </article>`;
}

async function loadPeriods() {
  const requestedHost = selectedHost;
  if (!requestedHost) return;
  try {
    const data = await getJSON(`/api/periods?host=${encodeURIComponent(requestedHost)}`);
    if (requestedHost !== selectedHost) return;
    periodData = new Map(data.periods.map((period) => [period.range, period]));
    renderSelectedPeriod();
  } catch (error) {
    if (requestedHost !== selectedHost) return;
    $("#period-content").innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

function renderSelectedPeriod() {
  const period = periodData.get(selectedPeriod);
  if (!period) return;
  $("#period-content").innerHTML = periodCard(period);
}

async function loadOverview() {
  try {
    const data = await getJSON("/api/overview");
    overviewData = data;
    const requestedHost = new URLSearchParams(window.location.search).get("host");
    const validSelection = (host) => host === "all" || data.hosts.some((item) => item.name === host);
    if (!selectedHost || !validSelection(selectedHost)) {
      selectedHost = validSelection(requestedHost)
        ? requestedHost
        : data.hosts[0]?.name || null;
    }
    renderHostTabs(data.hosts);
    renderOverview();
  } catch (error) {
    setConnectionState("error", "Dashboard disconnected");
    showNotice(error.message);
  }
}

function svgPath(points, key, width, height, pad, maxValue = 100) {
  if (!points.length) return "";
  const start = points[0].timestamp;
  const end = points.at(-1).timestamp;
  const span = Math.max(end - start, 1);
  return points.map((point, index) => {
    const x = pad.left + (point.timestamp - start) / span * (width - pad.left - pad.right);
    const value = Math.max(0, Math.min(maxValue, Number(point[key] || 0)));
    const y = pad.top + (maxValue - value) / maxValue * (height - pad.top - pad.bottom);
    return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function renderChart(points) {
  const target = $("#history-chart");
  if (points.length < 2) {
    target.innerHTML = `<div class="empty-state">The trend will appear after two samples have been collected.</div>`;
    return;
  }
  const width = 1100;
  const height = 320;
  const pad = { left: 42, right: 42, top: 14, bottom: 31 };
  const gpuCapacity = Math.max(1, ...points.map((point) => Number(point.gpu_count || 0)));
  const utilPath = svgPath(points, "utilization", width, height, pad);
  const memoryPath = svgPath(points, "memory_percent", width, height, pad);
  const busyPath = svgPath(points, "gpus_in_use", width, height, pad, gpuCapacity);
  const bottomY = height - pad.bottom;
  const areaPath = `${utilPath} L${width - pad.right},${bottomY} L${pad.left},${bottomY} Z`;
  const yLines = [0, 25, 50, 75, 100].map((value) => {
    const y = pad.top + (100 - value) / 100 * (height - pad.top - pad.bottom);
    return `<line class="chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}"/><text class="chart-axis" x="0" y="${y + 3}">${value}%</text>`;
  }).join("");
  const countValues = gpuCapacity === 1 ? [0, 1] : [0, .25, .5, .75, 1];
  const countLabels = countValues.map((portion) => {
    const value = gpuCapacity * portion;
    const y = pad.top + (1 - portion) * (height - pad.top - pad.bottom);
    const label = Number.isInteger(value) ? value : value.toFixed(1);
    return `<text class="chart-axis chart-axis-right" x="${width}" y="${y + 3}" text-anchor="end">${label}</text>`;
  }).join("");
  const tickIndexes = [0, .25, .5, .75, 1].map((portion) => Math.round((points.length - 1) * portion));
  const xLabels = tickIndexes.map((index, tick) => {
    const x = pad.left + tick / 4 * (width - pad.left - pad.right);
    const anchor = tick === 0 ? "start" : tick === 4 ? "end" : "middle";
    return `<text class="chart-axis" x="${x}" y="${height - 6}" text-anchor="${anchor}">${escapeHTML(localTime(points[index].timestamp, true))}</text>`;
  }).join("");
  target.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="GPU compute load, memory usage, and GPUs in use trend">
      <defs><linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#adff72" stop-opacity=".16"/><stop offset="1" stop-color="#adff72" stop-opacity="0"/></linearGradient></defs>
      ${yLines}${countLabels}${xLabels}
      <path class="chart-area" d="${areaPath}"/>
      <path class="chart-path-memory" d="${memoryPath}"/>
      <path class="chart-path-util" d="${utilPath}"/>
      <path class="chart-path-busy" d="${busyPath}"/>
    </svg>`;
}

async function loadHistory() {
  const requestedHost = selectedHost;
  if (!requestedHost) return;
  const params = new URLSearchParams({
    range: $("#history-range").value,
    host: requestedHost,
    gpu: $("#history-gpu").value,
  });
  try {
    const data = await getJSON(`/api/history?${params}`);
    if (requestedHost !== selectedHost) return;
    renderChart(data.points);
  } catch (error) {
    if (requestedHost !== selectedHost) return;
    $("#history-chart").innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

function formatHours(value) {
  const number = Number(value || 0);
  return number < 0.01 ? "< 0.01" : number.toFixed(number < 10 ? 2 : 1);
}

function renderUsers(users) {
  const body = $("#users-body");
  if (!users.length) {
    body.innerHTML = `<tr><td colspan="4" class="empty-cell">Not enough user samples yet.</td></tr>`;
    return;
  }
  const maxHours = Math.max(...users.map((user) => user.gpu_hours), 0.001);
  body.innerHTML = users.map((user, index) => {
    const hosts = user.hosts.map((host) => `<span class="host-chip">${escapeHTML(host.name)} · ${formatHours(host.gpu_hours)}h</span>`).join("");
    return `<tr>
      <td><div class="rank-user"><span class="rank ${index === 0 ? "top" : ""}">${index + 1}</span><strong>${escapeHTML(user.username)}</strong></div></td>
      <td class="usage-cell"><div class="usage-value">${formatHours(user.gpu_hours)} h</div><progress class="usage-bar" max="${maxHours}" value="${user.gpu_hours}" aria-label="Relative GPU usage for ${escapeHTML(user.username)}"></progress></td>
      <td>${formatHours(user.weighted_gpu_hours)} h</td>
      <td><div class="host-chips">${hosts}</div></td>
    </tr>`;
  }).join("");
}

async function loadUsers() {
  const requestedPeriod = selectedPeriod;
  const requestedHost = selectedHost;
  if (!requestedHost) return;
  try {
    const data = await getJSON(`/api/users?range=${encodeURIComponent(requestedPeriod)}&host=${encodeURIComponent(requestedHost)}`);
    if (requestedPeriod !== selectedPeriod || requestedHost !== selectedHost) return;
    $("#user-period-label").textContent = PERIOD_LABELS[requestedPeriod];
    renderUsers(data.users);
  } catch (error) {
    if (requestedHost !== selectedHost) return;
    $("#users-body").innerHTML = `<tr><td colspan="4" class="empty-cell">${escapeHTML(error.message)}</td></tr>`;
  }
}

for (const id of ["#history-gpu", "#history-range"]) {
  $(id).addEventListener("change", loadHistory);
}
for (const button of document.querySelectorAll("[data-period]")) {
  button.addEventListener("click", () => {
    selectedPeriod = button.dataset.period;
    for (const item of document.querySelectorAll("[data-period]")) {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    }
    renderSelectedPeriod();
    loadUsers();
  });
}

async function refreshAll() {
  await loadOverview();
  await Promise.all([loadPeriods(), loadHistory(), loadUsers()]);
}

refreshAll();
setInterval(loadOverview, POLL_MS);
setInterval(() => Promise.all([loadPeriods(), loadHistory(), loadUsers()]), POLL_MS * 2);
