"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { trackCardEventAction } from "@/app/actions/track";
import { FixedSiteHeader } from "@/components/public/fixed-site-header";
import { BOOKING_URL } from "@/lib/constants";
import {
  buildWhatsAppMessageIntro,
  getDaysUntilExpiry,
  sanitizeWhatsappNumber,
} from "@/lib/format";
import type { CardRecord, CartItem, SettingsRecord } from "@/lib/types";

// ─── Rastreamento de eventos ──────────────────────────────────────────────────

const SESSION_ID_KEY = "mona-session-id";
const TRACKED_KEY    = "mona-tracked-events";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

function alreadyTracked(cardId: string, eventType: string): boolean {
  try {
    const list: string[] = JSON.parse(sessionStorage.getItem(TRACKED_KEY) ?? "[]");
    return list.includes(`${cardId}:${eventType}`);
  } catch { return false; }
}

function markTracked(cardId: string, eventType: string): void {
  try {
    const list: string[] = JSON.parse(sessionStorage.getItem(TRACKED_KEY) ?? "[]");
    list.push(`${cardId}:${eventType}`);
    sessionStorage.setItem(TRACKED_KEY, JSON.stringify(list));
  } catch { /* silencia */ }
}

function fireEvent(cardId: string, eventType: "click" | "add_to_cart" | "whatsapp") {
  if (typeof window === "undefined") return;
  if (alreadyTracked(cardId, eventType)) return;
  markTracked(cardId, eventType);

  const params = new URLSearchParams(window.location.search);
  void trackCardEventAction({
    cardId,
    eventType,
    sessionId:   getSessionId(),
    userAgent:   navigator.userAgent,
    referrer:    document.referrer,
    utmSource:   params.get("utm_source"),
    utmMedium:   params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    screen:      `${screen.width}x${screen.height}`,
    language:    navigator.language,
  });
}

// ─── Carrinho local ───────────────────────────────────────────────────────────

const CART_STORAGE_KEY = "mona-event-sys-cart";
const CART_EVENT_NAME = "mona-event-sys-cart-change";
const EMPTY_CART: CartItem[] = [];

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.card_id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.quantity === "number" &&
    typeof obj.unit_label === "string"
  );
}

let cachedCartRaw = "";
let cachedCartSnapshot: CartItem[] = EMPTY_CART;

function loadCartFromStorage() {
  if (typeof window === "undefined") return EMPTY_CART;

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      cachedCartRaw = "";
      cachedCartSnapshot = EMPTY_CART;
      return EMPTY_CART;
    }

    if (raw === cachedCartRaw) return cachedCartSnapshot;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedCartRaw = "";
      cachedCartSnapshot = EMPTY_CART;
      return EMPTY_CART;
    }

    const valid = parsed.filter(isValidCartItem);
    cachedCartRaw = raw;
    cachedCartSnapshot = valid;
    return cachedCartSnapshot;
  } catch {
    cachedCartRaw = "";
    cachedCartSnapshot = EMPTY_CART;
    return EMPTY_CART;
  }
}

function subscribeToCartStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(CART_EVENT_NAME, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CART_EVENT_NAME, handler);
  };
}

function writeCartToStorage(nextCart: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
  window.dispatchEvent(new Event(CART_EVENT_NAME));
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

function getDefaultQuantity(card: CardRecord) {
  return Math.max(card.min_quantity, 1);
}

function clampQuantity(card: CardRecord, value: number) {
  if (!Number.isFinite(value)) return getDefaultQuantity(card);
  return Math.min(card.max_quantity, Math.max(card.min_quantity, value));
}

function buildQuantityOptions(card: CardRecord) {
  const options: number[] = [];
  for (
    let v = card.min_quantity;
    v <= card.max_quantity;
    v += card.quantity_step
  ) {
    options.push(v);
  }
  if (!options.includes(card.max_quantity)) options.push(card.max_quantity);
  return options;
}

function buildWhatsAppUrl(settings: SettingsRecord, cart: CartItem[]) {
  const message = [
    buildWhatsAppMessageIntro(settings.whatsapp_message_intro),
    "",
    ...cart.map(
      (item) =>
        `- ${item.title} — Quantidade: ${item.quantity} ${item.unit_label}`,
    ),
    "",
    "Gostaria de verificar disponibilidade e condições de reserva.",
  ].join("\n");

  const phone = sanitizeWhatsappNumber(settings.business_whatsapp_number);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ─── Hero slideshow ───────────────────────────────────────────────────────────

const HERO_IMAGES = [
  "https://www.monahotel.com.br/site/hotelmona/img/home_2.png",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/1.jpg",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/3.jpg",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/4.jpg",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/5.jpg",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/6.png",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/7.png",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/10.png",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/11.png",
  "https://www.monahotel.com.br/site/hotelmona/img/gallery/12.png",
];

// ─── Componente principal ─────────────────────────────────────────────────────

type CatalogShellProps = {
  cards: CardRecord[];
  settings: SettingsRecord;
};

export function CatalogShell({ cards, settings }: CatalogShellProps) {
  const storedCart = useSyncExternalStore(
    subscribeToCartStore,
    loadCartFromStorage,
    () => EMPTY_CART,
  );
  const cart = storedCart;

  const [heroIndex, setHeroIndex] = useState(0);

  const [activeCard, setActiveCard] = useState<CardRecord | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Avançar slide do hero automaticamente
  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Fechar modal com ESC
  useEffect(() => {
    if (!activeCard) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveCard(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeCard]);

  // Limpar timer do toast ao desmontar
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const whatsappUrl = useMemo(
    () => buildWhatsAppUrl(settings, cart),
    [cart, settings],
  );

  function showToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }

  function openCard(card: CardRecord) {
    fireEvent(card.id, "click");
    setActiveCard(card);
    setSelectedQuantity(getDefaultQuantity(card));
  }

  function addToCart(card: CardRecord, quantity: number) {
    fireEvent(card.id, "add_to_cart");
    const safeQuantity = clampQuantity(card, quantity);
    const existingItem = cart.find((item) => item.card_id === card.id);

    const nextCart = existingItem
      ? cart.map((item) =>
          item.card_id === card.id
            ? {
                ...item,
                quantity: clampQuantity(card, item.quantity + safeQuantity),
              }
            : item,
        )
      : [
          ...cart,
          {
            card_id: card.id,
            title: card.title,
            quantity: safeQuantity,
            unit_label: card.unit_label,
            price_text: card.price_text,
            image_url: card.image_url,
          },
        ];

    writeCartToStorage(nextCart);
    showToast(`"${card.title}" adicionado ao carrinho`);
    setActiveCard(null);
  }

  function updateCartItemQuantity(cardId: string, nextQuantity: number) {
    const relatedCard = cards.find((card) => card.id === cardId);
    if (!relatedCard) return;

    writeCartToStorage(
      cart.map((item) =>
        item.card_id === cardId
          ? { ...item, quantity: clampQuantity(relatedCard, nextQuantity) }
          : item,
      ),
    );
  }

  function removeCartItem(cardId: string) {
    writeCartToStorage(cart.filter((item) => item.card_id !== cardId));
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[linear-gradient(180deg,_#c29d77_0%,_#f4ede5_18%,_#efe5db_100%)] text-[var(--color-ink)]">
      <FixedSiteHeader />

      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-10 pt-32 sm:px-6 md:pt-36 lg:px-0">
          <div className="mx-auto max-w-7xl">
            <div className="relative h-[420px] overflow-hidden rounded-[2.25rem] border border-white/25 shadow-[0_30px_80px_rgba(34,24,17,0.22)] sm:h-[480px] md:h-[560px]">
              {/* Camada 1 — slides com crossfade + Ken Burns */}
              {HERO_IMAGES.map((src, i) => (
                <div
                  key={src}
                  className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                  style={{
                    backgroundImage: `url(${src})`,
                    opacity: i === heroIndex ? 1 : 0,
                  }}
                >
                  {i === heroIndex && (
                    <div className="animate-ken-burns absolute inset-0 bg-cover bg-center bg-inherit" />
                  )}
                </div>
              ))}

              {/* Camada 2 — gradiente para legibilidade do texto */}
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(22,13,7,0.85)_0%,rgba(22,13,7,0.35)_45%,rgba(22,13,7,0.08)_100%)]" />

              {/* Camada 3 — brilhos decorativos */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.09),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(220,183,145,0.14),transparent_38%)]" />

              {/* Camada 4 — conteúdo + dots */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 text-white md:p-14">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/78">
                  Experiências Mona Hotel
                </span>
                <h1 className="mt-5 text-3xl font-semibold leading-snug tracking-tight text-white">
                  {settings.catalog_title}
                </h1>
                {settings.catalog_subtitle ? (
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/72">
                    {settings.catalog_subtitle}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={cart.length ? whatsappUrl : "#catalogo"}
                      className="rounded-full bg-[#d3ab7f] px-6 py-3 text-sm font-semibold text-[#241710] transition hover:bg-[#e0bc94]"
                    >
                      {settings.reservation_button_label}
                    </a>
                    <a
                      href={BOOKING_URL}
                      className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Reserve agora
                    </a>
                  </div>
                  {/* Dots do carrossel */}
                  <div className="flex gap-2">
                    {HERO_IMAGES.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setHeroIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                        aria-label={`Ir para slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid + sidebar */}
        <div className="grid gap-8 px-6 pb-8 xl:grid-cols-[1fr_340px]">
          {/* Cards */}
          <section
            id="catalogo"
            className="grid content-start gap-5 md:grid-cols-2"
          >
            {cards.length ? (
              cards.map((card) => {
                const daysLeft = getDaysUntilExpiry(card.valid_until);
                const expiringSoon =
                  daysLeft !== null && daysLeft > 0 && daysLeft <= 14;

                return (
                  <article
                    key={card.id}
                    className="group overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 shadow-[0_16px_40px_rgba(61,36,23,0.07)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(61,36,23,0.12)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                        style={{
                          backgroundImage: card.image_url
                            ? `url(${card.image_url})`
                            : "linear-gradient(135deg, #d9b298, #f4e2d1)",
                        }}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(36,23,16,0.02)_0%,rgba(36,23,16,0.22)_100%)]" />
                      {expiringSoon ? (
                        <div className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white shadow backdrop-blur-sm">
                          Expira em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
                        </div>
                      ) : null}
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="truncate text-xl font-semibold tracking-tight">
                            {card.title}
                          </h2>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                            {card.short_description ??
                              "Descrição em configuração."}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                            {card.price_prefix}
                          </p>
                          <strong className="text-lg font-semibold">
                            {card.price_text ?? "—"}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4">
                        <span className="text-xs text-[var(--color-muted)]">
                          {card.min_quantity === card.max_quantity
                            ? `${card.min_quantity} ${card.unit_label}`
                            : `${card.min_quantity}–${card.max_quantity} ${card.unit_label}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => openCard(card)}
                          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--color-sand)]"
                        >
                          {card.button_label}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="rounded-[2rem] border border-[var(--color-line)] bg-white p-8 shadow-[0_18px_45px_rgba(61,36,23,0.06)] md:col-span-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Nenhuma experiência ativa ainda
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                  Cadastre os primeiros cards no painel admin para alimentar a
                  vitrine pública.
                </p>
              </article>
            )}
          </section>

          {/* Sidebar — carrinho */}
          <aside className="h-fit rounded-[1.75rem] border border-[var(--color-line)] bg-white p-6 shadow-[0_16px_40px_rgba(61,36,23,0.07)] xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Carrinho de consulta
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {cart.length} {cart.length === 1 ? "item" : "itens"}
                </h2>
              </div>
              {cart.length ? (
                <button
                  type="button"
                  onClick={() => writeCartToStorage([])}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-sand)]"
                >
                  Limpar
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              {cart.length ? (
                cart.map((item) => {
                  const relatedCard = cards.find(
                    (card) => card.id === item.card_id,
                  );
                  const step = relatedCard?.quantity_step ?? 1;
                  const min = relatedCard?.min_quantity ?? 1;
                  const max = relatedCard?.max_quantity ?? item.quantity;

                  return (
                    <article
                      key={item.card_id}
                      className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)]"
                    >
                      {item.image_url ? (
                        <div
                          className="aspect-[3/1] bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.image_url})` }}
                        />
                      ) : null}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold leading-snug">
                              {item.title}
                            </h3>
                            <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                              {item.price_text ?? "Preço sob consulta"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.card_id)}
                            className="shrink-0 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-white"
                          >
                            Remover
                          </button>
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                          <span className="text-sm font-medium text-[var(--color-ink)]">
                            Quantidade
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              aria-label="Diminuir quantidade"
                              onClick={() =>
                                updateCartItemQuantity(
                                  item.card_id,
                                  item.quantity - step,
                                )
                              }
                              disabled={item.quantity <= min}
                              className="flex size-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-base font-bold transition hover:bg-[var(--color-sand)] disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="min-w-[3.5rem] text-center text-sm">
                              <strong className="text-base">
                                {item.quantity}
                              </strong>{" "}
                              <span className="text-[var(--color-muted)]">
                                {item.unit_label}
                              </span>
                            </span>
                            <button
                              type="button"
                              aria-label="Aumentar quantidade"
                              onClick={() =>
                                updateCartItemQuantity(
                                  item.card_id,
                                  item.quantity + step,
                                )
                              }
                              disabled={item.quantity >= max}
                              className="flex size-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-base font-bold transition hover:bg-[var(--color-sand)] disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-8 text-center text-sm leading-6 text-[var(--color-muted)]">
                  <p className="font-medium">Seu carrinho está vazio.</p>
                  <p className="mt-1 text-xs">
                    Abra uma experiência, ajuste a quantidade e adicione ao
                    carrinho para consultar via WhatsApp.
                  </p>
                </div>
              )}
            </div>

            <a
              href={cart.length ? whatsappUrl : "#catalogo"}
              className="mt-6 block rounded-full bg-[var(--color-brand)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
              onClick={() => {
                if (cart.length) {
                  cart.forEach((item) => fireEvent(item.card_id, "whatsapp"));
                }
              }}
            >
              {settings.reservation_button_label}
            </a>
          </aside>
        </div>
      </div>

      {/* Modal de detalhes */}
      {activeCard ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(36,23,16,0.55)] p-4 animate-fade-in sm:items-center"
          onClick={() => setActiveCard(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.28)] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagem do modal */}
            <div className="relative aspect-[16/7] overflow-hidden rounded-t-[2rem]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: activeCard.image_url
                    ? `url(${activeCard.image_url})`
                    : "linear-gradient(135deg, #d9b298, #f4e2d1)",
                }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(36,23,16,0.06),rgba(36,23,16,0.38))]" />
              <button
                type="button"
                onClick={() => setActiveCard(null)}
                aria-label="Fechar"
                className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Experiência
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  {activeCard.title}
                </h2>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-[1fr_220px]">
                <div className="space-y-5">
                  {(activeCard.long_description ??
                  activeCard.short_description) ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                        Descrição
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                        {activeCard.long_description ??
                          activeCard.short_description}
                      </p>
                    </div>
                  ) : null}

                  {activeCard.additional_info ? (
                    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                        Informações adicionais
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                        {activeCard.additional_info}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-sand)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    Preço
                  </p>
                  {activeCard.price_prefix ? (
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      {activeCard.price_prefix}
                    </p>
                  ) : null}
                  <strong className="mt-1 block text-3xl font-semibold">
                    {activeCard.price_text ?? "Sob consulta"}
                  </strong>

                  <div className="mt-6 flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      Quantidade
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Diminuir quantidade"
                        onClick={() =>
                          setSelectedQuantity((q) =>
                            clampQuantity(
                              activeCard,
                              q - activeCard.quantity_step,
                            ),
                          )
                        }
                        disabled={selectedQuantity <= activeCard.min_quantity}
                        className="flex size-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-lg font-bold transition hover:bg-[var(--color-sand)] disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="min-w-[5rem] text-center">
                        <strong className="text-2xl">{selectedQuantity}</strong>{" "}
                        <span className="text-sm text-[var(--color-muted)]">
                          {activeCard.unit_label}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label="Aumentar quantidade"
                        onClick={() =>
                          setSelectedQuantity((q) =>
                            clampQuantity(
                              activeCard,
                              q + activeCard.quantity_step,
                            ),
                          )
                        }
                        disabled={selectedQuantity >= activeCard.max_quantity}
                        className="flex size-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-lg font-bold transition hover:bg-[var(--color-sand)] disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(activeCard, selectedQuantity)}
                    className="mt-6 w-full rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
                  >
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-[60] animate-toast-in"
          style={{ transform: "translateX(-50%)" }}
        >
          <div className="flex items-center gap-3 rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 shrink-0 text-green-400"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {toast}
          </div>
        </div>
      ) : null}
    </main>
  );
}
