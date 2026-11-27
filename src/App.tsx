import { useEffect, useMemo, useRef, useState } from "react";

type Module = {
  id: string;
  name: string;
  description: string;
  guide: string;
  category: string;
  enabled: boolean;
  favorite: boolean;
  bind?: string;
  bindMode?: "hold" | "toggle";
  bindHidden?: boolean;
  color?: string;
  sections: string[];
};

type ThemePreset = {
  id: string;
  name: string;
  accent: string;
  accent2: string;
  surface: string;
  text: string;
  bg: string;
};

type GlassPreset = {
  id: string;
  label: string;
  desc: string;
  glassiness: number;
  blur: number;
  sheen: number;
};

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "sakura",
    name: "Сакура и сирень",
    accent: "#ec4899",
    accent2: "#8b5cf6",
    surface: "#ffffff",
    text: "#2c1b36",
    bg: "sakura",
  },
  {
    id: "quartz",
    name: "Розовый кварц",
    accent: "#e11d74",
    accent2: "#fb7185",
    surface: "#fff9fc",
    text: "#3a1d2e",
    bg: "quartz",
  },
  {
    id: "orchid",
    name: "Ледяная орхидея",
    accent: "#d946ef",
    accent2: "#38bdf8",
    surface: "#fcfaff",
    text: "#231d3b",
    bg: "orchid",
  },
  {
    id: "peach",
    name: "Шёлковый персик",
    accent: "#f43f5e",
    accent2: "#f59e0b",
    surface: "#fffaf7",
    text: "#3a2229",
    bg: "peach",
  },
];

const GLASS_PRESETS: GlassPreset[] = [
  { id: "crystal", label: "Кристалл", desc: "Воздушное прозрачное стекло", glassiness: 82, blur: 22, sheen: 92 },
  { id: "silk", label: "Матовый шёлк", desc: "Мягкое размытие и баланс", glassiness: 68, blur: 28, sheen: 76 },
  { id: "frost", label: "Иней", desc: "Максимальное размытие фона", glassiness: 56, blur: 36, sheen: 86 },
  { id: "solid", label: "Плотный", desc: "Чёткий молочный фон", glassiness: 24, blur: 10, sheen: 45 },
];

const CATEGORY_META: Record<string, { label: string; color: string; hint: string }> = {
  Combat: { label: "Бой", color: "#ec4899", hint: "Модули автоматической атаки, прицеливания и контроля дистанции" },
  Movement: { label: "Движение", color: "#8b5cf6", hint: "Ускорение передвижения, спринт и плавное управление полётом" },
  Player: { label: "Игрок", color: "#f43f5e", hint: "Защита персонажа, инвентарь и автоматическое переключение предметов" },
  Render: { label: "Визуал", color: "#6366f1", hint: "Подсветка сущностей, освещение мира и визуальные индикаторы" },
  Misc: { label: "Прочее", color: "#14b8a6", hint: "Защита союзников и вспомогательные утилиты комфорта" },
};

const initialModules: Module[] = [
  {
    id: "aura",
    name: "Aura",
    description: "Автоматически атакует ближайшие цели",
    guide: "Выбирает приоритетного противника в заданной дистанции захвата, плавно доворачивает камеру и наносит удары с учётом античита.",
    category: "Combat",
    enabled: true,
    favorite: true,
    bind: "R",
    bindMode: "toggle",
    sections: ["Основное", "Ротации"],
  },
  {
    id: "trigger",
    name: "TriggerBot",
    description: "Удар при наведении прицела на цель",
    guide: "Срабатывает только когда перекрестие уже наведено на хитбокс врага, сохраняя естественную механику игры.",
    category: "Combat",
    enabled: true,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "swap",
    name: "AutoSwap",
    description: "Быстрая смена предмета в руке",
    guide: "Мгновенно переключает слот между оружием, щитом или тотемом по заданному условию боя.",
    category: "Combat",
    enabled: false,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "crystal",
    name: "CrystalAura",
    description: "Автоматическая установка кристаллов",
    guide: "Просчитывает оптимальные точки размещения и подрыва кристаллов Края с минимальным уроном по себе.",
    category: "Combat",
    enabled: false,
    favorite: false,
    sections: ["Основное", "Ротации"],
  },
  {
    id: "anchor",
    name: "AnchorAura",
    description: "Бой через якоря возрождения",
    guide: "Заряжает и активирует якоря рядом с целью в безопасном радиусе с контролем задержки.",
    category: "Combat",
    enabled: false,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "hitboxes",
    name: "HitBoxes",
    description: "Гибкое расширение хитбоксов",
    guide: "Увеличивает зону попадания по выбранным сущностям для более стабильных ударов в динамике.",
    category: "Combat",
    enabled: false,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "criticals",
    name: "Criticals",
    description: "Повышает шанс критического удара",
    guide: "Синхронизирует микро-подпрыгивание или пакет падения в момент атаки для гарантированного крита.",
    category: "Combat",
    enabled: false,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "gapple",
    name: "AutoGapple",
    description: "Автоматическое лечение яблоками",
    guide: "Отслеживает уровень здоровья и вовремя активирует золотое яблоко при падении ниже порога.",
    category: "Combat",
    enabled: false,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "mouse",
    name: "TapeMouse",
    description: "Удержание или автоклик кнопки мыши",
    guide: "Эмулирует стабильное нажатие с заданным интервалом для фарма и непрерывных действий.",
    category: "Combat",
    enabled: false,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "sprint",
    name: "Auto Sprint",
    description: "Постоянный спринт при движении",
    guide: "Автоматически удерживает бег при любом движении вперёд без необходимости зажимать клавишу спринта.",
    category: "Movement",
    enabled: true,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "fly",
    name: "Elytra Fly",
    description: "Плавное управление полётом на элитрах",
    guide: "Стабилизирует траекторию и скорость полёта на элитрах, предотвращая резкую потерю высоты.",
    category: "Movement",
    enabled: false,
    favorite: true,
    bind: "F",
    bindMode: "toggle",
    sections: ["Основное"],
  },
  {
    id: "autototem",
    name: "Auto Totem",
    description: "Автосмена тотема в левой руке",
    guide: "Мгновенно переносит тотем бессмертия в левую руку, когда здоровье опускается до опасного уровня.",
    category: "Player",
    enabled: true,
    favorite: true,
    bind: "G",
    bindMode: "toggle",
    sections: ["Основное"],
  },
  {
    id: "esp",
    name: "Entity ESP",
    description: "Подсветка игроков и сущностей",
    guide: "Отображает контуры, полоски здоровья и дистанцию до выбранных целей даже сквозь препятствия.",
    category: "Render",
    enabled: true,
    favorite: true,
    bind: "H",
    bindMode: "toggle",
    sections: ["Основное"],
  },
  {
    id: "fullbright",
    name: "Full Bright",
    description: "Максимальная яркость в темноте",
    guide: "Плавно поднимает гамму освещения в пещерах и ночью без искажения цветов интерфейса.",
    category: "Render",
    enabled: false,
    favorite: false,
    sections: ["Основное"],
  },
  {
    id: "nofriend",
    name: "No Friend Damage",
    description: "Защита друзей от случайных ударов",
    guide: "Блокирует нанесение урона по игрокам из вашего списка друзей во всех боевых модулях.",
    category: "Misc",
    enabled: true,
    favorite: false,
    sections: ["Основное"],
  },
];

const categories = ["Combat", "Movement", "Player", "Render", "Misc"];
const QUICK_KEYS = ["R", "F", "G", "V", "X", "C", "Tab"];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    Combat: <><circle cx="12" cy="12" r="7" /><path d="M12 2v5m0 10v5M2 12h5m10 0h5" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></>,
    Movement: <><path d="M13 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" /><path d="m7 21 3-6 2 2 3-4-4-3-4 2m8 9 1-6 4-2" /></>,
    Render: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    Player: <><circle cx="12" cy="7.5" r="3.5" /><path d="M5 20.5a7 7 0 0 1 14 0" /></>,
    Misc: <><path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" /><path d="M12 12 5 7m7 5 7-5m-7 5v9" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9c0 .7.4 1.3 1 1.5h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
    brand: <><path d="M12 12C6.5 12 4.5 8 5.5 5c3-1 6.5 1.5 6.5 7Zm0 0c0-5.5 4-7.5 7-6.5 1 3-1.5 6.5-7 6.5Zm0 0c5.5 0 7.5 4 6.5 7-3 1-6.5-1.5-6.5-7Zm0 0c0 5.5-4 7.5-7 6.5-1-3 1.5-6.5 7-6.5Z" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15.2 15.2 4.3 4.3" /></>,
    glass: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12.5 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1-2-2v-.5" /><circle cx="8.5" cy="10.5" r="1" fill="currentColor" /><circle cx="12" cy="7.5" r="1" fill="currentColor" /><circle cx="15.5" cy="10.5" r="1" fill="currentColor" /></>,
    star: <path d="m12 3 2.8 5.6 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9-5.6 2.9 1.1-6.1L3 9.5l6.2-.9L12 3Z" />,
    sort: <path d="M6 4v16m-3-3 3 3 3-3M12 6h9m-9 5h6m-6 5h3" />,
    distance: <><path d="m3 17 14-14 4 4L7 21Zm5-5 2.5 2.5m0-5.5 2.5 2.5m0-5.5 2.5 2.5" /></>,
    shield: <path d="m12 3 8 3v5c0 5-8 10-8 10S4 16 4 11V6l8-3Z" />,
    rotation: <><path d="M20 8V3l-3 3a8 8 0 0 0-13 5M4 16v5l3-3a8 8 0 0 0 13-5" /></>,
    sliders: <><path d="M3 6h5m4 0h9M3 12h10m4 0h4M3 18h5m4 0h9" /><circle cx="10" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></>,
    camera: <><rect x="2.5" y="6" width="13" height="12" rx="2.5" /><path d="m15.5 10 6-3.5v11L15.5 14Z" /></>,
    users: <><circle cx="9" cy="7.5" r="3" /><path d="M3 19.5a6 6 0 0 1 12 0" /><circle cx="17.5" cy="8.5" r="2" /><path d="M16 14a4.5 4.5 0 0 1 5 4.5" /></>,
    keyboard: <><rect x="2.5" y="5.5" width="19" height="13" rx="3" /><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6m0-9h.01" /></>,
    bolt: <path d="M13 2 4.5 13h6.5L10 22l9.5-11H13l0-9Z" />,
    hold: <><path d="M12 4v8" /><circle cx="12" cy="16" r="4" /></>,
    toggle: <><rect x="2.5" y="7" width="19" height="10" rx="5" /><circle cx="16.5" cy="12" r="3" fill="currentColor" stroke="none" /></>,
    trash: <path d="M4 7h16m-10 4v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? paths.Combat}
    </svg>
  );
}

function Toggle({
  value,
  onChange,
  label,
  size = "md",
}: {
  value: boolean;
  onChange: () => void;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  const initialValue = useRef(value);
  const modified = value !== initialValue.current;
  return (
    <button
      type="button"
      className={`toggle toggle-${size} ${value ? "on" : "off"} ${modified ? "modified-toggle" : ""}`}
      role="switch"
      aria-checked={value}
      title={`${label}: ${value ? "ВКЛ" : "ВЫКЛ"}`}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
    >
      <span className="toggle-text" aria-hidden="true">
        {value ? "ВКЛ" : "ВЫКЛ"}
      </span>
      <span className="toggle-thumb" aria-hidden="true" />
    </button>
  );
}

function Slider({
  label,
  hint,
  value,
  min = 0,
  max = 100,
  step,
  suffix = "%",
  onChange,
  defaultValue,
  compact = false,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  defaultValue?: number;
  compact?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  defaultValue ??= ({
    "Дистанция атаки": 3,
    "Дистанция захвата": 1.2,
    "Угол обзора": 360,
    "Скорость поворота": 90,
    "Плавность": 70,
  } as Record<string, number>)[label];
  const modified = defaultValue !== undefined && value !== defaultValue;
  const resolvedStep = step ?? (suffix.includes("блок") ? 0.05 : 1);
  const formattedNumber = resolvedStep < 1 ? value.toFixed(2).replace(/0$/, "") : value.toLocaleString("ru-RU");
  const displayValue = `${formattedNumber}${suffix}`;

  return (
    <div className={`setting ${compact ? "setting-compact" : ""} ${modified ? "modified" : ""}`}>
      <div className="setting-copy">
        <div className="setting-label-row">
          <span className="setting-label">{label}</span>
          {modified && defaultValue !== undefined && (
            <button
              type="button"
              className="reset-dot"
              title={`Сбросить на стандартное (${defaultValue}${suffix})`}
              onClick={() => onChange(defaultValue!)}
            >
              сброс
            </button>
          )}
        </div>
        {hint && <small className="setting-hint">{hint}</small>}
      </div>
      <div className="range-control">
        <div className="slider-shell" style={{ "--pct": `${pct}%` } as React.CSSProperties}>
          <div className="slider-rail" aria-hidden="true">
            <span className="slider-tick" style={{ left: "25%" }} />
            <span className="slider-tick" style={{ left: "50%" }} />
            <span className="slider-tick" style={{ left: "75%" }} />
            <div className="slider-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="slider-thumb-vis" style={{ left: `${pct}%` }} aria-hidden="true">
            <span />
          </div>
          <input
            className="range-native"
            aria-label={label}
            aria-valuetext={displayValue}
            type="range"
            step={resolvedStep}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
        <span className="range-value" aria-hidden="true">
          {displayValue}
        </span>
      </div>
    </div>
  );
}

const searchableSettings = [
  ["Сортировка", "Основное"],
  ["Дистанция атаки", "Основное"],
  ["Дистанция захвата", "Основное"],
  ["Grim Strict Reach", "Основное"],
  ["Raytrace", "Основное"],
  ["Strict Raycast Hit", "Основное"],
  ["Типы целей", "Основное"],
  ["Угол обзора", "Основное"],
  ["Режим ротации", "Ротации"],
  ["Скорость поворота", "Ротации"],
  ["Плавность", "Ротации"],
  ["Точка наведения", "Ротации"],
  ["Коррекция движения", "Ротации"],
  ["Возврат камеры", "Ротации"],
];

function App() {
  const searchRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [modules, setModules] = useState(initialModules);
  const [category, setCategory] = useState("Combat");
  const [selectedId, setSelectedId] = useState("aura");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "favorite">("all");
  const [activeSection, setActiveSection] = useState("Основное");

  // Keybind Studio state
  const [binding, setBinding] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState("");
  const [listeningKey, setListeningKey] = useState(true);
  const [bindMode, setBindMode] = useState<"hold" | "toggle">("toggle");
  const [bindHidden, setBindHidden] = useState(false);
  const [conflict, setConflict] = useState("");

  // Appearance & Glassiness state
  const [activePopover, setActivePopover] = useState<"none" | "glass" | "theme">("none");
  const [themePreset, setThemePreset] = useState("sakura");
  const [accent, setAccent] = useState("#ec4899");
  const [accent2, setAccent2] = useState("#8b5cf6");
  const [surface, setSurface] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#2c1b36");
  const [glassiness, setGlassiness] = useState(72);
  const [blur, setBlur] = useState(24);
  const [sheen, setSheen] = useState(84);
  const [radius, setRadius] = useState(24);
  const [speed, setSpeed] = useState(75);
  const [reduced, setReduced] = useState(false);

  // Aura settings
  const [range, setRange] = useState(3);
  const [fov, setFov] = useState(360);
  const [capture, setCapture] = useState(1.2);
  const [turnSpeed, setTurnSpeed] = useState(90);
  const [smooth, setSmooth] = useState(70);
  const [raytrace, setRaytrace] = useState(true);
  const [strict, setStrict] = useState(true);
  const [camera, setCamera] = useState(false);
  const [point, setPoint] = useState("Голова");
  const [targets, setTargets] = useState(["Players", "Mobs", "Animals", "Invisible", "NPCs", "Naked", "Friends"]);
  const [players, setPlayers] = useState(true);
  const [moveFix, setMoveFix] = useState(true);

  // Extra module settings so non-Aura modules also have realistic interactive controls
  const [moduleIntensity, setModuleIntensity] = useState<Record<string, number>>({
    trigger: 85,
    swap: 40,
    crystal: 4.5,
    anchor: 4.2,
    hitboxes: 0.35,
    criticals: 100,
    gapple: 12,
    mouse: 14,
    sprint: 100,
    fly: 1.8,
    autototem: 10,
    esp: 64,
    fullbright: 100,
    nofriend: 100,
  });
  const [moduleSmart, setModuleSmart] = useState<Record<string, boolean>>({
    trigger: true,
    swap: true,
    crystal: true,
    anchor: false,
    hitboxes: true,
    criticals: true,
    gapple: true,
    mouse: false,
    sprint: true,
    fly: true,
    autototem: true,
    esp: true,
    fullbright: true,
    nofriend: true,
  });
  const [moduleSafe, setModuleSafe] = useState<Record<string, boolean>>({
    trigger: true,
    swap: false,
    crystal: true,
    anchor: true,
    hitboxes: false,
    criticals: false,
    gapple: true,
    mouse: true,
    sprint: false,
    fly: true,
    autototem: true,
    esp: false,
    fullbright: false,
    nofriend: true,
  });

  const selected = modules.find((item) => item.id === selectedId) ?? modules[0];
  const bindingModule = binding ? modules.find((m) => m.id === binding) ?? null : null;
  const activeCount = useMemo(() => modules.filter((m) => m.enabled).length, [modules]);
  const settingResults = query.trim()
    ? searchableSettings.filter(([name]) => name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !binding) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && activePopover !== "none" && !binding) {
        setActivePopover("none");
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [binding, activePopover]);

  const openBindModal = (item: Module) => {
    setActivePopover("none");
    setBinding(item.id);
    setPendingKey(item.bind ?? "");
    setListeningKey(!item.bind);
    setBindMode(item.bindMode ?? "toggle");
    setBindHidden(item.bindHidden ?? false);
    setConflict("");
  };

  const openSetting = (label: string, section: string) => {
    setSelectedId("aura");
    setCategory("Combat");
    setActiveSection(section);
    setQuery("");
    requestAnimationFrame(() => {
      const rows = settingsRef.current?.querySelectorAll<HTMLElement>(".control-row");
      rows?.forEach((row) => {
        if (row.textContent?.includes(label)) {
          const reduceMotion = reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          row.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "instant" : "smooth" });
          row.classList.remove("search-highlight");
          void row.offsetWidth;
          row.classList.add("search-highlight");
        }
      });
    });
  };

  const visible = useMemo(
    () =>
      modules.filter((item) => {
        const matchesText = `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = query ? true : item.category === category;
        const matchesFilter = filter === "all" || (filter === "enabled" ? item.enabled : item.favorite);
        return matchesText && matchesCategory && matchesFilter;
      }),
    [modules, category, query, filter],
  );

  const assignKeyCandidate = (rawKey: string) => {
    if (!binding) return;
    const key = rawKey.length === 1 ? rawKey.toUpperCase() : rawKey.replace("Arrow", "");
    const taken = modules.find((item) => item.id !== binding && item.bind === key);
    if (taken) {
      setConflict(`Клавиша ${key} уже назначена на «${taken.name}»`);
      return;
    }
    setPendingKey(key);
    setListeningKey(false);
    setConflict("");
  };

  useEffect(() => {
    if (!binding) return;
    const bindKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setBinding(null);
        return;
      }
      if (!listeningKey || event.repeat) return;
      if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return;
      event.preventDefault();
      assignKeyCandidate(event.key);
    };
    window.addEventListener("keydown", bindKey);
    return () => window.removeEventListener("keydown", bindKey);
  }, [binding, modules, listeningKey]);

  useEffect(() => {
    const isTyping = (event: KeyboardEvent) =>
      event.target instanceof HTMLElement &&
      (event.target.matches("input, textarea, select") || event.target.isContentEditable);
    const handleKey = (event: KeyboardEvent, pressed: boolean) => {
      if (binding || isTyping(event) || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const key = event.key.length === 1 ? event.key.toUpperCase() : event.key.replace("Arrow", "");
      setModules((items) =>
        items.map((item) => {
          if (item.bind !== key) return item;
          if (item.bindMode === "hold") return { ...item, enabled: pressed };
          return pressed ? { ...item, enabled: !item.enabled } : item;
        }),
      );
    };
    const down = (event: KeyboardEvent) => handleKey(event, true);
    const up = (event: KeyboardEvent) => handleKey(event, false);
    const release = () =>
      setModules((items) => items.map((item) => (item.bindMode === "hold" ? { ...item, enabled: false } : item)));
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
    };
  }, [binding]);

  const update = (id: string, patch: Partial<Module>) =>
    setModules((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const select = (item: Module) => {
    setSelectedId(item.id);
    setActiveSection(item.sections[0]);
  };

  const applyThemePreset = (preset: ThemePreset) => {
    setThemePreset(preset.id);
    setAccent(preset.accent);
    setAccent2(preset.accent2);
    setSurface(preset.surface);
    setTextColor(preset.text);
  };

  const applyGlassPreset = (preset: GlassPreset) => {
    setGlassiness(preset.glassiness);
    setBlur(preset.blur);
    setSheen(preset.sheen);
  };

  // Glassiness controls real crystal translucency without turning opaque
  const windowAlpha = Math.max(0.28, Math.min(0.92, 0.94 - (glassiness / 100) * 0.56));
  const paneAlpha = Math.max(0.22, Math.min(0.84, 0.86 - (glassiness / 100) * 0.52));
  const cardAlpha = Math.max(0.32, Math.min(0.9, 0.88 - (glassiness / 100) * 0.42));
  const sheenAlpha = Math.max(0.25, Math.min(0.95, sheen / 100));

  const renderOtherModuleControls = (mod: Module) => {
    const val = moduleIntensity[mod.id] ?? 75;
    const smart = moduleSmart[mod.id] ?? true;
    const safe = moduleSafe[mod.id] ?? false;
    const sliderConfig: Record<string, { label: string; hint: string; min: number; max: number; step: number; suffix: string }> = {
      trigger: { label: "Задержка удара", hint: "Пауза перед атакой после наведения прицела", min: 0, max: 200, step: 5, suffix: " мс" },
      swap: { label: "Скорость смены", hint: "Время переключения предмета в активный слот", min: 10, max: 150, step: 5, suffix: " мс" },
      crystal: { label: "Дистанция кристаллов", hint: "Максимальный радиус установки и подрыва", min: 2, max: 6, step: 0.1, suffix: " блока" },
      anchor: { label: "Радиус якоря", hint: "Дистанция автоматического заряда якоря", min: 2, max: 6, step: 0.1, suffix: " блока" },
      hitboxes: { label: "Расширение хитбокса", hint: "Дополнительный запас по ширине цели", min: 0.05, max: 1, step: 0.05, suffix: " блока" },
      criticals: { label: "Сила импульса", hint: "Высота микро-прыжка для критического удара", min: 20, max: 100, step: 5, suffix: "%" },
      gapple: { label: "Порог здоровья", hint: "При каком HP автоматически есть яблоко", min: 4, max: 20, step: 1, suffix: " HP" },
      mouse: { label: "Частота кликов", hint: "Количество нажатий в секунду (CPS)", min: 1, max: 20, step: 1, suffix: " CPS" },
      sprint: { label: "Сохранение скорости", hint: "Удержание импульса при поворотах и прыжках", min: 50, max: 100, step: 5, suffix: "%" },
      fly: { label: "Скорость полёта", hint: "Множитель тяги при планировании на элитрах", min: 0.5, max: 3.5, step: 0.1, suffix: "x" },
      autototem: { label: "Минимальное здоровье", hint: "Порог HP для мгновенной экипировки тотема", min: 4, max: 18, step: 1, suffix: " HP" },
      esp: { label: "Дальность подсветки", hint: "На каком расстоянии отображать контуры целей", min: 16, max: 128, step: 4, suffix: " блока" },
      fullbright: { label: "Уровень гаммы", hint: "Яркость освещения в тёмных локациях", min: 20, max: 100, step: 5, suffix: "%" },
      nofriend: { label: "Приоритет защиты", hint: "Степень фильтрации союзников в боевых модулях", min: 50, max: 100, step: 5, suffix: "%" },
    };
    const cfg = sliderConfig[mod.id] ?? { label: "Интенсивность", hint: "Базовая сила срабатывания модуля", min: 0, max: 100, step: 1, suffix: "%" };

    return (
      <>
        <div className="control-row">
          <span className="row-icon tone-rose"><Icon name="sliders" /></span>
          <Slider
            label={cfg.label}
            hint={cfg.hint}
            value={val}
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            suffix={cfg.suffix}
            onChange={(v) => setModuleIntensity((prev) => ({ ...prev, [mod.id]: v }))}
          />
        </div>
        <div className="control-row">
          <span className="row-icon tone-violet"><Icon name="bolt" /></span>
          <div className="row-copy">
            <span className="row-title">Умный режим работы</span>
            <small className="setting-hint">Автоматически подстраивает тайминги под пинг и ситуацию</small>
          </div>
          <Toggle
            value={smart}
            onChange={() => setModuleSmart((prev) => ({ ...prev, [mod.id]: !smart }))}
            label="Умный режим работы"
          />
        </div>
        <div className="control-row">
          <span className="row-icon tone-teal"><Icon name="shield" /></span>
          <div className="row-copy">
            <span className="row-title">Обход античита</span>
            <small className="setting-hint">Смягчает пакеты для стабильной работы на серверах</small>
          </div>
          <Toggle
            value={safe}
            onChange={() => setModuleSafe((prev) => ({ ...prev, [mod.id]: !safe }))}
            label="Обход античита"
          />
        </div>
      </>
    );
  };

  return (
    <main
      className={`desktop theme-${themePreset} ${reduced ? "reduced" : ""}`}
      style={
        {
          "--accent": accent,
          "--accent-2": accent2,
          "--text": textColor,
          "--surface": surface,
          "--window-alpha": windowAlpha,
          "--pane-alpha": paneAlpha,
          "--card-alpha": cardAlpha,
          "--sheen-alpha": sheenAlpha,
          "--blur": `${blur}px`,
          "--radius": `${radius}px`,
          "--speed": `${Math.max(90, 420 - speed * 3)}ms`,
        } as React.CSSProperties
      }
    >
      <div className="aurora aurora-1" aria-hidden="true" />
      <div className="aurora aurora-2" aria-hidden="true" />
      <div className="aurora aurora-3" aria-hidden="true" />
      <div className="glass-ring ring-1" aria-hidden="true" />
      <div className="glass-ring ring-2" aria-hidden="true" />

      <section className="window" aria-label="Sylnora Click GUI">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="brand" />
            </span>
            <div className="brand-copy">
              <div className="brand-line">
                <span className="wordmark">Sylnora</span>
                <span className="version-pill">v2.4</span>
              </div>
              <small>CLICK GUI · GLASS EDITION</small>
            </div>
          </div>

          <div className="search">
            <Icon name="search" />
            <input
              aria-label="Поиск модулей и настроек"
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск функций и параметров…"
            />
            {query && (
              <button type="button" className="search-clear" aria-label="Очистить поиск" onClick={() => setQuery("")}>
                <Icon name="close" />
              </button>
            )}
            <kbd>Ctrl K</kbd>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className={`action-pill ${activePopover === "glass" ? "active" : ""}`}
              onClick={() => setActivePopover((p) => (p === "glass" ? "none" : "glass"))}
              aria-expanded={activePopover === "glass"}
              title="Настройка стеклянности, прозрачности и размытия"
            >
              <Icon name="glass" />
              <span>Стекло</span>
              <em className="pill-badge">{glassiness}%</em>
            </button>
            <button
              type="button"
              className={`action-pill ${activePopover === "theme" ? "active" : ""}`}
              onClick={() => setActivePopover((p) => (p === "theme" ? "none" : "theme"))}
              aria-expanded={activePopover === "theme"}
              title="Цвета, палитры и анимации"
            >
              <Icon name="palette" />
              <span>Палитра</span>
            </button>
          </div>
        </header>

        <div className="layout">
          <aside className="sidebar">
            <nav aria-label="Категории">
              {categories.map((item) => {
                const meta = CATEGORY_META[item];
                const isActive = category === item && !query;
                const enabledInCat = modules.filter((m) => m.category === item && m.enabled).length;
                return (
                  <button
                    type="button"
                    key={item}
                    aria-label={`${item} — ${meta.label}`}
                    title={`${item} (${meta.label})`}
                    aria-pressed={isActive}
                    style={{ "--cat-color": meta.color } as React.CSSProperties}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setCategory(item);
                      setQuery("");
                    }}
                  >
                    <Icon name={item} />
                    {enabledInCat > 0 && <i className="nav-dot" aria-hidden="true" />}
                  </button>
                );
              })}
            </nav>
            <button
              type="button"
              className={`rail-settings ${activePopover !== "none" ? "active" : ""}`}
              title="Быстрая настройка стекла"
              aria-label="Быстрая настройка стекла"
              aria-expanded={activePopover === "glass"}
              onClick={() => setActivePopover((p) => (p === "glass" ? "none" : "glass"))}
            >
              <Icon name="settings" />
            </button>
          </aside>

          <section className="module-pane">
            <div className="pane-head">
              <div className="pane-title">
                <div>
                  <small>{query ? "ПОИСК ПО МОДУЛЯМ" : CATEGORY_META[category]?.label.toUpperCase() ?? "КАТЕГОРИЯ"}</small>
                  <h1>{query ? `«${query}»` : category}</h1>
                </div>
                <span className="module-count" title="Количество функций">
                  {String(visible.length + settingResults.length).padStart(2, "0")}
                </span>
              </div>
              {!query && <p className="category-desc">{CATEGORY_META[category]?.hint}</p>}
              <div className="segmented" role="group" aria-label="Фильтр модулей">
                <button type="button" className={filter === "all" ? "active" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
                  Все
                </button>
                <button type="button" className={filter === "enabled" ? "active" : ""} aria-pressed={filter === "enabled"} onClick={() => setFilter("enabled")}>
                  Вкл
                </button>
                <button
                  type="button"
                  className={filter === "favorite" ? "active" : ""}
                  aria-pressed={filter === "favorite"}
                  aria-label="Избранные модули"
                  title="Избранные модули"
                  onClick={() => setFilter("favorite")}
                >
                  <Icon name="star" />
                </button>
              </div>
            </div>

            <div className="module-list">
              {settingResults.map(([name, section]) => (
                <button type="button" className="setting-result" key={name} onClick={() => openSetting(name, section)}>
                  <span className="result-icon"><Icon name="sliders" /></span>
                  <span>
                    <b>{name}</b>
                    <small>Aura · {section}</small>
                  </span>
                </button>
              ))}

              {visible.map((item) => {
                const catColor = CATEGORY_META[item.category]?.color ?? accent;
                return (
                  <article
                    key={item.id}
                    style={{ "--accent": item.color ?? accent, "--mod-cat": catColor } as React.CSSProperties}
                    className={`module-card ${selected.id === item.id ? "selected" : ""} ${item.enabled ? "is-enabled" : ""}`}
                    onClick={() => select(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openBindModal(item);
                    }}
                  >
                    <div className="module-main">
                      <div className="module-top-row">
                        <div className="module-title">
                          <span className="module-name">{item.name}</span>
                          {item.bind && !item.bindHidden && (
                            <button
                              type="button"
                              className="bind-chip"
                              title={`${item.bindMode === "hold" ? "Hold — удержание" : "Toggle — переключение"} · Нажмите для изменения`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openBindModal(item);
                              }}
                            >
                              {item.bind}
                            </button>
                          )}
                        </div>
                        <div className="module-actions">
                          <button
                            type="button"
                            title={item.favorite ? "Убрать из избранного" : "Добавить в избранное"}
                            aria-label={`Избранное: ${item.name}`}
                            aria-pressed={item.favorite}
                            className={`star ${item.favorite ? "filled" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              update(item.id, { favorite: !item.favorite });
                            }}
                          >
                            <Icon name="star" />
                          </button>
                          <Toggle
                            size="sm"
                            value={item.enabled}
                            onChange={() => update(item.id, { enabled: !item.enabled })}
                            label={`Переключить ${item.name}`}
                          />
                        </div>
                      </div>
                      <div className="module-bottom-row">
                        <p className="module-desc">{item.description}</p>
                        <span className="rmb-tag">ПКМ · бинд</span>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!visible.length && !settingResults.length && (
                <div className="empty">
                  <Icon name="search" />
                  <b>Ничего не найдено</b>
                  <small>Попробуйте изменить запрос или сбросить фильтр</small>
                </div>
              )}
            </div>

            <div className="hint">
              <Icon name="keyboard" />
              <span>ПКМ по любой функции — красивое меню биндов</span>
            </div>
          </section>

          <section className="settings-pane" style={{ "--accent": selected.color ?? accent } as React.CSSProperties}>
            <div className="settings-head">
              <span className="settings-icon" style={{ "--cat-color": CATEGORY_META[selected.category]?.color ?? accent } as React.CSSProperties}>
                <Icon name={selected.category} />
              </span>
              <div className="settings-heading">
                <div className="title-row">
                  <h2>{selected.name}</h2>
                  <span className={`state ${selected.enabled ? "on" : "off"}`}>
                    <i aria-hidden="true" />
                    {selected.enabled ? "ВКЛЮЧЕНО" : "ВЫКЛЮЧЕНО"}
                  </span>
                  <button
                    type="button"
                    className="head-bind-btn"
                    title="Настроить горячую клавишу"
                    onClick={() => openBindModal(selected)}
                  >
                    <Icon name="keyboard" />
                    <span>{selected.bind && !selected.bindHidden ? `Клавиша: ${selected.bind}` : "Назначить бинд"}</span>
                  </button>
                </div>
                <p>{selected.description}</p>
              </div>
              <Toggle
                size="lg"
                value={selected.enabled}
                onChange={() => update(selected.id, { enabled: !selected.enabled })}
                label={`Переключить ${selected.name}`}
              />
            </div>

            <div className="guide-banner">
              <span className="guide-icon"><Icon name="info" /></span>
              <div className="guide-copy">
                <b>О функции {selected.name}</b>
                <p>{selected.guide}</p>
              </div>
            </div>

            {selected.sections.length > 1 && (
              <div className="tabs" role="tablist" aria-label="Разделы настроек">
                {(selected.id === "aura" ? ["Основное", "Ротации"] : selected.sections).map((tab) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeSection === tab}
                    key={tab}
                    className={activeSection === tab ? "active" : ""}
                    onClick={() => setActiveSection(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <div className="settings-scroll" ref={settingsRef} key={`${selectedId}-${activeSection}`}>
              {selected.id === "aura" ? (
                activeSection === "Ротации" ? (
                  <>
                    <div className="control-row">
                      <span className="row-icon tone-violet"><Icon name="rotation" /></span>
                      <div className="row-copy">
                        <span className="row-title">Режим ротации</span>
                        <small className="setting-hint">Алгоритм поворота камеры при наведении на цель</small>
                      </div>
                      <select aria-label="Режим ротации" defaultValue="Плавная">
                        <option>Плавная</option>
                        <option>Мгновенная</option>
                        <option>Умная</option>
                      </select>
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-rose"><Icon name="rotation" /></span>
                      <Slider
                        label="Скорость поворота"
                        hint="Максимальный градус доводки камеры за секунду"
                        value={turnSpeed}
                        max={180}
                        suffix="°/с"
                        onChange={setTurnSpeed}
                      />
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-violet"><Icon name="sliders" /></span>
                      <Slider
                        label="Плавность"
                        hint="Сглаживание рывков для естественного движения мыши"
                        value={smooth}
                        onChange={setSmooth}
                      />
                    </div>
                    <div className="control-row row-wrap">
                      <span className="row-icon tone-rose"><Icon name="Combat" /></span>
                      <div className="row-copy">
                        <span className="row-title">Точка наведения</span>
                        <small className="setting-hint">Часть хитбокса, на которую фокусируется прицел</small>
                      </div>
                      <div className="point-options">
                        {["Голова", "Корпус", "Ближайшая"].map((p) => (
                          <button
                            type="button"
                            key={p}
                            className={point === p ? "choice active" : "choice"}
                            aria-pressed={point === p}
                            onClick={() => setPoint(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-teal"><Icon name="Movement" /></span>
                      <div className="row-copy">
                        <span className="row-title">Коррекция движения</span>
                        <small className="setting-hint">Синхронизирует вектор бега с направлением ротации</small>
                      </div>
                      <Toggle value={moveFix} onChange={() => setMoveFix((v) => !v)} label="Коррекция движения" />
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-indigo"><Icon name="camera" /></span>
                      <div className="row-copy">
                        <span className="row-title">Возврат камеры</span>
                        <small className="setting-hint">Плавно возвращает взгляд игрока после потери цели</small>
                      </div>
                      <Toggle value={camera} onChange={() => setCamera((v) => !v)} label="Возврат камеры" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="control-row">
                      <span className="row-icon tone-violet"><Icon name="sort" /></span>
                      <div className="row-copy">
                        <span className="row-title">Сортировка целей</span>
                        <small className="setting-hint">Приоритет выбора цели, если рядом несколько противников</small>
                      </div>
                      <select aria-label="Сортировка" defaultValue="Smart">
                        <option>Smart</option>
                        <option>Дистанция</option>
                        <option>Здоровье</option>
                      </select>
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-rose"><Icon name="distance" /></span>
                      <Slider
                        label="Дистанция атаки"
                        hint="Максимальное расстояние, с которого проходит удар"
                        value={range}
                        min={1}
                        max={6}
                        suffix=" блока"
                        onChange={setRange}
                      />
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-violet"><Icon name="Combat" /></span>
                      <Slider
                        label="Дистанция захвата"
                        hint="Запас дистанции для раннего наведения до удара"
                        value={capture}
                        max={4}
                        suffix=" блока"
                        onChange={setCapture}
                      />
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-teal"><Icon name="shield" /></span>
                      <div className="row-copy">
                        <span className="row-title">Grim Strict Reach</span>
                        <small className="setting-hint">Точный расчёт дистанции под античит Grim</small>
                      </div>
                      <Toggle value={players} onChange={() => setPlayers((v) => !v)} label="Grim Strict Reach" />
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-indigo"><Icon name="Render" /></span>
                      <div className="row-copy">
                        <span className="row-title">Raytrace</span>
                        <small className="setting-hint">Проверяет прямую видимость цели без ударов сквозь стены</small>
                      </div>
                      <Toggle value={raytrace} onChange={() => setRaytrace((v) => !v)} label="Raytrace" />
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-teal"><Icon name="shield" /></span>
                      <div className="row-copy">
                        <span className="row-title">Strict Raycast Hit</span>
                        <small className="setting-hint">Наносит удар только при точном пересечении луча с хитбоксом</small>
                      </div>
                      <Toggle value={strict} onChange={() => setStrict((v) => !v)} label="Strict Raycast Hit" />
                    </div>
                    <div className="control-row target-row">
                      <span className="row-icon tone-rose"><Icon name="users" /></span>
                      <div className="row-copy">
                        <span className="row-title">Типы целей</span>
                        <small className="setting-hint">Выберите категории сущностей, по которым работает Aura</small>
                      </div>
                      <span className="count-pill">{targets.length} / 7</span>
                      <div className="target-options">
                        {["Players", "Mobs", "Animals", "Invisible", "NPCs", "Naked", "Friends"].map((target) => {
                          const isOn = targets.includes(target);
                          return (
                            <button
                              type="button"
                              className={isOn ? "choice active" : "choice"}
                              aria-pressed={isOn}
                              key={target}
                              onClick={() =>
                                setTargets((items) =>
                                  items.includes(target) ? items.filter((t) => t !== target) : [...items, target],
                                )
                              }
                            >
                              <i className="choice-dot" aria-hidden="true" />
                              {target}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="control-row">
                      <span className="row-icon tone-indigo"><Icon name="Render" /></span>
                      <Slider
                        label="Угол обзора"
                        hint="Сектор обзора вокруг прицела для поиска противников"
                        value={fov}
                        min={30}
                        max={360}
                        suffix="°"
                        onChange={setFov}
                      />
                    </div>
                  </>
                )
              ) : (
                renderOtherModuleControls(selected)
              )}
            </div>
          </section>
        </div>

        <footer className="window-footer">
          <span className="footer-credit">
            <Icon name="brand" />
            <b>Sylnora</b>
            <i>·</i>
            <span>mitaArk</span>
          </span>
          <div className="footer-meta">
            <span className="footer-chip">Активно модулей: {activeCount}</span>
            <span className="footer-status">Стекло {glassiness}% · Изменения применяются сразу</span>
          </div>
        </footer>

        {activePopover === "glass" && (
          <aside className="popover-panel glass-panel" aria-label="Настройка стеклянности">
            <div className="theme-head">
              <div>
                <small>ЭФФЕКТ СТЕКЛА</small>
                <h3>Стеклянность GUI</h3>
              </div>
              <button type="button" className="close-btn" aria-label="Закрыть настройку стекла" onClick={() => setActivePopover("none")}>
                <Icon name="close" />
              </button>
            </div>
            <p className="panel-lead">Настройте прозрачность, глубину размытия и блики стеклянных граней в реальном времени.</p>
            <div className="preset-grid">
              {GLASS_PRESETS.map((preset) => {
                const isCurrent = glassiness === preset.glassiness && blur === preset.blur;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    className={`glass-preset-btn ${isCurrent ? "active" : ""}`}
                    onClick={() => applyGlassPreset(preset)}
                  >
                    <b>{preset.label}</b>
                    <small>{preset.desc}</small>
                  </button>
                );
              })}
            </div>
            <div className="panel-sliders">
              <Slider compact label="Стеклянность" hint="Прозрачность всех панелей" value={glassiness} min={0} max={100} onChange={setGlassiness} />
              <Slider compact label="Размытие фона" hint="Сила матового эффекта" value={blur} min={4} max={40} suffix=" px" onChange={setBlur} />
              <Slider compact label="Блик граней" hint="Яркость стеклянных рамок" value={sheen} min={20} max={100} onChange={setSheen} />
              <Slider compact label="Скругление углов" value={radius} min={10} max={30} suffix=" px" onChange={setRadius} />
            </div>
          </aside>
        )}

        {activePopover === "theme" && (
          <aside className="popover-panel theme-panel" aria-label="Оформление и палитры">
            <div className="theme-head">
              <div>
                <small>ПЕРСОНАЛИЗАЦИЯ</small>
                <h3>Палитра и стиль</h3>
              </div>
              <button type="button" className="close-btn" aria-label="Закрыть оформление" onClick={() => setActivePopover("none")}>
                <Icon name="close" />
              </button>
            </div>

            <div className="theme-presets">
              {THEME_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`theme-swatch ${themePreset === preset.id ? "active" : ""}`}
                  onClick={() => applyThemePreset(preset)}
                >
                  <span className="swatch-dots">
                    <i style={{ background: preset.accent }} />
                    <i style={{ background: preset.accent2 }} />
                  </span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="color-group">
              <label className="color-line">
                <span><b>Основной акцент</b><small>Кнопки, бегунки и подсветка</small></span>
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
                <code>{accent.toUpperCase()}</code>
              </label>
              <label className="color-line">
                <span><b>Второй акцент</b><small>Градиенты и свечение</small></span>
                <input type="color" value={accent2} onChange={(e) => setAccent2(e.target.value)} />
                <code>{accent2.toUpperCase()}</code>
              </label>
              <label className="color-line">
                <span><b>Оттенок стекла</b><small>База светлых поверхностей</small></span>
                <input type="color" value={surface} onChange={(e) => setSurface(e.target.value)} />
                <code>{surface.toUpperCase()}</code>
              </label>
              <label className="color-line">
                <span><b>Цвет текста</b><small>Заголовки и описания</small></span>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                <code>{textColor.toUpperCase()}</code>
              </label>
              <label className="color-line">
                <span><b>Акцент {selected.name}</b><small>Собственный цвет модуля</small></span>
                <input type="color" value={selected.color ?? accent} onChange={(e) => update(selected.id, { color: e.target.value })} />
                <button type="button" className="color-reset" title="Использовать общую тему" onClick={() => update(selected.id, { color: undefined })}>
                  Сброс
                </button>
              </label>
            </div>

            <div className="panel-sliders">
              <Slider compact label="Скорость анимаций" value={speed} onChange={setSpeed} />
              <div className="setting-row-inline">
                <div>
                  <span>Меньше движения</span>
                  <small>Отключить плавные переходы</small>
                </div>
                <Toggle size="sm" value={reduced} onChange={() => setReduced((v) => !v)} label="Уменьшенное движение" />
              </div>
            </div>
          </aside>
        )}

        {binding && bindingModule && (
          <div className="modal-backdrop" onMouseDown={() => setBinding(null)}>
            <div
              className="bind-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Назначение клавиши для ${bindingModule.name}`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="bind-head">
                <span className="bind-head-icon">
                  <Icon name="keyboard" />
                </span>
                <div className="bind-head-copy">
                  <small>НАЗНАЧЕНИЕ КЛАВИШИ</small>
                  <h3>{bindingModule.name}</h3>
                  <p>{bindingModule.description}</p>
                </div>
                <button type="button" className="close-btn" aria-label="Закрыть окно бинда" onClick={() => setBinding(null)}>
                  <Icon name="close" />
                </button>
              </div>

              <div className={`keycap-stage ${listeningKey ? "is-listening" : ""}`}>
                {listeningKey ? (
                  <>
                    <div className="pulse-keycap">
                      <span className="pulse-ring" aria-hidden="true" />
                      <Icon name="keyboard" />
                    </div>
                    <div className="stage-copy">
                      <b>Нажмите любую клавишу…</b>
                      <small>Или выберите быструю клавишу ниже</small>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="keycap-3d"
                      title="Нажмите, чтобы выбрать другую клавишу"
                      onClick={() => {
                        setListeningKey(true);
                        setConflict("");
                      }}
                    >
                      <span>{pendingKey}</span>
                    </button>
                    <div className="stage-copy">
                      <b>Клавиша выбрана</b>
                      <small>Кликните по клавише, чтобы переназначить</small>
                    </div>
                  </>
                )}

                <div className="quick-keys" aria-label="Быстрый выбор клавиши">
                  {QUICK_KEYS.map((k) => (
                    <button
                      type="button"
                      key={k}
                      className={`quick-key ${pendingKey === k && !listeningKey ? "active" : ""}`}
                      onClick={() => assignKeyCandidate(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {conflict && <div className="conflict">{conflict}</div>}

              <div className="bind-section">
                <span className="bind-label">Режим активации</span>
                <div className="bind-modes">
                  <button
                    type="button"
                    className={`mode-card ${bindMode === "toggle" ? "active" : ""}`}
                    aria-pressed={bindMode === "toggle"}
                    onClick={() => setBindMode("toggle")}
                  >
                    <span className="mode-icon"><Icon name="toggle" /></span>
                    <b>Toggle</b>
                    <small>Нажатие включает и выключает</small>
                  </button>
                  <button
                    type="button"
                    className={`mode-card ${bindMode === "hold" ? "active" : ""}`}
                    aria-pressed={bindMode === "hold"}
                    onClick={() => setBindMode("hold")}
                  >
                    <span className="mode-icon"><Icon name="hold" /></span>
                    <b>Hold</b>
                    <small>Активен, пока клавиша зажата</small>
                  </button>
                </div>
              </div>

              <div className="bind-hide-row">
                <div>
                  <b>Скрыть индикатор бинда</b>
                  <small>Не показывать значок клавиши рядом с названием</small>
                </div>
                <Toggle size="sm" value={bindHidden} onChange={() => setBindHidden((v) => !v)} label="Скрыть отображение бинда" />
              </div>

              <div className="bind-footer">
                {bindingModule.bind && (
                  <button
                    type="button"
                    className="bind-remove"
                    onClick={() => {
                      update(binding, { bind: undefined, bindHidden: false });
                      setBinding(null);
                    }}
                  >
                    <Icon name="trash" />
                    <span>Убрать</span>
                  </button>
                )}
                <button type="button" className="bind-cancel" onClick={() => setBinding(null)}>
                  Отмена <kbd>Esc</kbd>
                </button>
                <button
                  type="button"
                  className="bind-save"
                  disabled={!pendingKey}
                  onClick={() => {
                    if (!pendingKey) return;
                    update(binding, { bind: pendingKey, bindMode, bindHidden });
                    setBinding(null);
                  }}
                >
                  Сохранить бинд
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
