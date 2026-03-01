"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon, ChevronDownIcon, SunIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
};

const mainNavLinks: HeaderMenuLink[] = [
  { label: "Markets", href: "/" },
  { label: "Browse Markets", href: "/markets" },
  { label: "Debug Contracts", href: "/debug", icon: <BugAntIcon className="h-4 w-4" /> },
];

const moreLinks: HeaderMenuLink[] = [
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {mainNavLinks.map(({ label, href, badge }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${isActive ? "text-black border-b-2 border-black" : "text-base-content/40 hover:text-black/70"} font-black py-2 px-1 text-sm rounded-none gap-2 grid grid-flow-col items-center bg-transparent focus:bg-transparent active:bg-transparent`}
            >
              <span>{label}</span>
              {badge && <span className="badge badge-xs badge-info font-black border-none px-1 h-3.5 leading-none">{badge}</span>}
            </Link>
          </li>
        );
      })}
      <li className="ml-2">
        <details className="dropdown dropdown-end">
          <summary className="py-2 px-1 text-sm font-black text-base-content/40 hover:text-black/70 cursor-pointer list-none flex items-center gap-1.5 focus:bg-transparent active:bg-transparent">
            More <ChevronDownIcon className="w-3.5 h-3.5 stroke-[3]" />
          </summary>
          <ul className="menu dropdown-content mt-2 p-2 shadow-xl bg-white rounded-[1rem] w-52 z-30 border border-base-200">
            {moreLinks.map(({ label, href, icon }) => (
              <li key={href}>
                <Link href={href} className={`${pathname === href ? "bg-base-100 text-black" : "text-base-content/60"} gap-2 font-bold hover:bg-base-50 rounded-lg p-2.5 transition-colors`}>
                  {icon}
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </li>
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky top-0 navbar bg-white min-h-[56px] h-14 shrink-0 justify-between z-20 px-4 border-b border-base-200">
      <div className="navbar-start w-auto lg:w-1/3">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="btn btn-ghost btn-sm lg:hidden hover:bg-transparent px-1">
            <Bars3Icon className="h-5 w-5" />
          </summary>
          <ul className="menu menu-compact dropdown-content mt-3 p-2 shadow-xl bg-base-100 rounded-[1rem] w-52 border border-base-200" onClick={() => burgerMenuRef?.current?.removeAttribute("open")}>
            {mainNavLinks.map(({ label, href, badge }) => (
              <li key={href}><Link href={href} className="font-bold"><span>{label}</span>{badge && <span className="badge badge-sm badge-info">New</span>}</Link></li>
            ))}
            <div className="divider my-1 opacity-50"></div>
            {moreLinks.map(({ label, href }) => (
              <li key={href}><Link href={href} className="font-bold">{label}</Link></li>
            ))}
          </ul>
        </details>

        <Link href="/" className="flex items-center gap-2.5 ml-2 mr-6 shrink-0 group">
          <div className="w-8 h-8 rounded-[0.6rem] bg-black flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-sm tracking-tighter">L</span>
          </div>
          <span className="font-black text-lg tracking-tight text-black">Likely</span>
        </Link>

        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-1">
          <HeaderMenuLinks />
        </ul>
      </div>

      <div className="navbar-end flex-1 justify-end gap-3">
        <div className="hidden md:flex items-center gap-1.5 bg-base-100 border border-base-200 rounded-full px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[11px] font-black text-black/60 uppercase tracking-widest">Live on Fuji</span>
        </div>

        <div className="h-6 w-[1px] bg-base-200 mx-1 hidden md:block"></div>

        <div className="flex items-center gap-1">
          <Link
            href="/markets"
            className="btn btn-ghost btn-sm font-black text-black gap-1.5 hover:bg-base-100 rounded-full"
          >
            <span className="text-base-content/30 text-xs hidden sm:inline">Browse</span>
            <span>Markets</span>
          </Link>

          <button className="btn btn-ghost btn-sm btn-circle hover:bg-base-100" aria-label="Toggle theme">
            <SunIcon className="h-4 w-4 text-base-content/60" />
          </button>
        </div>

        <div className="h-6 w-[1px] bg-base-200 mx-1"></div>

        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
