import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BatteryMedium,
  Bell,
  ChevronDown,
  Clock3,
  Cloud,
  Download,
  Eye,
  EyeOff,
  Info,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Plus,
  Radio,
  Settings,
  SlidersHorizontal,
  Thermometer,
  User,
  Wifi,
  Waves,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

type Level = "normal" | "attention" | "critical" | "unconfigured" | "offline";
type Metric = "temperature" | "ph" | "sound" | "turbidity";
type Reading = { time: string; temperature: number; ph: number; sound: number; turbidity: number };
type ExportOptions = {
  period: string;
  sensor: string;
  includeValues: boolean;
  includeStatus: boolean;
  includeLocation: boolean;
  includeDateTime: boolean;
};

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
const chartConfig: Record<Metric, { label: string; unit: string; color: string }> = {
  temperature: { label: "Temperatura", unit: "°C", color: "#0b9aa5" },
  ph: { label: "pH", unit: "pH", color: "#2e8b70" },
  turbidity: { label: "Turbidez", unit: "NTU", color: "#d18a18" },
  sound: { label: "Hidrofone", unit: "dB re 1 µPa", color: "#3478a0" },
};
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
  unconfigured: "Sem classificação",
  offline: "Sem comunicação",
};
const levelClass: Record<Level, string> = {
  normal: "good",
  attention: "warn",
  critical: "bad",
  unconfigured: "neutral",
  offline: "offline",
};

const overallStatus = (reading: Reading, place: string): Level => {
  const levels = (["temperature", "ph", "turbidity"] as Metric[]).map((metric) =>
    status(metric, reading[metric], place),
  );
  return levels.includes("critical")
    ? "critical"
    : levels.includes("attention")
      ? "attention"
      : "normal";
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
        <span className="sensor-online">
          <i /> Online · há 1 min
        </span>
      </div>
    </section>
  );
}

function HydrophoneCard({ data }: { data: Reading[] }) {
  const latest = data.at(-1)!;
  const previous = data.at(-2)!;
  const delta = latest.sound - previous.sound;
  const trend =
    Math.abs(delta) < 1
      ? "→ estável"
      : `${delta > 0 ? "↑" : "↓"} ${delta > 0 ? "+" : ""}${delta} dB`;
  const values = data.map((reading) => reading.sound);

  return (
    <section className="metric-card hydrophone-card">
      <div className="card-top">
        <div className="metric-title">
          <Waves />
          <span>Hidrofone</span>
        </div>
        <span className="badge neutral">SEM CLASSIFICAÇÃO</span>
      </div>
      <div className="metric-value">
        {latest.sound}
        <small>dB re 1 µPa</small>
      </div>
      <p className="acoustic-context">RMS · 100 Hz–10 kHz · últimos 60 s</p>
      <div className="classification-note">
        <AlertTriangle size={16} />
        <div>
          <b>Limites não configurados</b>
          <span>O valor está sendo registrado, mas não classificado.</span>
        </div>
      </div>
      <Sparkline data={data} metric="sound" color="#789397" />
      <div className="metric-footer">
        <span>
          Mín. <b>{Math.min(...values)} dB</b>
        </span>
        <span>
          Máx. <b>{Math.max(...values)} dB</b>
        </span>
        <span className="trend-value">{trend}</span>
        <span className="sensor-online">
          <i /> Online · há 1 min
        </span>
      </div>
    </section>
  );
}

function LoginScreen({ onLogin }: { onLogin: (remember: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setRecovery(false);
    setLoading(true);
    window.setTimeout(() => {
      if (email.trim().toLowerCase() === "admin@ecoreef.com.br" && password === "EcoReef2026") {
        onLogin(remember);
        return;
      }
      setLoading(false);
      setError("E-mail ou senha incorretos.");
    }, 850);
  };

  return (
    <main className="login-page">
      <section className="login-identity" aria-label="Identidade EcoReef">
        <div className="login-brand">
          <img src="/ecoreef-logo.png" alt="Símbolo EcoReef" />
          <img src="/ecoreef-wordmark.png" alt="EcoReef" />
        </div>
        <div className="aquatic-visual" aria-hidden="true">
          <span className="sonar-ring ring-one" />
          <span className="sonar-ring ring-two" />
          <div className="monitor-node node-one">
            <Radio />
          </div>
          <div className="monitor-node node-two">
            <Activity />
          </div>
          <div className="monitor-node node-three">
            <Waves />
          </div>
          <div className="water-line water-one" />
          <div className="water-line water-two" />
          <div className="reef-shape reef-one" />
          <div className="reef-shape reef-two" />
        </div>
        <div className="login-message">
          <p>TECNOLOGIA PARA PRESERVAR</p>
          <h1>Monitoramento inteligente para ambientes aquáticos.</h1>
          <span>Dados ambientais claros para decisões mais rápidas e responsáveis.</span>
        </div>
        <div className="system-operational">
          <i /> Sistema operacional
        </div>
      </section>

      <section className="login-access">
        <div className="login-card">
          <div className="login-mobile-brand">
            <img src="/ecoreef-logo.png" alt="EcoReef" />
            <strong>ecoreef</strong>
          </div>
          <div className="login-heading">
            <p>CENTRAL DE MONITORAMENTO</p>
            <h2>Bem-vindo ao EcoReef</h2>
            <span>Acesse sua Central de Monitoramento</span>
          </div>
          <form onSubmit={submit} noValidate>
            <label htmlFor="login-email">E-mail</label>
            <div className="auth-input">
              <Mail />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </div>
            <label htmlFor="login-password">Senha</label>
            <div className="auth-input">
              <Lock />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Lembrar de mim
              </label>
              <button
                type="button"
                onClick={() => {
                  setRecovery(true);
                  setError("");
                }}
              >
                Esqueci minha senha
              </button>
            </div>
            {error && (
              <div className="login-feedback error">
                <AlertTriangle /> {error}
              </div>
            )}
            {recovery && (
              <div className="login-feedback information">
                <Info /> Contate o administrador do EcoReef para redefinir seu acesso.
              </div>
            )}
            <button
              className="login-submit"
              type="submit"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <span className="login-spinner" /> Entrando na Central...
                </>
              ) : (
                "ENTRAR"
              )}
            </button>
          </form>
          <div className="demo-credentials">
            <span>Acesso de demonstração</span>
            <b>admin@ecoreef.com.br</b>
            <code>EcoReef2026</code>
          </div>
          <small className="login-security">
            <Lock /> Ambiente protegido · EcoReef v1.0
          </small>
        </div>
      </section>
    </main>
  );
}

function Index() {
  const [place, setPlace] = useState("controlled");
  const [page, setPage] = useState("Dashboard");
  const [demo, setDemo] = useState(true);
  const [now, setNow] = useState(new Date());
  const [mobile, setMobile] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [activeMetric, setActiveMetric] = useState<Metric>("temperature");
  const [authenticated, setAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    setAuthenticated(
      window.localStorage.getItem("ecoreef-auth") === "active" ||
        window.sessionStorage.getItem("ecoreef-auth") === "active",
    );
    setAuthReady(true);
  }, []);
  const login = (remember: boolean) => {
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem("ecoreef-auth", "active");
    setAuthenticated(true);
  };
  const logout = () => {
    window.localStorage.removeItem("ecoreef-auth");
    window.sessionStorage.removeItem("ecoreef-auth");
    setUserMenuOpen(false);
    setAuthenticated(false);
  };
  const data = samples[place];
  const latest = data.at(-1)!;
  const selected = locations.find((l) => l.id === place)!;
  const overall = overallStatus(latest, place);
  const qualityScore = overall === "critical" ? 42 : overall === "attention" ? 86 : 94;
  const qualityLabel =
    overall === "critical"
      ? "Condição crítica"
      : overall === "attention"
        ? "Boa condição"
        : "Excelente condição";
  const activeChart = chartConfig[activeMetric];
  const attentionMetrics = (["temperature", "ph", "turbidity"] as Metric[]).filter(
    (metric) => status(metric, latest[metric], place) === "attention",
  );
  const criticalMetrics = (["temperature", "ph", "turbidity"] as Metric[]).filter(
    (metric) => status(metric, latest[metric], place) === "critical",
  );
  const affectedCount = overall === "critical" ? criticalMetrics.length : attentionMetrics.length;
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
        kind: "alert" as const,
      },
      {
        metric: "Hidrofone",
        value: `${latest.sound} dB re 1 µPa`,
        level: "unconfigured" as Level,
        text: "Configuração pendente · valor registrado sem classificação",
        kind: "info" as const,
      },
    ],
    [place, latest],
  );
  const nav = ["Dashboard", "Histórico", "Alertas", "Sensores", "Locais", "Configurações"];
  const exportCsv = (options: ExportOptions) => {
    const selectedMetrics =
      options.sensor === "all"
        ? (["temperature", "ph", "sound", "turbidity"] as Metric[])
        : ([options.sensor] as Metric[]);
    const headers: string[] = [];
    if (options.includeDateTime) headers.push("Data", "Hora");
    if (options.includeLocation) headers.push("Local");
    if (options.includeValues) {
      selectedMetrics.forEach((metric) =>
        headers.push(
          metric === "temperature"
            ? "Temperatura °C"
            : metric === "ph"
              ? "pH"
              : metric === "sound"
                ? "Hidrofone dB re 1 µPa"
                : "Turbidez NTU",
        ),
      );
    }
    if (options.includeStatus) headers.push("Status geral", "Status do hidrofone");
    const rows = data.map((reading) => {
      const cells: Array<string | number> = [];
      if (options.includeDateTime) cells.push("17/08/2026", reading.time);
      if (options.includeLocation) cells.push(selected.name);
      if (options.includeValues) selectedMetrics.forEach((metric) => cells.push(reading[metric]));
      if (options.includeStatus)
        cells.push(levelText[overallStatus(reading, place)], levelText.unconfigured);
      return cells.join(",");
    });
    const csv = [`Período,${options.period}`, headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "historico-agua.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  if (!authReady) {
    return (
      <main className="auth-boot">
        <img src="/ecoreef-logo.png" alt="EcoReef" />
        <span className="login-spinner" />
      </main>
    );
  }
  if (!authenticated) return <LoginScreen onLogin={login} />;

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
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <div
              className={item === "Configurações" ? "nav-item-wrap nav-settings" : "nav-item-wrap"}
              key={item}
            >
              {item === "Configurações" && <span className="nav-section-label">GERENCIAMENTO</span>}
              <button
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
                {item === "Alertas" && <i title="1 alerta ativo">1</i>}
              </button>
            </div>
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
            <button className="icon-button" title="1 alerta ativo e 1 informação pendente">
              <Bell size={19} />
              <b>1</b>
            </button>
            <div className="user-menu">
              <button
                className="user-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-label="Abrir menu do usuário"
              >
                <span className="avatar">AM</span>
                <ChevronDown />
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-summary">
                    <span className="avatar">AM</span>
                    <div>
                      <b>Administrador</b>
                      <small>admin@ecoreef.com.br</small>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setUserMenuOpen(false);
                    }}
                  >
                    <User /> Meu perfil
                  </button>
                  <button
                    onClick={() => {
                      setPage("Configurações");
                      setUserMenuOpen(false);
                    }}
                  >
                    <Settings /> Configurações
                  </button>
                  <button className="logout-button" onClick={logout}>
                    <LogOut /> Sair
                  </button>
                </div>
              )}
            </div>
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
            <section className="status-grid">
              <div className={`status-hero ${levelClass[overall]}`}>
                <div className="status-orb">{overall === "normal" ? "✓" : "!"}</div>
                <div>
                  <p>STATUS GERAL DA ÁGUA</p>
                  <h2>{levelText[overall].toUpperCase()}</h2>
                  <span className="hero-summary">
                    {overall === "normal"
                      ? "Parâmetros classificados dentro das condições configuradas"
                      : `${affectedCount} ${affectedCount === 1 ? "parâmetro requer" : "parâmetros requerem"} acompanhamento`}
                  </span>
                  <div className="hero-reasons">
                    {status("turbidity", latest.turbidity, place) === "attention" && (
                      <span>Turbidez: {latest.turbidity} NTU — acima da meta ideal</span>
                    )}
                    <span>Hidrofone: limites ainda não configurados</span>
                  </div>
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
              </div>
              <div className="quality-card panel">
                <div
                  className="quality-ring"
                  style={{ "--score": qualityScore } as React.CSSProperties}
                >
                  <div>
                    <strong>{qualityScore}</strong>
                    <span>/ 100</span>
                  </div>
                </div>
                <div className="quality-copy">
                  <p>ÍNDICE ECOREEF</p>
                  <h3>Qualidade ambiental</h3>
                  <span className={`badge ${levelClass[overall]}`}>
                    {qualityLabel.toUpperCase()}
                  </span>
                  <small>Calculado a partir dos parâmetros classificados.</small>
                </div>
              </div>
            </section>
            <section className="panel status-overview" aria-label="Resumo dos parâmetros">
              <div className="overview-head">
                <div>
                  <p>LEITURA RÁPIDA</p>
                  <h3>Situação dos parâmetros</h3>
                </div>
                <span>4 sensores · atualização há 1 min</span>
              </div>
              <div className="overview-table">
                {[
                  {
                    label: "Temperatura",
                    value: `${latest.temperature.toFixed(1).replace(".", ",")} °C`,
                    level: status("temperature", latest.temperature, place),
                    icon: <Thermometer />,
                  },
                  {
                    label: "pH",
                    value: latest.ph.toFixed(1).replace(".", ","),
                    level: status("ph", latest.ph, place),
                    icon: <Activity />,
                  },
                  {
                    label: "Turbidez",
                    value: `${latest.turbidity.toFixed(1).replace(".", ",")} NTU`,
                    level: status("turbidity", latest.turbidity, place),
                    icon: <Cloud />,
                  },
                  {
                    label: "Hidrofone",
                    value: `${latest.sound} dB re 1 µPa`,
                    level: "unconfigured" as Level,
                    icon: <Waves />,
                  },
                ].map((item) => (
                  <div className="overview-row" key={item.label}>
                    <span className="overview-sensor">
                      {item.icon}
                      {item.label}
                    </span>
                    <b>{item.value}</b>
                    <span className={`badge ${levelClass[item.level]}`}>
                      {levelText[item.level].toUpperCase()}
                    </span>
                  </div>
                ))}
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
                    ? "Normal < 1,0 · Atenção 1,0–5,0 · Crítico > 5,0 NTU"
                    : "Perfil com limites configuráveis"
                }
              />
              <HydrophoneCard data={data} />
            </section>
            {status("turbidity", latest.turbidity, place) === "attention" && (
              <section className="decision-callout">
                <div className="decision-icon">
                  <AlertTriangle />
                </div>
                <div className="decision-main">
                  <p>ATENÇÃO — TURBIDEZ ELEVADA</p>
                  <h3>{latest.turbidity.toFixed(1).replace(".", ",")} NTU</h3>
                  <span>Limite ideal: &lt; 1,0 NTU</span>
                </div>
                <div className="decision-detail">
                  <b>📈 Tendência: estável</b>
                  <span>Recomendação: acompanhar as próximas leituras.</span>
                </div>
              </section>
            )}
            <section className="lower-grid monitoring-grid">
              <div className="panel chart-panel realtime-panel">
                <div className="panel-head">
                  <div>
                    <p className="section-kicker">MONITORAMENTO EM TEMPO REAL</p>
                    <h3>{activeChart.label}</h3>
                    <p>Última hora · {selected.name}</p>
                  </div>
                  <div className="current-reading">
                    <span>LEITURA ATUAL</span>
                    <b>
                      {latest[activeMetric].toLocaleString("pt-BR", { maximumFractionDigits: 1 })}{" "}
                      <small>{activeChart.unit}</small>
                    </b>
                  </div>
                </div>
                <div
                  className="metric-tabs"
                  role="tablist"
                  aria-label="Selecionar parâmetro do gráfico"
                >
                  {(Object.keys(chartConfig) as Metric[]).map((metric) => (
                    <button
                      key={metric}
                      className={activeMetric === metric ? "active" : ""}
                      onClick={() => setActiveMetric(metric)}
                    >
                      {chartConfig[metric].label}
                    </button>
                  ))}
                </div>
                <div className="big-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="big" x1="0" x2="0" y1="0" y2="1">
                          <stop stopColor={activeChart.color} stopOpacity=".3" />
                          <stop offset="1" stopColor={activeChart.color} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#dfecef" />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} />
                      <YAxis
                        domain={["dataMin - 1", "dataMax + 1"]}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${value} ${activeChart.unit}`, activeChart.label]}
                      />
                      <ReferenceLine
                        x={latest.time}
                        stroke={activeChart.color}
                        strokeDasharray="4 4"
                        label={{
                          value: "Agora",
                          position: "insideTopRight",
                          fill: activeChart.color,
                          fontSize: 10,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={activeMetric}
                        stroke={activeChart.color}
                        strokeWidth={3}
                        fill="url(#big)"
                        animationDuration={650}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel alerts-panel">
                <div className="panel-head">
                  <div>
                    <h3>Alertas recentes</h3>
                    <p>1 alerta ativo · 1 informativo</p>
                  </div>
                  <button onClick={() => setPage("Alertas")}>Ver todos</button>
                </div>
                {alerts.map((a, i) => (
                  <div className={`alert-row ${a.kind === "info" ? "informative" : ""}`} key={i}>
                    <span
                      className={`alert-symbol ${a.kind === "info" ? "info" : levelClass[a.level]}`}
                    >
                      {a.kind === "info" ? <Info size={13} /> : "!"}
                    </span>
                    <div>
                      <b>
                        {a.kind === "alert"
                          ? `${a.metric} acima do ideal`
                          : `${a.metric}: configuração pendente`}
                      </b>
                      <p>
                        {a.value} · {a.text}
                      </p>
                      {a.kind === "alert" && (
                        <button className="alert-link" onClick={() => setPage("Histórico")}>
                          Ver histórico →
                        </button>
                      )}
                    </div>
                    <small>há 2 min</small>
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
            onLocationChange={setPlace}
            onAdd={() => setShowAdd(true)}
          />
        )}
      </div>
      <nav className="mobile-nav" aria-label="Navegação móvel">
        {nav.map((item) => (
          <button
            key={item}
            className={page === item ? "active" : ""}
            onClick={() => setPage(item)}
            title={item}
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
            <span>{item}</span>
            {item === "Alertas" && <i>1</i>}
          </button>
        ))}
      </nav>
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
      {showProfile && (
        <div className="modal-backdrop" onClick={() => setShowProfile(false)}>
          <div className="modal profile-modal" onClick={(event) => event.stopPropagation()}>
            <div className="profile-avatar">AM</div>
            <h2>Administrador EcoReef</h2>
            <p>admin@ecoreef.com.br</p>
            <div className="profile-details">
              <span>
                <b>Perfil</b> Administrador
              </span>
              <span>
                <b>Unidade</b> Ambiente Controlado 01
              </span>
              <span>
                <b>Status</b> <i /> Acesso ativo
              </span>
            </div>
            <div>
              <button className="primary" onClick={() => setShowProfile(false)}>
                Fechar
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
  onLocationChange,
  onAdd,
}: {
  page: string;
  selected: (typeof locations)[0];
  data: Reading[];
  latest: Reading;
  exportCsv: (options: ExportOptions) => void;
  onLocationChange: (locationId: string) => void;
  onAdd: () => void;
}) {
  const [period, setPeriod] = useState("Última hora");
  const [sensorFilter, setSensorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showExport, setShowExport] = useState(false);
  const [includeValues, setIncludeValues] = useState(true);
  const [includeStatus, setIncludeStatus] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeDateTime, setIncludeDateTime] = useState(true);
  const rows = data
    .slice()
    .reverse()
    .filter((reading) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "unconfigured") return true;
      return overallStatus(reading, selected.id) === statusFilter;
    });
  const showMetric = (metric: Metric) => sensorFilter === "all" || sensorFilter === metric;
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
          <button className="primary" onClick={() => setShowExport(true)}>
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
          <div className="history-chart-block">
            <div className="panel-head">
              <div>
                <h3>Análise temporal comparativa</h3>
                <p>Temperatura, pH e turbidez · {period}</p>
              </div>
              <span className="badge neutral">INTERATIVO</span>
            </div>
            <div className="history-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid vertical={false} stroke="#e2ecec" />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperatura °C"
                    stroke="#ef8b4d"
                    strokeWidth={2.2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ph"
                    name="pH"
                    stroke="#158f9b"
                    strokeWidth={2.2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="turbidity"
                    name="Turbidez NTU"
                    stroke="#d49a25"
                    strokeWidth={2.2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="period-filter" aria-label="Filtro rápido de período">
            {["Última hora", "24 horas", "7 dias", "Personalizado"].map((item) => (
              <button
                key={item}
                className={period === item ? "active" : ""}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="history-filters">
            <label>
              Local
              <select
                value={selected.id}
                onChange={(event) => onLocationChange(event.target.value)}
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sensor
              <select
                value={sensorFilter}
                onChange={(event) => setSensorFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="temperature">Temperatura</option>
                <option value="ph">pH</option>
                <option value="turbidity">Turbidez</option>
                <option value="sound">Hidrofone</option>
              </select>
            </label>
            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="normal">Normal</option>
                <option value="attention">Atenção</option>
                <option value="critical">Crítico</option>
                <option value="unconfigured">Sem classificação</option>
              </select>
            </label>
            <span className="filter-context">
              <SlidersHorizontal size={15} /> {period} · {rows.length} registros
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>DATA / HORA</th>
                <th>LOCAL</th>
                {showMetric("temperature") && <th>TEMPERATURA</th>}
                {showMetric("ph") && <th>pH</th>}
                {showMetric("sound") && <th>HIDROFONE</th>}
                {showMetric("turbidity") && <th>TURBIDEZ</th>}
                <th>STATUS GERAL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((reading) => {
                const rowLevel = overallStatus(reading, selected.id);
                return (
                  <tr key={reading.time}>
                    <td>17 ago · {reading.time}</td>
                    <td>{selected.name}</td>
                    {showMetric("temperature") && <td>{reading.temperature} °C</td>}
                    {showMetric("ph") && <td>{reading.ph}</td>}
                    {showMetric("sound") && (
                      <td>
                        <span
                          className="hydrophone-history"
                          title={`${reading.sound} dB re 1 µPa · RMS · 100 Hz–10 kHz`}
                        >
                          <b>{reading.sound} dB</b>
                          <small>⚪ Sem classificação</small>
                        </span>
                      </td>
                    )}
                    {showMetric("turbidity") && <td>{reading.turbidity} NTU</td>}
                    <td>
                      <span className={`badge ${levelClass[rowLevel]}`}>
                        {levelText[rowLevel].toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {showExport && (
            <div className="modal-backdrop" onClick={() => setShowExport(false)}>
              <div className="modal export-modal" onClick={(event) => event.stopPropagation()}>
                <h2>Exportar dados</h2>
                <p>Configure o conteúdo do arquivo CSV.</p>
                <label>
                  Período
                  <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                    <option>Última hora</option>
                    <option>24 horas</option>
                    <option>7 dias</option>
                    <option>Personalizado</option>
                  </select>
                </label>
                <label>
                  Sensores
                  <select
                    value={sensorFilter}
                    onChange={(event) => setSensorFilter(event.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="temperature">Temperatura</option>
                    <option value="ph">pH</option>
                    <option value="turbidity">Turbidez</option>
                    <option value="sound">Hidrofone</option>
                  </select>
                </label>
                <fieldset className="export-options">
                  <legend>Incluir</legend>
                  <label>
                    <input
                      type="checkbox"
                      checked={includeValues}
                      onChange={(event) => setIncludeValues(event.target.checked)}
                    />{" "}
                    Valores
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={includeStatus}
                      onChange={(event) => setIncludeStatus(event.target.checked)}
                    />{" "}
                    Status
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={includeLocation}
                      onChange={(event) => setIncludeLocation(event.target.checked)}
                    />{" "}
                    Localização
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={includeDateTime}
                      onChange={(event) => setIncludeDateTime(event.target.checked)}
                    />{" "}
                    Data/hora
                  </label>
                </fieldset>
                <div>
                  <button className="secondary" onClick={() => setShowExport(false)}>
                    Cancelar
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      exportCsv({
                        period,
                        sensor: sensorFilter,
                        includeValues,
                        includeStatus,
                        includeLocation,
                        includeDateTime,
                      });
                      setShowExport(false);
                    }}
                  >
                    <Download size={15} /> Exportar CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : page === "Sensores" ? (
        <div className="sensor-grid">
          {[
            {
              name: "Temperatura",
              model: "DS18B20",
              value: `${latest.temperature.toFixed(1).replace(".", ",")} °C`,
              level: status("temperature", latest.temperature, selected.id),
              battery: "87%",
            },
            {
              name: "pH",
              model: "Eletrodo de vidro / pHmetro",
              value: latest.ph.toFixed(1).replace(".", ","),
              level: status("ph", latest.ph, selected.id),
              battery: "Não informado",
            },
            {
              name: "Turbidez",
              model: "Modelo a definir",
              value: `${latest.turbidity.toFixed(1).replace(".", ",")} NTU`,
              level: status("turbidity", latest.turbidity, selected.id),
              battery: "Não informado",
            },
            {
              name: "Hidrofone",
              model: "Modelo a definir",
              value: `${latest.sound} dB re 1 µPa`,
              level: "unconfigured" as Level,
              battery: "Não informado",
            },
          ].map((sensor) => (
            <div className="panel sensor sensor-detail" key={sensor.name}>
              <div className="sensor-card-top">
                <span className="sensor-icon">
                  <Radio />
                </span>
                <span className="connectivity-badge">
                  <i /> ONLINE
                </span>
              </div>
              <h3>{sensor.name}</h3>
              <p>{sensor.model}</p>
              <div className="sensor-reading">{sensor.value}</div>
              <span className={`badge ${levelClass[sensor.level]}`}>
                {levelText[sensor.level].toUpperCase()}
              </span>
              <div className="sensor-meta">
                <span>
                  <Clock3 />
                  Última leitura <b>há 1 min</b>
                </span>
                <span>
                  <Wifi />
                  Última comunicação <b>há 1 min</b>
                </span>
                <span>
                  <Activity />
                  Intervalo <b>1 minuto</b>
                </span>
                <span>
                  <BatteryMedium />
                  Bateria <b>{sensor.battery}</b>
                </span>
              </div>
              <small>{selected.name}</small>
            </div>
          ))}
        </div>
      ) : page === "Locais" ? (
        <div className="locations-grid">
          {locations.map((location) => {
            const reading = samples[location.id].at(-1)!;
            const locationLevel = overallStatus(reading, location.id);
            const levels = (["temperature", "ph", "turbidity"] as Metric[]).map((metric) =>
              status(metric, reading[metric], location.id),
            );
            const normalCount = levels.filter((level) => level === "normal").length;
            const attentionCount = levels.filter((level) => level === "attention").length;
            const unconfiguredCount = levels.filter((level) => level === "unconfigured").length + 1;
            return (
              <div className="panel location location-detail" key={location.id}>
                <div className="location-card-top">
                  <span className={`location-operational ${levelClass[locationLevel]}`}>
                    <i />
                    {locationLevel === "normal"
                      ? "OPERACIONAL"
                      : levelText[locationLevel].toUpperCase()}
                  </span>
                  <MapPin />
                </div>
                <h3>{location.name}</h3>
                <p>
                  {location.type} · Perfil {location.profile}
                </p>
                <div className="location-summary">
                  <span>
                    <b>4</b> sensores
                  </span>
                  <span>
                    <b>{normalCount}</b> normais
                  </span>
                  <span>
                    <b>{attentionCount}</b> atenção
                  </span>
                  <span>
                    <b>{unconfiguredCount}</b> sem classificação
                  </span>
                </div>
                <div className="location-updated">
                  <Clock3 />
                  Última atualização: há 1 min
                </div>
              </div>
            );
          })}
        </div>
      ) : page === "Alertas" ? (
        <div className="alerts-workspace">
          <div className="alert-counters">
            <div className="counter-card warn">
              <b>1</b>
              <span>Alerta ativo</span>
            </div>
            <div className="counter-card info">
              <b>1</b>
              <span>Configuração pendente</span>
            </div>
            <div className="counter-card good">
              <b>0</b>
              <span>Críticos</span>
            </div>
          </div>
          <div className="panel alert-list">
            <div className="alert-section-title">
              <span className="badge warn">ATENÇÃO</span>
              <p>Ocorrências ambientais que exigem acompanhamento</p>
            </div>
            <div className="alert-row">
              <span className="alert-symbol warn">!</span>
              <div>
                <b>Turbidez em atenção: {latest.turbidity} NTU</b>
                <p>{selected.name} · acima da meta ideal de 1,0 NTU · agora</p>
              </div>
              <button className="secondary">Visualizado</button>
            </div>
            <div className="alert-section-title information">
              <span className="badge info">INFORMATIVO</span>
              <p>Pendências de configuração — não representam problema ambiental</p>
            </div>
            <div className="alert-row informative">
              <span className="alert-symbol info">
                <Info size={13} />
              </span>
              <div>
                <b>Hidrofone funcionando sem classificação</b>
                <p>51 dB re 1 µPa está sendo registrado; defina os limites para classificar.</p>
              </div>
              <button className="secondary">Configurar</button>
            </div>
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
            <div className="threshold-summary">
              <span className="bad">Crítico: &lt; 24,0 ou ≥ 30,0 °C</span>
              <span className="good">Normal: 24,0–28,0 °C</span>
              <span className="warn">Atenção: &gt; 28,0–&lt; 30,0 °C</span>
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
            <div className="threshold-summary">
              <span className="good">Normal: 6,0–8,5</span>
              <span className="warn">Atenção: &gt; 8,5–9,5</span>
              <span className="bad">Crítico: &lt; 6,0 ou &gt; 9,5</span>
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
            <div className="threshold-summary">
              <span className="good">Normal: &lt; 1,0 NTU</span>
              <span className="warn">Atenção: 1,0–5,0 NTU</span>
              <span className="bad">Crítico: &gt; 5,0 NTU</span>
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
