// Art for the hand drill's close view: the SVG symbols of design 18 ("Close-up training"), ids prefixed `hd-`.
// Migas in four poses, the isometric stage slab, the hand with a treat, the ball, the sparkle and the HUD icons.
export const HD_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" class="hd-defs">
<defs>
<pattern id="hd-iso" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 0L80 40M0 40L80 0" fill="none" stroke="#1E2A3A" stroke-opacity=".08" stroke-width="2"/></pattern>

<symbol id="hd-i-pause" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></symbol>
<symbol id="hd-i-paw" viewBox="0 0 24 24"><circle cx="6" cy="11" r="2"/><circle cx="10.500" cy="6.500" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="19" cy="12" r="1.800"/><path d="M12 12c-3 0-5.500 3-5.500 5.500 0 2 1.500 3 3.500 3 1 0 1.500-.5 2-.5s1 .5 2 .5c2 0 3.500-1 3.500-3C17.500 15 15 12 12 12z"/></symbol>
<symbol id="hd-i-marker" viewBox="0 0 24 24"><circle cx="11" cy="14" r="7"/><circle cx="11" cy="14" r="2.500"/><path d="M18 4l1.500-1.500M20.500 8l2-.5M14.500 3.500l.5-2"/></symbol>
<symbol id="hd-i-check" viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></symbol>
<symbol id="hd-i-flow" viewBox="0 0 24 24"><path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z"/></symbol>
<symbol id="hd-i-eye" viewBox="0 0 24 24"><path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/></symbol>
<symbol id="hd-i-ears" viewBox="0 0 24 24"><path d="M5 20V7l4.500 3.500M19 20V7l-4.500 3.500M5 20c0-5 3-7.500 7-7.500s7 2.500 7 7.500"/></symbol>
<symbol id="hd-i-sit" viewBox="0 0 24 24"><path d="M12 4v10M7.500 9.500L12 14l4.500-4.500M5 19h14"/></symbol>
<symbol id="hd-i-down" viewBox="0 0 24 24"><path d="M7 4l5 5 5-5M7 10l5 5 5-5M5 20h14"/></symbol>
<symbol id="hd-i-drop" viewBox="0 0 24 24"><circle cx="12" cy="6" r="3"/><path d="M12 12v4M9.500 14l2.500 2.500 2.500-2.500M5 20h14"/></symbol>

<symbol id="hd-stage" viewBox="20 390 350 210">
<polygon points="25,480 195,565 195,595 25,510" style="fill:var(--st-l,#D9A87A)" stroke="#1E2A3A" stroke-width="3.500" stroke-linejoin="round"/>
<polygon points="195,565 365,480 365,510 195,595" style="fill:var(--st-r,#B5533C)" stroke="#1E2A3A" stroke-width="3.500" stroke-linejoin="round"/>
<polygon points="195,395 365,480 195,565 25,480" style="fill:var(--st-top,#FFFBF1)"/>
<path d="M195 395L237.500 416.250L195 437.500L152.500 416.250ZM110 437.500L152.500 458.750L110 480L67.500 458.750ZM195 437.500L237.500 458.750L195 480L152.500 458.750ZM110 480L152.500 501.250L110 522.500L67.500 501.250ZM280 437.500L322.500 458.750L280 480L237.500 458.750ZM195 480L237.500 501.250L195 522.500L152.500 501.250ZM280 480L322.500 501.250L280 522.500L237.500 501.250ZM195 522.500L237.500 543.750L195 565L152.500 543.750Z" style="fill:var(--st-alt,#FBE3AE)"/>
<path d="M237.500 416.250L67.500 501.250M152.500 416.250L322.500 501.250M280 437.500L110 522.500M110 437.500L280 522.500M322.500 458.750L152.500 543.750M67.500 458.750L237.500 543.750" fill="none" stroke="#1E2A3A" stroke-width="2" opacity=".2"/>
<polygon points="195,395 365,480 195,565 25,480" fill="none" stroke="#1E2A3A" stroke-width="3.500" stroke-linejoin="round"/>
</symbol>

<symbol id="hd-sparkle" viewBox="0 0 24 24"><path d="M12 2C13 8 16 11 22 12C16 13 13 16 12 22C11 16 8 13 2 12C8 11 11 8 12 2Z" fill="#F2B84B" stroke="#1E2A3A" stroke-width="2" stroke-linejoin="round"/></symbol>

<symbol id="hd-treat" viewBox="0 0 28 20"><rect x="2" y="2.500" width="24" height="15" rx="7" fill="#F2B84B" stroke="#1E2A3A" stroke-width="2.500"/><circle cx="10" cy="8" r="1.500" fill="#1E2A3A" opacity=".55"/><circle cx="17" cy="12" r="1.500" fill="#1E2A3A" opacity=".55"/><circle cx="19" cy="7" r="1.200" fill="#1E2A3A" opacity=".55"/></symbol>

<symbol id="hd-ball" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="#E8795C" stroke="#1E2A3A" stroke-width="3"/><path d="M5.500 13C13 19 23 19 30.500 13" fill="none" stroke="#FFFBF1" stroke-width="3" stroke-linecap="round"/><path d="M10 8c2-1.500 4-2 6-2" fill="none" stroke="#FFFBF1" stroke-width="2.500" stroke-linecap="round" opacity=".7"/></symbol>

<symbol id="hd-hand" viewBox="-24 -24 80 48">
<use href="#hd-treat" x="24" y="-8" width="24" height="17"/>
<ellipse cx="20" cy="-6" rx="13" ry="6.500" transform="rotate(-18 20 -6)" fill="#F3D9B8" stroke="#1E2A3A" stroke-width="2.500"/>
<ellipse cx="22" cy="7" rx="13" ry="6.500" transform="rotate(14 22 7)" fill="#F3D9B8" stroke="#1E2A3A" stroke-width="2.500"/>
<ellipse cx="0" cy="0" rx="19" ry="16" fill="#F3D9B8" stroke="#1E2A3A" stroke-width="3"/>
</symbol>

<symbol id="hd-head" viewBox="-70 -60 140 120">
<path d="M-30 -16C-54 -20 -60 12 -42 28C-31 32 -22 14 -22 -6Z" fill="#B9783A" stroke="#1E2A3A" stroke-width="3" stroke-linejoin="round"/>
<path d="M26 -22C50 -28 60 4 44 24C34 28 24 10 22 -10Z" fill="#B9783A" stroke="#1E2A3A" stroke-width="3" stroke-linejoin="round"/>
<ellipse cx="0" cy="0" rx="37" ry="33" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="-11" cy="14" rx="25" ry="18" fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="-18" cy="6" rx="9" ry="6.500" fill="#1E2A3A"/>
<ellipse cx="-20.500" cy="4" rx="2.600" ry="1.600" fill="#FFFBF1" opacity=".85"/>
<path d="M-18 12V18M-18 18Q-24 25-32 21M-18 18Q-12 25-5 21" fill="none" stroke="#1E2A3A" stroke-width="2.500" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="-21" cy="-9" r="5" fill="#1E2A3A"/><circle cx="-19.500" cy="-10.500" r="1.700" fill="#FFFBF1"/>
<circle cx="10" cy="-11" r="5" fill="#1E2A3A"/><circle cx="11.500" cy="-12.500" r="1.700" fill="#FFFBF1"/>
<path d="M-27 27Q0 46 28 26" fill="none" stroke="#1E2A3A" stroke-width="14" stroke-linecap="round"/>
<path d="M-27 27Q0 46 28 26" fill="none" stroke="#6FAF73" stroke-width="8" stroke-linecap="round"/>
<circle cx="0" cy="41" r="6.500" fill="#F2B84B" stroke="#1E2A3A" stroke-width="2.500"/>
</symbol>

<symbol id="hd-head-open" viewBox="-70 -60 140 120">
<path d="M-30 -16C-54 -20 -60 12 -42 28C-31 32 -22 14 -22 -6Z" fill="#B9783A" stroke="#1E2A3A" stroke-width="3" stroke-linejoin="round"/>
<path d="M26 -22C50 -28 60 4 44 24C34 28 24 10 22 -10Z" fill="#B9783A" stroke="#1E2A3A" stroke-width="3" stroke-linejoin="round"/>
<ellipse cx="0" cy="0" rx="37" ry="33" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="-12" cy="30" rx="20" ry="11" fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="-11" cy="12" rx="25" ry="16" fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="-18" cy="5" rx="9" ry="6.500" fill="#1E2A3A"/>
<ellipse cx="-20.500" cy="3" rx="2.600" ry="1.600" fill="#FFFBF1" opacity=".85"/>
<path d="M-31 19C-28 36 -6 38 -2 19Z" fill="#1E2A3A" stroke="#1E2A3A" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="-16" cy="30" rx="8" ry="4.500" fill="#F08AB0"/>
<circle cx="-21" cy="-9" r="5" fill="#1E2A3A"/><circle cx="-19.500" cy="-10.500" r="1.700" fill="#FFFBF1"/>
<circle cx="10" cy="-11" r="5" fill="#1E2A3A"/><circle cx="11.500" cy="-12.500" r="1.700" fill="#FFFBF1"/>
<path d="M-27 34Q0 53 28 33" fill="none" stroke="#1E2A3A" stroke-width="14" stroke-linecap="round"/>
<path d="M-27 34Q0 53 28 33" fill="none" stroke="#6FAF73" stroke-width="8" stroke-linecap="round"/>
<circle cx="0" cy="48" r="6.500" fill="#F2B84B" stroke="#1E2A3A" stroke-width="2.500"/>
</symbol>

<g id="hd-g-stand">
<ellipse cx="116" cy="201" rx="88" ry="13" fill="#1E2A3A" opacity=".16"/>
<path d="M182 116C208 108 222 86 212 62" fill="none" stroke="#1E2A3A" stroke-width="17" stroke-linecap="round"/>
<path d="M182 116C208 108 222 86 212 62" fill="none" stroke="#B9783A" stroke-width="11" stroke-linecap="round"/>
<g fill="#B9783A" stroke="#1E2A3A" stroke-width="3"><rect x="178" y="146" width="24" height="54" rx="12"/><rect x="112" y="146" width="22" height="54" rx="11"/></g>
<g fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"><ellipse cx="190" cy="198" rx="15" ry="7"/><ellipse cx="123" cy="198" rx="14" ry="7"/></g>
<rect x="66" y="94" width="132" height="72" rx="36" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="134" cy="158" rx="40" ry="7" fill="#F6E3C0"/>
<g fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"><rect x="146" y="148" width="26" height="52" rx="13"/><rect x="78" y="142" width="24" height="58" rx="12"/></g>
<g fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"><ellipse cx="159" cy="198" rx="16" ry="7"/><ellipse cx="90" cy="198" rx="15" ry="7"/></g>
<ellipse cx="86" cy="134" rx="26" ry="26" fill="#F6E3C0"/>
</g>

<g id="hd-g-sit">
<ellipse cx="122" cy="201" rx="74" ry="11" fill="#1E2A3A" opacity=".16"/>
<path d="M178 192C202 198 222 190 228 174" fill="none" stroke="#1E2A3A" stroke-width="17" stroke-linecap="round"/>
<path d="M178 192C202 198 222 190 228 174" fill="none" stroke="#B9783A" stroke-width="11" stroke-linecap="round"/>
<ellipse cx="112" cy="130" rx="42" ry="58" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="148" cy="166" rx="46" ry="34" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="172" cy="198" rx="22" ry="8" fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"/>
<rect x="116" y="152" width="22" height="48" rx="11" fill="#B9783A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="127" cy="198" rx="14" ry="7" fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"/>
<rect x="84" y="148" width="24" height="52" rx="12" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="96" cy="198" rx="15" ry="7" fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="98" cy="122" rx="24" ry="32" fill="#F6E3C0"/>
</g>

<g id="hd-g-down">
<ellipse cx="124" cy="201" rx="100" ry="12" fill="#1E2A3A" opacity=".16"/>
<path d="M200 188C216 192 228 188 232 178" fill="none" stroke="#1E2A3A" stroke-width="17" stroke-linecap="round"/>
<path d="M200 188C216 192 228 188 232 178" fill="none" stroke="#B9783A" stroke-width="11" stroke-linecap="round"/>
<rect x="52" y="170" width="68" height="22" rx="11" fill="#B9783A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="140" cy="168" rx="72" ry="32" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="172" cy="180" rx="34" ry="22" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="196" cy="197" rx="18" ry="7" fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"/>
<rect x="34" y="178" width="76" height="22" rx="11" fill="#E8B26A" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="42" cy="189" rx="13" ry="11" fill="#F6E3C0" stroke="#1E2A3A" stroke-width="3"/>
<ellipse cx="102" cy="166" rx="20" ry="18" fill="#F6E3C0"/>
</g>

<symbol id="hd-dog-stand" viewBox="0 0 240 220"><use href="#hd-g-stand"/><use href="#hd-head" x="12" y="24" width="140" height="120"/></symbol>
<symbol id="hd-dog-sit" viewBox="0 0 240 220"><use href="#hd-g-sit"/><use href="#hd-head" x="36" y="6" width="140" height="120"/></symbol>
<symbol id="hd-dog-sit-open" viewBox="0 0 240 220"><use href="#hd-g-sit"/><use href="#hd-head-open" x="36" y="6" width="140" height="120"/></symbol>
<symbol id="hd-dog-down" viewBox="0 0 240 220"><use href="#hd-g-down"/><use href="#hd-head" x="12" y="72" width="140" height="120"/></symbol>
</defs>
</svg>`;
