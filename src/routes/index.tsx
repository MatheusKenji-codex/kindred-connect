import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  Clock3,
  Cloud,
  Download,
  MapPin,
  Menu,
  Plus,
  Radio,
  Settings,
  SlidersHorizontal,
  Thermometer,
  Waves,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

type Level = "normal" | "attention" | "critical" | "unconfigured";
type Metric = "temperature" | "ph" | "sound" | "turbidity";
type Reading = { time: string; temperature: number; ph: number; sound: number; turbidity: number };

const locations = [
  {
    id: "controlled",
    name: "Ambiente Controlado 01",
    type: "Ambiente Controlado",
    profile: "Ambiente Controlado",
  },
  {
    id: "reef",
    name: "Recife Piloto — Ponto 01",
    type: "Recife / Coral",
    profile: "Personalizado",
  },
  { id: "river", name: "Rio Exemplo — Ponto 01", type: "Rio", profile: "Rio" },
];
const samples: Record<string, Reading[]> = {
  controlled: [
    ["09:00", 26.1, 7.2, 48, 1.2],
    ["09:10", 26.3, 7.3, 51, 1.3],
    ["09:20", 26.4, 7.2, 49, 1.1],
    ["09:30", 26.2, 7.1, 52, 1.4],
    ["09:40", 26.5, 7.3, 50, 1.2],
    ["09:50", 26.4, 7.2, 53, 1.3],
    ["10:00", 26.6, 7.2, 51, 1.2],
  ].map(([time, temperature, ph, sound, turbidity]) => ({
    time: time as string,
    temperature: temperature as number,
    ph: ph as number,
    sound: sound as number,
    turbidity: turbidity as number,
  })),
  reef: [
    ["09:00", 28.2, 8.1, 62, 4.5],
    ["09:10", 28.4, 8.2, 65, 5.2],
    ["09:20", 28.7, 8.0, 67, 5.4],
    ["09:30", 28.8, 8.3, 64, 5.0],
    ["09:40", 29.1, 8.2, 69, 5.8],
    ["09:50", 28.9, 8.2, 66, 5.3],
    ["10:00", 29.0, 8.1, 68, 5.6],
  ].map(([time, temperature, ph, sound, turbidity]) => ({
    time: time as string,
    temperature: temperature as number,
    ph: ph as number,
    sound: sound as number,
    turbidity: turbidity as number,
  })),
  river: [
    ["09:00", 24.1, 6.8, 42, 12],
    ["09:10", 24.3, 6.9, 44, 13],
    ["09:20", 24.2, 6.8, 46, 15],
    ["09:30", 24.4, 6.7, 43, 14],
    ["09:40", 24.5, 6.8, 45, 16],
    ["09:50", 24.3, 6.9, 44, 15],
    ["10:00", 24.6, 6.8, 47, 17],
  ].map(([time, temperature, ph, sound, turbidity]) => ({
    time: time as string,
    temperature: temperature as number,
    ph: ph as number,
    sound: sound as number,
    turbidity: turbidity as number,
  })),
};
const limits = { temperature: [24, 28, 30], ph: [6, 8.5, 9.5], turbidity: [1, 5] };
const status = (metric: Metric, value: number, place: string): Level => {
  if (metric === "temperature")
    return value < limits.temperature[0] || value >= limits.temperature[2]
      ? "critical"
      : value <= limits.temperature[1]
        ? "normal"
        : "attention";
  if (metric === "ph")
    return value < limits.ph[0] || value > limits.ph[2]
      ? "critical"
      : value <= limits.ph[1]
        ? "normal"
        : "attention";
  if (metric === "turbidity")
    return place === "controlled"
      ? value < limits.turbidity[0]
        ? "normal"
        : value <= limits.turbidity[1]
          ? "attention"
          : "critical"
      : "unconfigured";
  return "unconfigured";
};
const levelText: Record<Level, string> = {
  normal: "Normal",
  attention: "Atenção",
  critical: "Crítico",
  unconfigured: "A definir",
};
const levelClass: Record<Level, string> = {
  normal: "good",
  attention: "warn",
  critical: "bad",
  unconfigured: "neutral",
};

function Sparkline({ data, metric, color }: { data: Reading[]; metric: Metric; color: string }) {
  return (
    <div className="spark">
      <ResponsiveContainer width="100%" height={58}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={metric} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor={color} stopOpacity={0.32} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={metric}
            stroke={color}
            strokeWidth={2.2}
            fill={`url(#${metric})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function MetricCard({
  title,
  icon,
  value,
  unit,
  metric,
  data,
  place,
  note,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  metric: Metric;
  data: Reading[];
  place: string;
  note: string;
}) {
  const s = status(metric, value, place);
  const vals = data.map((d) => d[metric]);
  return (
    <section className="metric-card">
      <div className="card-top">
        <div className="metric-title">
          {icon}
          <span>{title}</span>
        </div>
        <span className={`badge ${levelClass[s]}`}>
          {s === "unconfigured" ? "CONFIGURAR" : levelText[s].toUpperCase()}
        </span>
      </div>
      <div className="metric-value">
        {value.toLocaleString("pt-BR", {
          minimumFractionDigits: metric === "ph" || metric === "temperature" ? 1 : 0,
          maximumFractionDigits: 1,
        })}
        <small>{unit}</small>
      </div>
      <p className="metric-note">{note}</p>
      <Sparkline
        data={data}
        metric={metric}
        color={s === "critical" ? "#f05d5e" : s === "attention" ? "#e6a33d" : "#18b58b"}
      />
      <div className="metric-footer">
        <span>
          Mín. <b>{Math.min(...vals)}</b>
        </span>
        <span>
          Máx. <b>{Math.max(...vals)}</b>
        </span>
        <span>
          <Clock3 size={13} /> agora
        </span>
      </div>
    </section>
  );
}

function Index() {
  const [place, setPlace] = useState("controlled");
  const [page, setPage] = useState("Dashboard");
  const [demo, setDemo] = useState(true);
  const [now, setNow] = useState(new Date());
  const [mobile, setMobile] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const data = samples[place];
  const latest = data.at(-1)!;
  const selected = locations.find((l) => l.id === place)!;
  const allLevels = (["temperature", "ph", "turbidity"] as Metric[]).map((m) =>
    status(m, latest[m], place),
  );
  const overall: Level = allLevels.includes("critical")
    ? "critical"
    : allLevels.includes("attention")
      ? "attention"
      : "normal";
  const alerts = useMemo(
    () => [
      {
        metric: "Turbidez",
        value: `${latest.turbidity} NTU`,
        level: status("turbidity", latest.turbidity, place),
        text:
          place === "controlled"
            ? "Acima da meta ideal configurada"
            : "Limites dependem do perfil do ambiente",
      },
      {
        metric: "Hidrofone",
        value: `${latest.sound} dB`,
        level: "unconfigured" as Level,
        text: "Sem limites definidos para este sensor",
      },
    ],
    [place, latest],
  );
  const nav = ["Dashboard", "Histórico", "Alertas", "Sensores", "Locais", "Configurações"];
  const exportCsv = () => {
    const csv =
      "Data,Hora,Local,Temperatura °C,pH,Hidrofone dB,Turbidez NTU\n" +
      data
        .map(
          (d) =>
            `17/08/2026,${d.time},${selected.name},${d.temperature},${d.ph},${d.sound},${d.turbidity}`,
        )
        .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "historico-agua.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <main className="app-shell">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="brand" aria-label="EcoReef — Sistema Inteligente de Alerta para Recifes">
          <img className="brand-logo" src="/ecoreef-logo.png" alt="Símbolo EcoReef" />
          <img
            className="brand-wordmark"
            src="/ecoreef-wordmark.png"
            alt="EcoReef — Sistema Inteligente de Alerta para Recifes"
          />
        </div>
        <nav>
          {nav.map((item) => (
            <button
              key={item}
              className={page === item ? "active" : ""}
              onClick={() => {
                setPage(item);
                setMobile(false);
              }}
            >
              {item === "Dashboard" ? (
                <Activity />
              ) : item === "Histórico" ? (
                <Clock3 />
              ) : item === "Alertas" ? (
                <Bell />
              ) : item === "Sensores" ? (
                <Radio />
              ) : item === "Locais" ? (
                <MapPin />
              ) : (
                <Settings />
              )}
              {item}
              {item === "Alertas" && <i>2</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection">
            <span className="dot" /> API IoT preparada
          </div>
          <small>v1.0.0 · Dados locais</small>
        </div>
      </aside>
      <div className="content">
        <header>
          <button className="menu" onClick={() => setMobile(!mobile)}>
            <Menu />
          </button>
          <div>
            <p className="eyebrow">CENTRAL DE MONITORAMENTO</p>
            <h1>{page}</h1>
          </div>
          <div className="header-actions">
            <span className="live">
              <span className="pulse" /> Conexão ativa
            </span>
            <button className="icon-button">
              <Bell size={19} />
              <b>2</b>
            </button>
            <div className="avatar">AM</div>
          </div>
        </header>
        {page === "Dashboard" ? (
          <>
            <div className="toolbar">
              <div className="location-select">
                <MapPin size={17} />
                <select
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  aria-label="Local de monitoramento"
                >
                  {locations.map((l) => (
                    <option value={l.id} key={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
              <div className="demo-toggle">
                <span className={demo ? "demo-on" : ""}>● DADOS DE DEMONSTRAÇÃO</span>
                <button onClick={() => setDemo(!demo)} className={demo ? "switch on" : "switch"}>
                  <i />
                </button>
              </div>
            </div>
            <section className={`status-hero ${levelClass[overall]}`}>
              <div className="status-orb">{overall === "normal" ? "✓" : "!"}</div>
              <div>
                <p>STATUS GERAL DA ÁGUA</p>
                <h2>{levelText[overall].toUpperCase()}</h2>
                <span>
                  {overall === "normal"
                    ? "Parâmetros dentro das condições configuradas"
                    : "Há parâmetros que requerem acompanhamento"}
                </span>
              </div>
              <div className="hero-meta">
                <span>
                  <Clock3 /> Atualizado agora
                </span>
                <span>
                  {now.toLocaleDateString("pt-BR")} ·{" "}
                  {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </section>
            <section className="metrics">
              <MetricCard
                title="Temperatura"
                icon={<Thermometer />}
                value={latest.temperature}
                unit="°C"
                metric="temperature"
                data={data}
                place={place}
                note="DS18B20 · leitura a cada 1 min"
              />
              <MetricCard
                title="pH"
                icon={<Activity />}
                value={latest.ph}
                unit="pH"
                metric="ph"
                data={data}
                place={place}
                note="Referência configurada para este perfil"
              />
              <MetricCard
                title="Turbidez"
                icon={<Cloud />}
                value={latest.turbidity}
                unit="NTU"
                metric="turbidity"
                data={data}
                place={place}
                note={
                  place === "controlled"
                    ? "Perfil: ambiente controlado"
                    : "Perfil com limites configuráveis"
                }
              />
              <MetricCard
                title="Hidrofone"
                icon={<Waves />}
                value={latest.sound}
                unit="dB"
                metric="sound"
                data={data}
                place={place}
                note="Monitoramento acústico · limites pendentes"
              />
            </section>
            <section className="lower-grid">
              <div className="panel chart-panel">
                <div className="panel-head">
                  <div>
                    <h3>Visão temporal</h3>
                    <p>Última hora · {selected.name}</p>
                  </div>
                  <select>
                    <option>Temperatura</option>
                    <option>pH</option>
                    <option>Turbidez</option>
                  </select>
                </div>
                <div className="big-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="big" x1="0" x2="0" y1="0" y2="1">
                          <stop stopColor="#27b6d0" stopOpacity=".35" />
                          <stop offset="1" stopColor="#27b6d0" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#dfecef" />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} />
                      <YAxis domain={[23, 31]} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="#0899b7"
                        strokeWidth={3}
                        fill="url(#big)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel alerts-panel">
                <div className="panel-head">
                  <div>
                    <h3>Alertas recentes</h3>
                    <p>Monitoramento ativo</p>
                  </div>
                  <button onClick={() => setPage("Alertas")}>Ver todos</button>
                </div>
                {alerts.map((a, i) => (
                  <div className="alert-row" key={i}>
                    <span className={`alert-symbol ${levelClass[a.level]}`}>!</span>
                    <div>
                      <b>
                        {a.metric}: {a.value}
                      </b>
                      <p>{a.text}</p>
                    </div>
                    <small>agora</small>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <Subpage
            page={page}
            selected={selected}
            data={data}
            latest={latest}
            exportCsv={exportCsv}
            onAdd={() => setShowAdd(true)}
          />
        )}
      </div>
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Novo local de monitoramento</h2>
            <p>Cadastre um local para conectá-lo a sensores e perfis ambientais.</p>
            <label>
              Nome do local
              <input placeholder="Ex.: Lago Norte — Ponto 01" />
            </label>
            <label>
              Perfil
              <select>
                <option>Ambiente Controlado</option>
                <option>Rio</option>
                <option>Lago</option>
                <option>Personalizado</option>
              </select>
            </label>
            <div>
              <button className="secondary" onClick={() => setShowAdd(false)}>
                Cancelar
              </button>
              <button className="primary" onClick={() => setShowAdd(false)}>
                Salvar local
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Subpage({
  page,
  selected,
  data,
  latest,
  exportCsv,
  onAdd,
}: {
  page: string;
  selected: (typeof locations)[0];
  data: Reading[];
  latest: Reading;
  exportCsv: () => void;
  onAdd: () => void;
}) {
  const rows = data.slice().reverse();
  const [settingsSaved, setSettingsSaved] = useState(false);
  return (
    <section className="subpage">
      <div className="subpage-top">
        <div>
          <h2>
            {page === "Histórico"
              ? "Histórico de monitoramento"
              : page === "Alertas"
                ? "Central de alertas"
                : page === "Sensores"
                  ? "Sensores cadastrados"
                  : page === "Locais"
                    ? "Locais de monitoramento"
                    : "Configurações de limites"}
          </h2>
          <p>{selected.name} · dados de demonstração</p>
        </div>
        {page === "Histórico" ? (
          <button className="primary" onClick={exportCsv}>
            <Download size={16} /> Exportar CSV
          </button>
        ) : page === "Locais" || page === "Sensores" ? (
          <button className="primary" onClick={onAdd}>
            <Plus size={16} /> Adicionar
          </button>
        ) : null}
      </div>
      {page === "Histórico" ? (
        <div className="panel table-panel">
          <div className="filters">
            <button>Última hora</button>
            <button>Todos os sensores</button>
            <button>
              <SlidersHorizontal size={15} /> Filtros
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>DATA / HORA</th>
                <th>LOCAL</th>
                <th>TEMPERATURA</th>
                <th>pH</th>
                <th>HIDROFONE</th>
                <th>TURBIDEZ</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.time}>
                  <td>17 ago · {r.time}</td>
                  <td>{selected.name}</td>
                  <td>{r.temperature} °C</td>
                  <td>{r.ph}</td>
                  <td>{r.sound} dB</td>
                  <td>{r.turbidity} NTU</td>
                  <td>
                    <span className="badge good">NORMAL</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : page === "Sensores" ? (
        <div className="sensor-grid">
          {[
            ["pH", "Eletrodo de vidro / pHmetro", "Aguardando integração"],
            ["Temperatura", "DS18B20", "ONLINE"],
            ["Hidrofone", "Modelo a definir", "Aguardando integração"],
            ["Turbidez", "Modelo a definir", "Aguardando integração"],
          ].map(([name, model, state]) => (
            <div className="panel sensor" key={name}>
              <Radio />
              <h3>{name}</h3>
              <p>{model}</p>
              <span className={state === "ONLINE" ? "badge good" : "badge neutral"}>{state}</span>
              <small>{selected.name}</small>
            </div>
          ))}
        </div>
      ) : page === "Locais" ? (
        <div className="locations-grid">
          {locations.map((l, i) => (
            <div className="panel location" key={l.id}>
              <div className={`map-dot ${i === 0 ? "good" : "warn"}`} />
              <h3>{l.name}</h3>
              <p>
                {l.type} · Perfil {l.profile}
              </p>
              <span>4 sensores associados</span>
            </div>
          ))}
        </div>
      ) : page === "Alertas" ? (
        <div className="panel alert-list">
          <div className="alert-row">
            <span className="alert-symbol warn">!</span>
            <div>
              <b>Turbidez em atenção: {latest.turbidity} NTU</b>
              <p>Ambiente Controlado 01 · agora · Novo</p>
            </div>
            <button className="secondary">Visualizado</button>
          </div>
          <div className="alert-row">
            <span className="alert-symbol neutral">i</span>
            <div>
              <b>Hidrofone sem limites configurados</b>
              <p>Defina parâmetros de referência nas configurações.</p>
            </div>
            <button className="secondary">Configurar</button>
          </div>
        </div>
      ) : (
        <div className="settings-grid">
          <div className="panel settings-card temperature-settings">
            <div className="settings-card-head">
              <span>
                <Thermometer />
              </span>
              <div>
                <h3>Temperatura · DS18B20</h3>
                <p>Limites fixados conforme a regra definida para o projeto.</p>
              </div>
            </div>
            <div className="limit-row">
              <label>
                Crítico abaixo
                <div className="input-unit">
                  <input type="number" step="0.1" defaultValue="24.0" />
                  <span>°C</span>
                </div>
              </label>
              <label>
                Normal até
                <div className="input-unit">
                  <input type="number" step="0.1" defaultValue="28.0" />
                  <span>°C</span>
                </div>
              </label>
              <label>
                Crítico a partir de
                <div className="input-unit">
                  <input type="number" step="0.1" defaultValue="30.0" />
                  <span>°C</span>
                </div>
              </label>
            </div>
          </div>
          <div className="panel settings-card">
            <div className="settings-card-head">
              <span>
                <Activity />
              </span>
              <div>
                <h3>Sensor de pH</h3>
                <p>Referências configuráveis para o ambiente selecionado.</p>
              </div>
            </div>
            <div className="limit-row ph-limits">
              <label>
                Normal a partir de
                <input type="number" min="0" max="14" step="0.1" defaultValue="6.0" />
              </label>
              <label>
                Normal até
                <input type="number" min="0" max="14" step="0.1" defaultValue="8.5" />
              </label>
              <label>
                Atenção até
                <input type="number" min="0" max="14" step="0.1" defaultValue="9.5" />
              </label>
              <label>
                Crítico acima de
                <input type="number" min="0" max="14" step="0.1" defaultValue="9.5" />
              </label>
            </div>
            <small className="settings-hint">Faixa válida do sensor: 0 a 14 pH.</small>
          </div>
          <div className="panel settings-card">
            <div className="settings-card-head">
              <span>
                <Cloud />
              </span>
              <div>
                <h3>Sensor de turbidez</h3>
                <p>Os limites variam conforme o perfil de monitoramento.</p>
              </div>
            </div>
            <label className="profile-field">
              Perfil do ambiente
              <select defaultValue="Ambiente Controlado">
                <option>Ambiente Controlado</option>
                <option>Água Tratada</option>
                <option>Rio</option>
                <option>Lago</option>
                <option>Estuário</option>
                <option>Personalizado</option>
              </select>
            </label>
            <div className="limit-row turbidity-limits">
              <label>
                Meta ideal abaixo de
                <div className="input-unit">
                  <input type="number" min="0" step="0.1" defaultValue="1.0" />
                  <span>NTU</span>
                </div>
              </label>
              <label>
                Atenção a partir de
                <div className="input-unit">
                  <input type="number" min="0" step="0.1" defaultValue="1.0" />
                  <span>NTU</span>
                </div>
              </label>
              <label>
                Crítico acima de
                <div className="input-unit">
                  <input type="number" min="0" step="0.1" defaultValue="5.0" />
                  <span>NTU</span>
                </div>
              </label>
            </div>
            <small className="settings-hint">
              Estes limites não são aplicados automaticamente a rios e lagos.
            </small>
          </div>
          <div className="panel settings-card hydrophone-settings">
            <div className="settings-card-head">
              <span>
                <Waves />
              </span>
              <div>
                <h3>Configuração do hidrofone</h3>
                <p>
                  Cadastre o hardware e o método de medição antes de ativar os limites acústicos.
                </p>
              </div>
            </div>
            <div className="hydrophone-groups">
              <fieldset className="settings-group">
                <legend>Hardware</legend>
                <div className="settings-fields hardware-fields">
                  <label>
                    Modelo do hidrofone
                    <input placeholder="A definir" />
                  </label>
                  <label>
                    Sensibilidade
                    <div className="input-unit">
                      <input type="number" step="0.1" placeholder="Informe" />
                      <span>dB re 1 V/µPa</span>
                    </div>
                  </label>
                  <label>
                    Faixa de frequência
                    <input placeholder="Ex.: frequência mínima – máxima" />
                  </label>
                  <label>
                    Ganho
                    <div className="input-unit">
                      <input type="number" step="0.1" placeholder="Informe" />
                      <span>dB</span>
                    </div>
                  </label>
                  <label>
                    Frequência de amostragem
                    <div className="input-unit">
                      <input type="number" min="0" step="1" placeholder="Informe" />
                      <span>Hz</span>
                    </div>
                  </label>
                  <label>
                    Profundidade
                    <div className="input-unit">
                      <input type="number" min="0" step="0.1" placeholder="Informe" />
                      <span>m</span>
                    </div>
                  </label>
                </div>
              </fieldset>
              <fieldset className="settings-group">
                <legend>Medição</legend>
                <div className="settings-fields measurement-fields">
                  <label>
                    Parâmetro
                    <select defaultValue="RMS">
                      <option>RMS</option>
                      <option>Peak</option>
                      <option>Leq</option>
                      <option>PSD</option>
                    </select>
                  </label>
                  <label>
                    Janela de medição
                    <div className="input-unit">
                      <input type="number" min="0" step="0.1" placeholder="Informe" />
                      <span>s</span>
                    </div>
                  </label>
                  <label>
                    Faixa de frequência
                    <input placeholder="Frequência mínima – máxima" />
                  </label>
                  <label>
                    Unidade
                    <select defaultValue="dB re 1 µPa">
                      <option>dB re 1 µPa</option>
                    </select>
                  </label>
                  <label>
                    Intervalo de registro
                    <select defaultValue="1 minuto">
                      <option>1 segundo</option>
                      <option>5 segundos</option>
                      <option>10 segundos</option>
                      <option>30 segundos</option>
                      <option>1 minuto</option>
                      <option>5 minutos</option>
                      <option>10 minutos</option>
                      <option>Personalizado</option>
                    </select>
                  </label>
                </div>
              </fieldset>
              <fieldset className="settings-group limits-group">
                <legend>Limites</legend>
                <p className="group-note">
                  Preencha somente após validar as referências para o equipamento e ambiente
                  monitorado.
                </p>
                <div className="settings-fields acoustic-limits">
                  <label>
                    Normal até
                    <div className="input-unit">
                      <input type="number" step="0.1" placeholder="X" />
                      <span>dB re 1 µPa</span>
                    </div>
                  </label>
                  <label>
                    Atenção a partir de
                    <div className="input-unit">
                      <input type="number" step="0.1" placeholder="Y" />
                      <span>dB re 1 µPa</span>
                    </div>
                  </label>
                  <label>
                    Crítico acima de
                    <div className="input-unit">
                      <input type="number" step="0.1" placeholder="Z" />
                      <span>dB re 1 µPa</span>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
          <div className="settings-actions">
            {settingsSaved && (
              <span className="save-confirmation">✓ Configurações salvas para {selected.name}</span>
            )}
            <button className="primary" onClick={() => setSettingsSaved(true)}>
              Salvar configurações
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
