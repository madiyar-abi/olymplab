'use client'

import { useTheme } from '@/components/shared/ThemeProvider'

export function MountainIllustration() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <svg viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-[680px]">
      {/* Sky */}
      <rect width="600" height="700" fill={isDark ? '#0d0f2b' : '#bce3f8'} />

      {/* Stars (dark only) */}
      {isDark && (
        <g fill="white" opacity="0.8">
          {[[60,50],[120,30],[200,70],[310,20],[400,55],[480,35],[540,65],[80,110],[350,90],[500,100]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r={x % 3 === 0 ? 2 : 1.2} />
          ))}
        </g>
      )}

      {/* Sun (light only) */}
      {!isDark && (
        <g>
          <circle cx="470" cy="90" r="55" fill="#FFD93D" opacity="0.9" />
          <circle cx="470" cy="90" r="42" fill="#FFE66D" />
          {[0,45,90,135,180,225,270,315].map((deg,i) => {
            const r = Math.PI * deg / 180
            return <line key={i} x1={470 + Math.cos(r)*50} y1={90 + Math.sin(r)*50} x2={470 + Math.cos(r)*68} y2={90 + Math.sin(r)*68} stroke="#FFD93D" strokeWidth="4" strokeLinecap="round"/>
          })}
          {/* Happy sun face */}
          <circle cx="458" cy="84" r="4" fill="#e8a000"/>
          <circle cx="482" cy="84" r="4" fill="#e8a000"/>
          <path d="M458 98 Q470 108 482 98" stroke="#e8a000" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </g>
      )}

      {/* Aurora (dark only) */}
      {isDark && (
        <g opacity="0.5">
          <path d="M0 120 Q150 80 300 140 Q450 200 600 120" stroke="#00e5c8" strokeWidth="18" fill="none" strokeLinecap="round"/>
          <path d="M0 150 Q150 110 300 180 Q450 240 600 155" stroke="#7c3aed" strokeWidth="12" fill="none" strokeLinecap="round"/>
          <path d="M50 100 Q200 60 350 120 Q480 170 600 100" stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round"/>
        </g>
      )}

      {/* Clouds (light only) */}
      {!isDark && (
        <g fill="white" opacity="0.9">
          <ellipse cx="150" cy="120" rx="70" ry="30"/>
          <ellipse cx="130" cy="115" rx="45" ry="28"/>
          <ellipse cx="185" cy="115" rx="40" ry="22"/>
          <ellipse cx="430" cy="150" rx="55" ry="25"/>
          <ellipse cx="410" cy="145" rx="40" ry="22"/>
          <ellipse cx="460" cy="145" rx="35" ry="20"/>
        </g>
      )}

      {/* Moon (dark only) */}
      {isDark && (
        <g>
          <path d="M95 60 A32 32 0 1 1 95 124 A22 22 0 1 0 95 60Z" fill="white" opacity="0.9"/>
        </g>
      )}

      {/* Far mountains */}
      <g fill={isDark ? '#1e213d' : '#94a3b8'} opacity={isDark ? 1 : 0.6}>
        <polygon points="0,420 100,220 200,420"/>
        <polygon points="80,420 220,180 360,420"/>
        <polygon points="250,420 380,210 510,420"/>
        <polygon points="420,420 540,240 660,420"/>
      </g>
      {/* Far snow caps */}
      <g fill={isDark ? '#c8d4f0' : 'white'} opacity="0.85">
        <polygon points="100,220 120,250 80,250"/>
        <polygon points="220,180 250,225 190,225"/>
        <polygon points="380,210 410,255 350,255"/>
        <polygon points="540,240 565,280 515,280"/>
      </g>

      {/* Pine trees background */}
      <g fill={isDark ? '#1a3a2a' : '#2d6a4f'}>
        {[30,70,490,530,560].map((x,i) => (
          <g key={i}>
            <polygon points={`${x},400 ${x+15},450 ${x-15},450`}/>
            <rect x={x-4} y={450} width={8} height={20} fill={isDark?'#3d2b1f':'#6b4226'}/>
          </g>
        ))}
      </g>

      {/* Main mountain / snowy ground */}
      <g>
        <polygon points="0,700 0,430 300,320 600,430 600,700" fill={isDark ? '#c8d4f0' : '#e8f4fd'}/>
        <polygon points="0,700 0,490 200,430 600,490 600,700" fill={isDark ? '#dde7f8' : '#f0f8ff'}/>
        {/* Snow shading */}
        <polygon points="0,700 0,550 150,500 600,540 600,700" fill={isDark ? '#eef2fb' : 'white'} opacity="0.6"/>
      </g>

      {/* Winding trail */}
      <path d="M150,700 Q180,620 220,580 Q260,540 240,490 Q230,460 270,440" 
            stroke={isDark ? '#b0c4de' : '#90b8d0'} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="12,8"/>

      {/* Signpost */}
      <g>
        <rect x="355" y="430" width="10" height="100" fill="#7c5c3a" rx="2"/>
        <rect x="335" y="445" width="75" height="36" fill="#a0784e" rx="6"/>
        <text x="373" y="469" textAnchor="middle" fontSize="15" fontWeight="bold" fill="white" fontFamily="system-ui">1600↑</text>
      </g>

      {/* Blue slime mascot (main) */}
      <g transform="translate(215, 460)">
        {/* Body */}
        <ellipse cx="0" cy="10" rx="42" ry="38" fill="#3b82f6"/>
        <ellipse cx="0" cy="8" rx="40" ry="36" fill="#60a5fa"/>
        {/* Shine */}
        <ellipse cx="-12" cy="-8" rx="10" ry="7" fill="white" opacity="0.4" transform="rotate(-20)"/>
        {/* Eyes */}
        <ellipse cx="-13" cy="2" rx="8" ry="9" fill="white"/>
        <ellipse cx="13" cy="2" rx="8" ry="9" fill="white"/>
        <ellipse cx="-13" cy="4" rx="5" ry="6" fill="#1d3a6e"/>
        <ellipse cx="13" cy="4" rx="5" ry="6" fill="#1d3a6e"/>
        <circle cx="-11" cy="2" r="2" fill="white"/>
        <circle cx="15" cy="2" r="2" fill="white"/>
        {/* Rosy cheeks */}
        <ellipse cx="-22" cy="12" rx="7" ry="5" fill="#f9a8d4" opacity="0.6"/>
        <ellipse cx="22" cy="12" rx="7" ry="5" fill="#f9a8d4" opacity="0.6"/>
        {/* Smile */}
        <path d="M-10 18 Q0 26 10 18" stroke="#1d4ed8" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Tiny arms */}
        <ellipse cx="-38" cy="8" rx="9" ry="6" fill="#60a5fa" transform="rotate(30,-38,8)"/>
        <ellipse cx="38" cy="8" rx="9" ry="6" fill="#60a5fa" transform="rotate(-30,38,8)"/>
        {/* Feet */}
        <ellipse cx="-16" cy="44" rx="10" ry="6" fill="#2563eb"/>
        <ellipse cx="16" cy="44" rx="10" ry="6" fill="#2563eb"/>
        {/* Backpack */}
        <rect x="14" y="-15" width="28" height="32" fill="#f97316" rx="5"/>
        <rect x="16" y="-13" width="24" height="28" fill="#fb923c" rx="4"/>
        <line x1="20" y1="-14" x2="20" y2="18" stroke="#ea580c" strokeWidth="2"/>
        <line x1="35" y1="-14" x2="35" y2="18" stroke="#ea580c" strokeWidth="2"/>
        <rect x="22" y="0" width="14" height="8" fill="#ea580c" rx="3"/>
      </g>

      {/* Green slime mascot (small friend) */}
      <g transform="translate(360, 505)">
        <ellipse cx="0" cy="5" rx="24" ry="22" fill="#22c55e"/>
        <ellipse cx="0" cy="3" rx="22" ry="20" fill="#4ade80"/>
        <ellipse cx="-7" cy="-5" rx="6" ry="4" fill="white" opacity="0.35" transform="rotate(-20)"/>
        <ellipse cx="-7" cy="1" rx="5" ry="6" fill="white"/>
        <ellipse cx="7" cy="1" rx="5" ry="6" fill="white"/>
        <ellipse cx="-7" cy="3" rx="3" ry="4" fill="#14532d"/>
        <ellipse cx="7" cy="3" rx="3" ry="4" fill="#14532d"/>
        <ellipse cx="-13" cy="8" rx="4" ry="3" fill="#f9a8d4" opacity="0.5"/>
        <ellipse cx="13" cy="8" rx="4" ry="3" fill="#f9a8d4" opacity="0.5"/>
        <path d="M-5 12 Q0 16 5 12" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <ellipse cx="-10" cy="26" rx="6" ry="4" fill="#16a34a"/>
        <ellipse cx="10" cy="26" rx="6" ry="4" fill="#16a34a"/>
      </g>

      {/* Decorative snowflakes */}
      {isDark && [[100,380],[500,360],[420,500]].map(([x,y],i) => (
        <g key={i} fill="white" opacity="0.5">
          <circle cx={x} cy={y} r="2"/>
          <line x1={x-6} y1={y} x2={x+6} y2={y} stroke="white" strokeWidth="1"/>
          <line x1={x} y1={y-6} x2={x} y2={y+6} stroke="white" strokeWidth="1"/>
        </g>
      ))}
    </svg>
  )
}
