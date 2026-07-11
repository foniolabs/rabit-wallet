'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/* A single floating "sticker" — gentle bob + tilt, family.co style. */
function Sticker({
  children,
  className,
  delay = 0,
  rotate = 6,
  duration = 5,
}: {
  children: ReactNode
  className?: string
  delay?: number
  rotate?: number
  duration?: number
}) {
  return (
    <motion.div
      className={`absolute ${className ?? ''}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, y: [0, -12, 0], rotate: [-rotate, rotate, -rotate] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] },
        y: { duration, repeat: Infinity, ease: 'easeInOut', delay },
        rotate: { duration: duration * 1.4, repeat: Infinity, ease: 'easeInOut', delay },
      }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- flat playful SVG shapes ---------- */

function Coin({ s = 54 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="26" fill="#F5B93B" />
      <circle cx="30" cy="30" r="26" fill="url(#cg)" fillOpacity="0.35" />
      <ellipse cx="24" cy="22" rx="7" ry="10" fill="#FFE08A" transform="rotate(-30 24 22)" />
      <defs>
        <linearGradient id="cg" x1="10" y1="8" x2="50" y2="52">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function FaceBlob({ s = 90, color = '#4DA2FF' }: { s?: number; color?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
      <path
        d="M50 6c14 0 20 8 28 14s12 12 12 26-8 22-16 28-16 14-24 14-18-8-27-15S6 66 6 50s8-22 15-29S36 6 50 6Z"
        fill={color}
      />
      <circle cx="40" cy="50" r="4.5" fill="#0A1512" />
      <circle cx="60" cy="50" r="4.5" fill="#0A1512" />
      <path d="M43 62c4 4 10 4 14 0" stroke="#0A1512" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

function Star({ s = 34, color = '#FFC93F' }: { s?: number; color?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <path
        d="M20 2c1.5 9 8 15.5 17 17.5-9 2-15.5 8.5-17 17.5-1.5-9-8-15.5-17-17.5 9-2 15.5-8.5 17-17.5Z"
        fill={color}
      />
    </svg>
  )
}

function Heart({ s = 30 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <path
        d="M20 35S4 25 4 14C4 8 8.5 4.5 13.5 4.5 16.8 4.5 19 6.4 20 8c1-1.6 3.2-3.5 6.5-3.5C31.5 4.5 36 8 36 14c0 11-16 21-16 21Z"
        fill="#FF5C39"
      />
    </svg>
  )
}

function Eth({ s = 40 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <path d="M20 3 9 21l11 6 11-6L20 3Z" fill="#8AA6FF" />
      <path d="M20 3 9 21l11-5V3Z" fill="#B9CBFF" />
      <path d="M20 29 9 23l11 14 11-14-11 6Z" fill="#627EEA" />
    </svg>
  )
}

function Sparkle({ s = 22, color = '#57C08D' }: { s?: number; color?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 0c.8 6 4 8.5 12 12-8 3.5-11.2 6-12 12-.8-6-4-8.5-12-12 8-3.5 11.2-6 12-12Z"
        fill={color}
      />
    </svg>
  )
}

function Pill({ w = 56, color = '#9E7BFF' }: { w?: number; color?: string }) {
  return (
    <svg width={w} height={w * 0.5} viewBox="0 0 60 30" fill="none">
      <rect width="60" height="30" rx="15" fill={color} />
      <rect x="6" y="6" width="20" height="18" rx="9" fill="#fff" fillOpacity="0.35" />
    </svg>
  )
}

function Flower({ s = 46, color = '#37C2C4' }: { s?: number; color?: string }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      {petals.map((a) => (
        <ellipse
          key={a}
          cx="30"
          cy="14"
          rx="9"
          ry="13"
          fill={color}
          transform={`rotate(${a} 30 30)`}
        />
      ))}
      <circle cx="30" cy="30" r="8" fill="#FFC93F" />
    </svg>
  )
}

/* ---------- clustered layouts flanking the headline ---------- */

export function HeroArtLeft() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[26%] xl:block">
      <Sticker className="left-[10%] top-[20%]" delay={0.1} duration={5.5}>
        <FaceBlob color="#4DA2FF" s={104} />
      </Sticker>
      <Sticker className="left-[58%] top-[8%]" delay={0.5} rotate={12}>
        <Coin s={46} />
      </Sticker>
      <Sticker className="left-[4%] top-[62%]" delay={0.35} rotate={10}>
        <Star color="#FFC93F" s={36} />
      </Sticker>
      <Sticker className="left-[62%] top-[58%]" delay={0.65} duration={6}>
        <Heart s={30} />
      </Sticker>
      <Sticker className="left-[36%] top-[74%]" delay={0.8} rotate={14}>
        <Eth s={40} />
      </Sticker>
      <Sticker className="left-[70%] top-[34%]" delay={0.25}>
        <Sparkle color="#569F8C" s={20} />
      </Sticker>
    </div>
  )
}

export function HeroArtRight() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[26%] xl:block">
      <Sticker className="right-[8%] top-[16%]" delay={0.2} duration={5.5}>
        <FaceBlob color="#57C08D" s={96} />
      </Sticker>
      <Sticker className="right-[58%] top-[10%]" delay={0.6} rotate={12}>
        <Flower color="#37C2C4" s={46} />
      </Sticker>
      <Sticker className="right-[6%] top-[60%]" delay={0.45} rotate={10}>
        <Coin s={40} />
      </Sticker>
      <Sticker className="right-[60%] top-[54%]" delay={0.75} duration={6}>
        <Pill w={54} color="#9E7BFF" />
      </Sticker>
      <Sticker className="right-[34%] top-[76%]" delay={0.9} rotate={14}>
        <Star color="#FF5C39" s={30} />
      </Sticker>
      <Sticker className="right-[74%] top-[36%]" delay={0.3}>
        <Sparkle color="#FFC93F" s={22} />
      </Sticker>
    </div>
  )
}
