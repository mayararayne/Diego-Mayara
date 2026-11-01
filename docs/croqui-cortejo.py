# Croqui de estilista: manequins sem rosto, nas cores oficiais do cortejo.
INK="#4A3F35"; PELE="#EAD9C7"; CABELO_H="#5A4436"; CABELO_M="#6B4A36"; SAPATO="#8D5A32"
PADRINHOS=["#ADADAA","#A3A3A0","#959593","#B0A99F","#A9ACA4"]
MADRINHAS=["#C88F84","#D4969B","#CE7A66","#CC8C7D","#C29490"]
AZUL="#7F93A3"; DOURADO="#D2B17E"; MARFIM="#F4EFE4"; CAMISA="#F2EFE6"

def esc(c,f):
    c=c.lstrip('#'); r,g,b=[int(c[i:i+2],16) for i in (0,2,4)]
    return '#%02X%02X%02X'%tuple(max(0,min(255,int(v*f))) for v in (r,g,b))

def cabeca(x, fem, cab):
    s=f'<path d="M{x-2},64 L{x-2},76 L{x+4},76 L{x+4},64 Z" fill="{PELE}" stroke="{INK}" stroke-width="1"/>'
    s+=f'<ellipse cx="{x+1}" cy="44" rx="11.5" ry="15" fill="{PELE}" stroke="{INK}" stroke-width="1.2"/>'
    if fem:  # coque
        s+=f'<path d="M{x-11},44 C{x-13},26 {x+15},24 {x+13},44 C{x+9},34 {x-7},33 {x-11},44 Z" fill="{cab}" stroke="{INK}" stroke-width="1"/>'
        s+=f'<circle cx="{x+12}" cy="36" r="6.5" fill="{cab}" stroke="{INK}" stroke-width="1"/>'
    else:
        s+=f'<path d="M{x-11},42 C{x-12},27 {x+14},25 {x+13},41 C{x+9},34 {x-6},33 {x-11},42 Z" fill="{cab}" stroke="{INK}" stroke-width="1"/>'
    return s

def homem(x, terno, noivo=False):
    escuro=esc(terno,.88); s=cabeca(x,False,CABELO_H)
    # pernas
    s+=f'<path d="M{x-14},200 L{x-13},392 L{x-2},392 L{x+1},226 L{x+4},392 L{x+15},392 L{x+16},200 Z" fill="{escuro}" stroke="{INK}" stroke-width="1.1"/>'
    s+=f'<path d="M{x+1},228 L{x+1},392" stroke="{INK}" stroke-width=".7" opacity=".5"/>'
    # sapatos
    s+=f'<path d="M{x-15},392 q-2,7 6,7 h9 v-7 Z M{x+3},392 v7 h10 q7,0 4,-7 Z" fill="{SAPATO}" stroke="{INK}" stroke-width=".9"/>'
    # paletó
    s+=f'<path d="M{x-21},82 C{x-14},76 {x-6},75 {x+1},78 C{x+8},75 {x+16},76 {x+23},82 L{x+19},212 L{x+1},218 L{x-17},212 Z" fill="{terno}" stroke="{INK}" stroke-width="1.2"/>'
    # camisa e lapelas
    s+=f'<path d="M{x-6},78 L{x+1},128 L{x+8},78 Z" fill="{CAMISA}" stroke="{INK}" stroke-width=".9"/>'
    if noivo:
        s+=f'<path d="M{x-6},96 L{x+1},128 L{x+8},96 L{x+7},150 L{x-5},150 Z" fill="#CDB89A" stroke="{INK}" stroke-width=".8"/>'  # colete
        s+=f'<path d="M{x-1},82 L{x+3},82 L{x+5},120 L{x+1},128 L{x-3},120 Z" fill="{DOURADO}" stroke="{INK}" stroke-width=".8"/>'  # gravata
    s+=f'<path d="M{x-6},78 L{x-11},104 L{x-3},112 L{x+1},128" fill="none" stroke="{INK}" stroke-width="1"/>'
    s+=f'<path d="M{x+8},78 L{x+13},104 L{x+5},112 L{x+1},128" fill="none" stroke="{INK}" stroke-width="1"/>'
    s+=f'<circle cx="{x+1}" cy="160" r="1.6" fill="{INK}"/>'
    s+=f'<path d="M{x+15},96 C{x+16},140 {x+15},180 {x+14},206" stroke="{esc(terno,1.1)}" stroke-width="3" opacity=".45" fill="none"/>'
    # lenço azul no bolso dos padrinhos / flor do noivo
    if noivo: s+=f'<circle cx="{x-12}" cy="106" r="3.2" fill="{MARFIM}" stroke="{INK}" stroke-width=".7"/>'
    else: s+=f'<path d="M{x-17},112 l4,-6 l3,4 l3,-4 l2,6 Z" fill="{AZUL}" stroke="{INK}" stroke-width=".7"/>'
    # braços
    s+=f'<path d="M{x-21},84 C{x-27},120 {x-27},170 {x-24},206 L{x-17},206 C{x-18},170 {x-17},126 {x-13},96 Z" fill="{esc(terno,.95)}" stroke="{INK}" stroke-width="1"/>'
    s+=f'<path d="M{x+23},84 C{x+29},120 {x+29},170 {x+26},206 L{x+19},206 C{x+20},170 {x+19},126 {x+15},96 Z" fill="{esc(terno,.95)}" stroke="{INK}" stroke-width="1"/>'
    s+=f'<ellipse cx="{x-21}" cy="212" rx="4" ry="6" fill="{PELE}" stroke="{INK}" stroke-width=".8"/><ellipse cx="{x+23}" cy="212" rx="4" ry="6" fill="{PELE}" stroke="{INK}" stroke-width=".8"/>'
    return s

def buque(x,y,grande=False):
    r=13 if grande else 11; s=''
    s+=f'<path d="M{x-3},{y+8} L{x},{y+30} L{x+3},{y+8}" stroke="#6F876A" stroke-width="2" fill="none"/>'
    for dx,dy,c in [(-7,-2,"#F1C8B2"),(6,-3,"#E7E1D4"),(0,-8,"#F1C8B2"),(-3,5,"#D9B8A0"),(7,5,"#F1C8B2"),(-9,-9,"#A9B39B"),(10,-9,"#A9B39B")]:
        k=1.25 if grande else 1
        s+=f'<circle cx="{x+dx*k}" cy="{y+dy*k}" r="{(4.6 if c!="#A9B39B" else 3.2)*k}" fill="{c}" stroke="{INK}" stroke-width=".6"/>'
    return s

def mulher(x, cor, noiva=False):
    escuro=esc(cor,.86); claro=esc(cor,1.08); s=''
    if noiva:
        s+=f'<path d="M{x+6},34 C{x+42},80 {x+48},260 {x+40},380 L{x+20},380 C{x+24},250 {x+18},100 {x+4},40 Z" fill="#FFFFFF" opacity=".5" stroke="{INK}" stroke-width=".5"/>'
    larg=50 if noiva else 38
    d=(f"M{x-9},82 C{x-3},88 {x+5},88 {x+11},82 C{x+12},104 {x+9},124 {x+8},140 "
       f"C{x+22},205 {x+larg-6},300 {x+larg+4},392 C{x+larg-10},402 {x-larg+12},402 {x-larg+2},392 "
       f"C{x-larg+12},300 {x-20},205 {x-6},140 C{x-7},124 {x-10},104 {x-9},82 Z")
    s+=f'<path d="{d}" fill="{cor}" stroke="{INK}" stroke-width="1.2"/>'
    s+=f'<path d="M{x+6},96 C{x+5},120 {x+6},132 {x+5},140" stroke="{claro}" stroke-width="3" opacity=".6" fill="none"/>'
    for dx in (-0.55,-0.22,0.12,0.45,0.75):
        s+=f'<path d="M{x+1+dx*14},146 C{x+1+dx*28},230 {x+1+dx*larg*1.15},320 {x+1+dx*larg*1.55},397" fill="none" stroke="{escuro}" stroke-width="1.1" opacity=".75"/>'
    s+=f'<path d="M{x+5},146 C{x+18},240 {x+larg*0.55},330 {x+larg*0.75},394" fill="none" stroke="{claro}" stroke-width="4" opacity=".35"/>'
    s+=f'<path d="M{x-7},140 C{x-2},145 {x+4},145 {x+9},140" fill="none" stroke="{INK}" stroke-width=".9"/>'
    if noiva:
        for i in range(7): s+=f'<path d="M{x-7+i*2.5},{96+i*6} q3,4 6,0" fill="none" stroke="#CDBFAA" stroke-width=".8"/>'
    else:
        s+=f'<path d="M{x-9},82 L{x+1},71 L{x+11},82" fill="none" stroke="{INK}" stroke-width=".9"/>'
    for lado in (-1,1):
        s+=f'<path d="M{x+1+lado*11},84 C{x+1+lado*19},110 {x+1+lado*18},138 {x+1+lado*8},156 L{x+1+lado*4},152 C{x+1+lado*12},136 {x+1+lado*13},112 {x+1+lado*7},90 Z" fill="{PELE}" stroke="{INK}" stroke-width=".9"/>'
    s+=cabeca(x,True,CABELO_M)
    s+=buque(x+1,158,noiva)
    return s

W=1240; H=430; passo=94; x0=60
figs=[]
for i,c in enumerate(PADRINHOS): figs.append(homem(x0+i*passo,c))
figs.append(homem(x0+5*passo,AZUL,noivo=True))
figs.append(mulher(x0+6*passo+6,MARFIM,noiva=True))
for i,c in enumerate(MADRINHAS): figs.append(mulher(x0+(7+i)*passo+10,c))
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W*2}" height="{H*2}">
<defs>
 <filter id="lapis" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.6"/></filter>
 <filter id="aquarela"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0" result="m"/><feComposite in="SourceGraphic" in2="m" operator="arithmetic" k1="0" k2="1" k3="-.6" k4="0"/></filter>
</defs>
<rect width="{W}" height="{H}" fill="#F7F3EA"/>
<ellipse cx="{W/2}" cy="400" rx="{W*0.47}" ry="9" fill="#E7E1D4" opacity=".8"/>
<g filter="url(#lapis)">{''.join(figs)}</g>
</svg>'''
open('/tmp/croqui/cortejo.svg','w').write(svg); print("svg ok")
