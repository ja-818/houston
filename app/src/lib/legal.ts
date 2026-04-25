/**
 * Security disclaimer — version constant.
 *
 * The copy itself lives in `app/src/locales/<lang>/legal.json` and is
 * pulled through `useTranslation("legal")` in the gate component.
 * Bump this number whenever the text changes in a way that requires
 * every user to re-accept — the gate re-prompts when the persisted
 * `legal_acceptance.version` is lower than this constant.
 */
export const CURRENT_DISCLAIMER_VERSION = 2;
