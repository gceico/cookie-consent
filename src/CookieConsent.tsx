import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Switch } from "./ui/Switch";
import { Button } from "./ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs";
import { resolveConfig, deniedPrefs, grantedPrefs, defaultPrefs } from "./config";
import { detectGPC, getOrCreateToken, readConsentRecord, writeConsentCookie } from "./cookie";
import { applyConsent } from "./consent-mode";
import { deleteCookiebotCookies, parseCookiebot } from "./cookiebot-migrate";
import type {
  ConsentMethod,
  ConsentPrefs,
  ConsentRecord,
  CookieConsentConfig,
  ResolvedCookieConsentConfig,
} from "./types";

export interface CookieConsentProps {
  config?: CookieConsentConfig;
}

function buildRecord(
  prefs: ConsentPrefs,
  method: ConsentMethod,
  consentVersion: number,
): ConsentRecord {
  return {
    version: consentVersion,
    stamp: new Date().toISOString(),
    method,
    gpc: detectGPC(),
    prefs,
  };
}

/** Renders copy containing `{policyLink}` / `{privacyLink}` placeholders as
 * real anchors, everything else as plain text. Keeps `config.text` as plain
 * strings (easy to localize/override) while still letting the two policy
 * links land inline. */
function renderWithLinks(text: string, resolved: ResolvedCookieConsentConfig): ReactNode {
  const parts = text.split(/(\{policyLink\}|\{privacyLink\})/g);
  return parts.map((part, i) => {
    if (part === "{policyLink}") {
      return (
        <a key={i} href={resolved.text.policyHref} className="ccb-link">
          {resolved.text.policyLabel}
        </a>
      );
    }
    if (part === "{privacyLink}") {
      return (
        <a key={i} href={resolved.text.privacyHref} className="ccb-link">
          {resolved.text.privacyLabel}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** The generalized cookie consent banner. Fully config-driven — see
 * `CookieConsentConfig` in `types.ts` for every option and `config.ts` for
 * the defaults. Import `@gceico/cookie-consent/styles.css` alongside it. */
export function CookieConsent({ config }: CookieConsentProps) {
  const resolved = useMemo(() => resolveConfig(config), [config]);
  const { categories, text, cookieName, tokenStorageKey, consentVersion, bannerVersion } = resolved;

  const [visible, setVisible] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPrefs>(() => defaultPrefs(categories));
  const [settled, setSettled] = useState(false);
  const [gpcActive] = useState(detectGPC);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const persist = useCallback(
    (nextPrefs: ConsentPrefs, method: ConsentMethod) => {
      const record = buildRecord(nextPrefs, method, consentVersion);
      writeConsentCookie(cookieName, record);
      applyConsent(nextPrefs, resolved.consentMode);
      const token = getOrCreateToken(tokenStorageKey);
      void resolved.storage.log({
        token,
        version: record.version,
        method: record.method,
        gpc: record.gpc,
        prefs: record.prefs,
        bannerVersion,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        url: typeof location !== "undefined" ? location.href : "",
      });
      setPrefs(nextPrefs);
      setSettled(true);
      setVisible(false);
    },
    [
      cookieName,
      consentVersion,
      bannerVersion,
      tokenStorageKey,
      resolved.consentMode,
      resolved.storage,
    ],
  );

  const open = useCallback(() => {
    const existing = readConsentRecord(cookieName, consentVersion);
    if (existing) setPrefs(existing.prefs);
    setVisible(true);
  }, [cookieName, consentVersion]);

  // Initial mount: migrate a legacy Cookiebot cookie (if opted in), else pick
  // up an existing decision, else arm the display trigger for new visitors.
  useEffect(() => {
    if (resolved.migrateFromCookiebot) {
      const migrated = parseCookiebot(categories);
      if (migrated) {
        deleteCookiebotCookies();
        if (!readConsentRecord(cookieName, consentVersion)) {
          persist(migrated, "migrated");
          return;
        }
      }
    }

    const existing = readConsentRecord(cookieName, consentVersion);
    if (existing) {
      applyConsent(existing.prefs, resolved.consentMode);
      setPrefs(existing.prefs);
      setSettled(true);
      return;
    }

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setVisible(true);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
    const onScroll = () => {
      if (window.scrollY >= resolved.trigger.scrollThresholdPx) show();
    };
    const t = window.setTimeout(show, resolved.trigger.timeoutMs);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      done = true;
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reopen hooks: global function, custom event, and delegated clicks on
  // `a[href="#consent"]` / `[data-open-consent]`.
  useEffect(() => {
    const globals = window as unknown as Record<string, unknown>;
    globals[resolved.globalOpenFnName] = open;
    const handler = () => open();
    window.addEventListener(resolved.openEventName, handler);
    const linkHandler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.(
        'a[href="#consent"], [data-open-consent]',
      ) as HTMLElement | null;
      if (anchor) {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener("click", linkHandler);
    return () => {
      window.removeEventListener(resolved.openEventName, handler);
      document.removeEventListener("click", linkHandler);
      if (globals[resolved.globalOpenFnName] === open) delete globals[resolved.globalOpenFnName];
    };
  }, [open, resolved.globalOpenFnName, resolved.openEventName]);

  function toggle(id: string) {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <>
      {visible && (
        <div
          className="ccb-overlay"
          role="dialog"
          aria-labelledby="ccb-title"
          aria-describedby="ccb-desc"
          ref={dialogRef}
        >
          <div className="ccb-modal">
            <Tabs defaultValue="consent" className="ccb-modal__body">
              <TabsList className="ccb-tabs__list--modal">
                <TabsTrigger value="consent">{text.tabConsent}</TabsTrigger>
                <TabsTrigger value="details">{text.tabDetails}</TabsTrigger>
                <TabsTrigger value="about">{text.tabAbout}</TabsTrigger>
              </TabsList>

              <TabsContent value="consent" className="ccb-panel">
                <p id="ccb-title" className="ccb-panel__title">
                  {text.title}
                </p>
                <p id="ccb-desc" className="ccb-panel__desc">
                  {renderWithLinks(text.description, resolved)}
                </p>
                {gpcActive && (
                  <div className="ccb-gpc-notice">
                    <span className="ccb-gpc-notice__badge" aria-hidden="true">
                      ✓
                    </span>
                    {text.gpcNotice}
                  </div>
                )}
                <div className="ccb-category-grid">
                  {categories.map((item) => (
                    <div key={item.id} className="ccb-category-grid__cell">
                      <span className="ccb-category-grid__label">{item.label}</span>
                      <Switch
                        checked={item.alwaysOn || prefs[item.id]}
                        disabled={item.alwaysOn}
                        onCheckedChange={item.alwaysOn ? undefined : () => toggle(item.id)}
                        aria-label={`${item.label} cookies${item.alwaysOn ? " (always on)" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="ccb-panel">
                <div className="ccb-details-list">
                  {categories.map((item) => (
                    <div key={item.id} className="ccb-details-list__row">
                      <div className="ccb-details-list__head">
                        <span className="ccb-details-list__label">{item.label}</span>
                        <Switch
                          checked={item.alwaysOn || prefs[item.id]}
                          disabled={item.alwaysOn}
                          onCheckedChange={item.alwaysOn ? undefined : () => toggle(item.id)}
                          aria-label={`${item.label} cookies${item.alwaysOn ? " (always on)" : ""}`}
                        />
                      </div>
                      <p className="ccb-details-list__desc">{item.description}</p>
                    </div>
                  ))}
                </div>
                <p className="ccb-panel__footer">{renderWithLinks(text.detailsFooter, resolved)}</p>
              </TabsContent>

              <TabsContent value="about" className="ccb-panel">
                <div className="ccb-about">
                  {text.aboutParagraphs.map((p, i) => (
                    <p key={i}>{renderWithLinks(p, resolved)}</p>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="ccb-actions">
              <Button
                variant="ghost"
                className="ccb-actions__button"
                onClick={() => persist(deniedPrefs(categories), "explicit")}
              >
                {text.denyAll}
              </Button>
              <Button
                variant="ghost"
                className="ccb-actions__button"
                onClick={() => persist(prefs, "explicit")}
              >
                {text.allowSelection}
              </Button>
              <Button
                variant="ghost"
                className="ccb-actions__button"
                onClick={() => persist(grantedPrefs(categories), "explicit")}
              >
                {text.allowAll}
              </Button>
            </div>
          </div>
        </div>
      )}

      {settled && !visible && (
        <button
          type="button"
          onClick={open}
          aria-label={text.reopenAriaLabel}
          className="ccb-reopen"
        >
          <span aria-hidden="true" className="ccb-reopen__icon">
            🍪
          </span>
        </button>
      )}
    </>
  );
}

export default CookieConsent;
