"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import { BOOKING_URL } from "@/lib/constants";

const primaryLinks = [
  { href: "https://www.monahotel.com.br/", label: "Home" },
  { href: "https://www.monahotel.com.br/sobre-o-hotel", label: "Sobre" },
  { href: "https://www.monahotel.com.br/acomodacoes", label: "Acomodações" },
  { href: "https://www.monahotel.com.br/eventos", label: "Eventos" },
  { href: "https://www.monahotel.com.br/rooftop", label: "Rooftop" },
];

export function FixedSiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handlePageShow = () => {
      setOpen(false);
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return (
    <>
      <header className="fixed left-0 top-0 z-40 w-full">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(29,20,14,0.62),rgba(29,20,14,0.16)_72%,transparent)] backdrop-blur-[6px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-6 rounded-full border border-white/20 bg-[rgba(34,24,17,0.42)] px-5 py-3 text-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <a
              href="https://www.monahotel.com.br"
              className="flex shrink-0 items-center"
            >
              <img
                src="https://www.monahotel.com.br/site/hotelmona/img/logo.png"
                height={45}
                alt="Mona Hotel"
                className="h-11 w-auto"
              />
            </a>

            <nav className="hidden items-center gap-7 lg:flex">
              {primaryLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium tracking-[0.08em] text-white/88 transition hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <a
                href={BOOKING_URL}
                onClick={() => setOpen(false)}
                className="rounded-full bg-[#d3ab7f] px-5 py-3 text-sm font-semibold text-[#241710] transition hover:bg-[#e0bc94]"
              >
                Reserve agora
              </a>
            </div>

            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className="flex size-11 items-center justify-center rounded-full border border-white/20 lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={open}
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 bg-white" />
                <span className="block h-0.5 w-5 bg-white" />
                <span className="block h-0.5 w-5 bg-white" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-30 bg-[rgba(25,18,13,0.94)] px-6 pb-8 pt-28 text-white lg:hidden">
          <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            {primaryLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 pb-4 text-lg font-medium"
              >
                {link.label}
              </a>
            ))}

            <a
              href={BOOKING_URL}
              className="rounded-full bg-[#d3ab7f] px-5 py-4 text-center text-base font-semibold text-[#241710]"
            >
              Reserve agora
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
