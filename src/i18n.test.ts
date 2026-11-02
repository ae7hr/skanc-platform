import { test } from "node:test";
import assert from "node:assert/strict";
import { t, localize, setLanguage, getLanguage, locale } from "./i18n.ts";
test("Russian and Uzbek translate interface labels and preserve machine values", () => {
  setLanguage("ru");
  assert.equal(t("Recruitment"), "Подбор персонала");
  assert.equal(t("Applied"), "Новая заявка");
  assert.equal(t("Add candidate"), "Добавить кандидата");
  assert.equal(locale(), "ru-RU");
  setLanguage("uz");
  assert.equal(t("Recruitment"), "Ishga qabul qilish");
  assert.equal(t("Applied"), "Ariza topshirilgan");
  assert.equal(locale(), "uz-UZ");
  assert.equal(t("Alex Morgan"), "Alex Morgan");
  assert.equal(localize(25), 25);
  setLanguage("en");
  assert.equal(t("Applied"), "Applied");
});
test("language choice persists and unsupported stored choices fall back to English", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => values.get(k),
      setItem: (k: string, v: string) => values.set(k, v),
    },
  });
  setLanguage("uz");
  assert.equal(getLanguage(), "uz");
  values.set("folio-language", "invalid");
  assert.equal(getLanguage(), "en");
  setLanguage("en");
  delete (globalThis as { localStorage?: unknown }).localStorage;
});
