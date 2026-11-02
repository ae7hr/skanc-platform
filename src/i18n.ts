import translations from "./translations.json" with { type: "json" };
export type Language = "en" | "ru" | "uz";
let language: Language = "en";
const dictionary: Record<string, string[]> = translations;
export function getLanguage(): Language {
  try {
    const v = localStorage.getItem("folio-language");
    return v === "ru" || v === "uz" ? v : "en";
  } catch {
    return "en";
  }
}
export function setLanguage(value: Language) {
  language = value;
  if (typeof document !== "undefined") {
    document.documentElement.lang = value;
    document.title =
      value === "ru"
        ? "SKANC · Команда и работа"
        : value === "uz"
          ? "SKANC · Jamoa va ish"
          : "SKANC · People & work";
  }
  try {
    localStorage.setItem("folio-language", value);
  } catch {
    /* Language selection still works without persistence. */
  }
}
export function locale() {
  return { en: "en-US", ru: "ru-RU", uz: "uz-UZ" }[language];
}
export function t(value: string): string {
  if (language === "en") return value;
  const key = value.trim();
  const translated = dictionary[key]?.[language === "ru" ? 0 : 1];
  if (translated !== undefined)
    return (
      value.slice(0, value.indexOf(key)) +
      translated +
      value.slice(value.indexOf(key) + key.length)
    );
  const count = key.match(/^(\d+) (active in your view|at offer stage)$/);
  if (count)
    return (
      count[1] +
      " " +
      (language === "ru"
        ? count[2] === "active in your view"
          ? "активных в вашем представлении"
          : "на этапе предложения"
        : count[2] === "active in your view"
          ? "faol yozuv"
          : "taklif bosqichida")
    );
  const composed = key.match(
    /^(Add|Edit|View|Save|Open|Search|Demo preview:) (.+?)( saved|s…)?$/,
  );
  if (composed) {
    const [, verb, subject, suffix] = composed;
    const prefix =
      verb === "Search"
        ? language === "ru"
          ? "Поиск:"
          : "Qidirish:"
        : verb === "Demo preview:"
          ? language === "ru"
            ? "Демороль:"
            : "Namuna roli:"
          : t(verb);
    return `${prefix} ${t(subject)}${suffix === " saved" ? (language === "ru" ? " — сохранено" : " — saqlandi") : suffix === "s…" ? "…" : ""}`;
  }
  if (key.endsWith(" saved"))
    return language === "ru" ? "Запись сохранена" : "Yozuv saqlandi";
  return value;
}
export function localize<T>(value: T): T {
  if (typeof value === "string") return t(value) as T;
  if (Array.isArray(value)) return value.map(localize) as T;
  return value;
}
