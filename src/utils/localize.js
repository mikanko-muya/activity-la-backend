// Translated fields come in pairs: `title` (Lao) and `titleEn` (English). For
// one language, each pair folds into its usual name - `title` holds that
// language's text and `titleEn` is left out - at any depth, so an order's
// event or an event's venue is folded too. Anything that is not a plain object
// or array (dates, Decimals) passes through untouched.

export const LANGUAGES = ["lo", "en"];

const isPlainObject = (value) => {
    if (value === null || typeof value !== "object") return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
};

export const localize = (value, lang) => {
    if (!lang) return value;
    if (Array.isArray(value)) return value.map((item) => localize(item, lang));
    if (!isPlainObject(value)) return value;

    const result = {};
    for (const [key, field] of Object.entries(value)) {
        const isTwin = key.endsWith("En") && key.slice(0, -2) in value;
        if (isTwin) continue;

        const twin = `${key}En`;
        // An optional English text that was never written falls back to Lao
        // rather than showing nothing.
        const chosen = lang === "en" && twin in value ? value[twin] ?? field : field;
        result[key] = localize(chosen, lang);
    }
    return result;
};
