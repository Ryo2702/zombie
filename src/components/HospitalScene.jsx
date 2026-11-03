import { memo } from 'react';
import '../styles/hospital.css';

function HospitalScene({ state }) {
  const light = state?.lighting || {};
  const patient = state?.patient || {};
  const atmosphere = {
    '--room-ambient': light.ambient ?? 1,
    '--emergency': light.red ?? 0,
    '--amber': light.amber ?? 0,
    '--beacon': light.beacon ?? 0,
    '--fluorescent': light.fluorescent ?? 1,
    '--breath': `${(patient.breath || 0) * -2.5}px`,
    '--twitch': `${patient.twitch || 0}px`,
    '--head-turn': `${patient.head || 0}deg`,
    '--eyes': patient.eyes || 0,
  };

  return <>
    <div className="hospital-background" style={atmosphere} aria-hidden="true">
      <svg className="room-structure" viewBox="0 0 576 1024" fill="none">
        <defs>
          <linearGradient id="wall-paint" x1="288" y1="42" x2="288" y2="950" gradientUnits="userSpaceOnUse"><stop stopColor="#39453d"/><stop offset=".36" stopColor="#222e27"/><stop offset="1" stopColor="#0a100d"/></linearGradient>
          <linearGradient id="ceiling-paint" x1="288" y1="0" x2="288" y2="110" gradientUnits="userSpaceOnUse"><stop stopColor="#0a0f0c"/><stop offset="1" stopColor="#3b4940"/></linearGradient>
          <linearGradient id="window-metal" x1="100" y1="120" x2="450" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor="#68776a"/><stop offset=".12" stopColor="#29392f"/><stop offset=".7" stopColor="#141e18"/><stop offset="1" stopColor="#4d5d51"/></linearGradient>
          <linearGradient id="window-glass" x1="288" y1="145" x2="288" y2="410" gradientUnits="userSpaceOnUse"><stop stopColor="#050c08"/><stop offset=".5" stopColor="#112018"/><stop offset="1" stopColor="#020805"/></linearGradient>
          <linearGradient id="metal-pipe" x1="0" x2="1"><stop stopColor="#101712"/><stop offset=".4" stopColor="#65746a"/><stop offset=".65" stopColor="#26362b"/><stop offset="1" stopColor="#0c130e"/></linearGradient>
          <radialGradient id="room-light"><stop stopColor="#b8d8b9" stopOpacity=".2"/><stop offset="1" stopColor="#b8d8b9" stopOpacity="0"/></radialGradient>
          <radialGradient id="red-room-light"><stop stopColor="#fa2947" stopOpacity=".65"/><stop offset=".36" stopColor="#be132d" stopOpacity=".24"/><stop offset="1" stopColor="#84051e" stopOpacity="0"/></radialGradient>
          <radialGradient id="amber-room-light"><stop stopColor="#ffba51" stopOpacity=".3"/><stop offset="1" stopColor="#ba7732" stopOpacity="0"/></radialGradient>
          <filter id="wall-grime"><feTurbulence type="fractalNoise" baseFrequency=".035 .06" numOctaves="3" seed="67"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" mode="multiply"/></filter>
          <filter id="lamp-blur"><feGaussianBlur stdDeviation="9"/></filter>
          <pattern id="wall-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".5" fill="#d0ddc8" fillOpacity=".08"/></pattern>
        </defs>
        <rect width="576" height="1024" fill="url(#wall-paint)"/>
        <path d="M0 0H576V50L503 90H73L0 50Z" fill="url(#ceiling-paint)"/>
        <path d="M0 5L109 90M576 5L467 90M112 0L175 90M464 0L401 90M220 0L243 90M356 0L333 90M0 51H576M59 82H517" stroke="#101a13" strokeWidth="3"/>
        <path d="M0 54L75 96H501L576 54M75 96V1024M501 96V1024" stroke="#526252" strokeOpacity=".25"/>
        <path d="M7 54L71 93V1024H0V54Z" fill="#0b130e" fillOpacity=".5"/>
        <path d="M569 54L505 93V1024H576V54Z" fill="#0b130e" fillOpacity=".5"/>
        <path d="M0 422H576M0 427H576M0 667H576M0 672H576" stroke="#0b140d" strokeWidth="3"/>
        <path d="M0 419H576M0 664H576M73 97H503" stroke="#7a8b75" strokeOpacity=".18"/>
        <path d="M22 112V1024M554 112V1024" stroke="#000" strokeOpacity=".45" strokeWidth="12"/>
        <path d="M21 112V1024M553 112V1024" stroke="url(#metal-pipe)" strokeWidth="9"/>
        <path d="M15 352H28M15 659H28M547 352H560M547 659H560" stroke="#5c6c5e" strokeWidth="6"/>
        <path d="M111 112L109 139L102 146L106 162M473 463L465 486L469 501L457 516M42 581L50 596L43 605M529 233L521 250L526 270" stroke="#060e08" strokeOpacity=".7" strokeWidth="1.5"/>
        <path d="M121 98V129M156 101V140M464 99V126M475 106V145M38 431V481M538 430V500" stroke="#09120c" strokeOpacity=".3" strokeWidth="5"/>
        <ellipse cx="288" cy="200" rx="310" ry="250" fill="url(#room-light)"/>
        <rect x="47" y="123" width="482" height="311" rx="4" fill="#060c08" stroke="#030805" strokeWidth="7"/>
        <rect x="52" y="127" width="472" height="300" rx="2" fill="url(#window-metal)" stroke="#768775" strokeOpacity=".25"/>
        <rect x="63" y="139" width="450" height="275" fill="url(#window-glass)" stroke="#000" strokeWidth="3"/>
        <path d="M68 142H509M65 410H511" stroke="#9eafa0" strokeOpacity=".15"/>
        <path d="M174 140V414M401 140V414" stroke="#294031" strokeOpacity=".32" strokeWidth="5"/>
        <path d="M76 143H220L167 164H65ZM435 143H503V150L397 160Z" fill="#acc7ad" fillOpacity=".065"/>
        <path d="M72 176L159 166M435 170L502 161" stroke="#c0d0bc" strokeOpacity=".06" strokeWidth="2"/>
        <path d="M60 130H516M55 130V424" stroke="#a8b99f" strokeOpacity=".12"/>
        {[59,517].map(x => [134,420].map(y => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="2.4" fill="#101a13"/><path d={`M${x-1.5} ${y}h3`} stroke="#7c8d79" strokeOpacity=".5"/></g>))}
        <g className="observation-shadow"><path d="M413 292C415 264 428 255 440 255C458 255 465 274 465 294L483 323L486 414H392L396 327Z" fill="#000"/><ellipse cx="439" cy="237" rx="19" ry="25" fill="#000"/></g>
        <g opacity=".6"><rect x="31" y="470" width="20" height="62" rx="2" fill="#16231a" stroke="#52604e"/><rect x="35" y="478" width="12" height="18" fill="#080f0a"/><circle cx="41" cy="488" r="2" fill="#89977b"/><path d="M37 509H45M37 515H45M37 521H45" stroke="#68765e"/></g>
        <g opacity=".45"><rect x="526" y="470" width="21" height="85" fill="#354031" stroke="#627058"/><path d="M531 478H542M531 483H542M531 488H542M531 493H542M531 498H542M531 503H542M531 508H542M531 513H542M531 518H542M531 523H542M531 528H542M531 533H542M531 538H542M531 543H542" stroke="#070f09" strokeWidth="2"/></g>
        <rect width="576" height="1024" fill="url(#wall-dots)"/>
        <rect width="576" height="1024" opacity=".09" filter="url(#wall-grime)" style={{mixBlendMode:'soft-light'}}/>
        <g className="room-amber"><ellipse cx="288" cy="590" rx="300" ry="310" fill="url(#amber-room-light)"/></g>
        <g className="room-red"><ellipse cx="288" cy="113" rx="430" ry="600" fill="url(#red-room-light)"/><path d="M0 82L71 108V1024H0ZM576 82L505 108V1024H576Z" fill="#be1932" fillOpacity=".14"/><path d="M47 127H529M47 127V434M529 127V434" stroke="#eb3750" strokeOpacity=".35" strokeWidth="2"/></g>
        <path d="M0 1024L122 718H454L576 1024" fill="#080e0a"/>
        <rect x="253" y="714" width="70" height="97" fill="#151f18" stroke="#3b493e"/>
        <path d="M267 732H309V809H267Z" fill="url(#metal-pipe)"/><path d="M240 806H336L350 821H226Z" fill="#29352c"/>
      </svg>
      <div className="ward-sign">WARD <strong>67</strong><small>ISOLATION UNIT</small></div>
      <div className="quarantine-sign">QUARANTINE<small>AUTHORIZED PERSONNEL ONLY</small></div>
      <div className="quarantine-beacon"><i/><span/><b/></div>
      <div className="fluorescent fluorescent-left"><i/><i/><span/></div>
      <div className="fluorescent fluorescent-right"><i/><i/><span/></div>
      <div className="room-darkness"/>
    </div>
    <div className="patient-layer" style={atmosphere} aria-hidden="true">
      <svg viewBox="0 0 576 1024" fill="none">
        <defs>
          <linearGradient id="sheet-color" x1="209" y1="828" x2="355" y2="1024" gradientUnits="userSpaceOnUse"><stop stopColor="#738174"/><stop offset=".28" stopColor="#a1ac97"/><stop offset=".62" stopColor="#6a7765"/><stop offset="1" stopColor="#3e4a3c"/></linearGradient>
          <linearGradient id="sheet-side" x1="91" y1="900" x2="251" y2="950" gradientUnits="userSpaceOnUse"><stop stopColor="#1b281d"/><stop offset=".55" stopColor="#64725c"/><stop offset="1" stopColor="#9caa8b"/></linearGradient>
          <linearGradient id="rail-steel" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#101b13"/><stop offset=".25" stopColor="#435344"/><stop offset=".48" stopColor="#9ba98f"/><stop offset=".6" stopColor="#5c6e57"/><stop offset=".8" stopColor="#1b291d"/><stop offset="1" stopColor="#0a130c"/></linearGradient>
          <linearGradient id="skin-color" x1="265" y1="780" x2="311" y2="840" gradientUnits="userSpaceOnUse"><stop stopColor="#66725b"/><stop offset=".38" stopColor="#95a083"/><stop offset=".7" stopColor="#5c6b50"/><stop offset="1" stopColor="#2a3929"/></linearGradient>
          <radialGradient id="face-shadow" cx=".4" cy=".3" r=".7"><stop stopColor="#7c8e70" stopOpacity="0"/><stop offset="1" stopColor="#061009" stopOpacity=".9"/></radialGradient>
          <linearGradient id="strap-leather" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#111810"/><stop offset=".25" stopColor="#263025"/><stop offset=".7" stopColor="#111b12"/><stop offset="1" stopColor="#040b06"/></linearGradient>
          <radialGradient id="patient-red"><stop stopColor="#dc1936" stopOpacity=".55"/><stop offset="1" stopColor="#9b0a25" stopOpacity=".08"/></radialGradient>
          <filter id="eye-bloom"><feGaussianBlur stdDeviation="3"/></filter>
          <pattern id="cloth-weave" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0H4M0 2H4" stroke="#000" strokeOpacity=".09" strokeWidth=".5"/><path d="M1 0V4M3 0V4" stroke="#fff" strokeOpacity=".035" strokeWidth=".5"/></pattern>
          <clipPath id="body-clip"><path d="M253 835C223 826 200 836 185 860L160 922L121 1024H455L415 921L391 861C376 838 353 826 322 835Z"/></clipPath>
        </defs>
        <path d="M137 763L85 1024H491L439 763Z" fill="#07100a" stroke="#202f22" strokeWidth="6"/>
        <path d="M165 791L106 1024H470L411 791Z" fill="#4b5b47" stroke="#152319" strokeWidth="4"/>
        <path d="M190 795C225 771 346 771 385 795L397 853C354 869 228 868 177 852Z" fill="#56664e" stroke="#233320" strokeWidth="3"/>
        <path d="M196 802C226 787 352 785 378 802M191 843L210 815M385 844L367 816" stroke="#839075" strokeOpacity=".28" strokeWidth="2"/>
        <g className="patient-head">
          <path d="M268 823L263 852C277 864 305 864 318 851L312 821Z" fill="#4a5c41"/>
          <ellipse cx="259" cy="806" rx="6" ry="12" fill="#3d5037"/><ellipse cx="316" cy="806" rx="6" ry="12" fill="#354830"/>
          <path d="M263 784C273 772 301 770 312 786L316 809L310 828L298 839H280L267 827L260 808Z" fill="url(#skin-color)"/>
          <path d="M260 800C255 781 268 769 286 769C307 768 321 782 316 803L309 791L298 787L276 790L265 797Z" fill="#111e13"/>
          <path d="M265 801L278 799L283 804M295 804L302 800L312 801" stroke="#21321f" strokeWidth="4"/>
          <path d="M286 800L282 817L288 819L294 816" stroke="#233a23" strokeWidth="2"/>
          <path d="M278 825L288 824L299 823" stroke="#263323" strokeWidth="2"/>
          <path d="M269 811L277 815M301 815L308 811M278 830L289 834L299 829" stroke="#344d2f" strokeWidth="2"/>
          <path d="M263 784C273 772 301 770 312 786L316 809L310 828L298 839H280L267 827L260 808Z" fill="url(#face-shadow)"/>
          <g className="patient-eyes"><ellipse cx="275" cy="805" rx="7" ry="3" fill="#ff183e" filter="url(#eye-bloom)"/><ellipse cx="302" cy="805" rx="7" ry="3" fill="#ff183e" filter="url(#eye-bloom)"/><path d="M270 804L279 805M298 805L307 804" stroke="#ff5165" strokeWidth="2"/><circle cx="275" cy="805" r="1" fill="#ffe2dd"/><circle cx="302" cy="805" r="1" fill="#ffe2dd"/></g>
        </g>
        <g className="patient-body">
          <path d="M253 835C223 826 200 836 185 860L160 922L121 1024H455L415 921L391 861C376 838 353 826 322 835Z" fill="url(#sheet-color)"/>
          <path d="M253 835L231 862L224 917L207 956L194 1024H121L160 922L185 860C200 836 223 826 253 835Z" fill="url(#sheet-side)"/>
          <path d="M322 835L345 865L352 917L368 957L382 1024H455L415 921L391 861C376 838 353 826 322 835Z" fill="#1c2b1e" fillOpacity=".3"/>
          <path d="M247 838C263 849 309 851 330 839L343 856C314 871 261 871 235 857Z" fill="#b1baa2" fillOpacity=".45"/>
          <path d="M237 854C268 865 310 863 340 852" stroke="#344a31" strokeWidth="2"/>
          <path d="M223 854L206 899L217 884L226 886L236 863M348 859L363 899L358 876M246 878L256 905L260 944L269 963L264 912M323 877L311 910L316 951M231 921L214 957L227 949L233 974L239 953M348 922L369 969L349 955L356 1001M295 941L279 985L288 973L298 1015M177 945L159 985L179 977L166 1024M398 945L419 986L399 975L411 1024" fill="#233a26" fillOpacity=".34"/>
          <path d="M231 868L224 899M248 881L261 922M331 880L323 921M229 939L218 964M354 942L370 978M288 965L281 990M176 966L163 997M393 959L409 996" stroke="#d3dbc1" strokeOpacity=".2" strokeWidth="2"/>
          <rect x="120" y="830" width="336" height="194" fill="url(#cloth-weave)" clipPath="url(#body-clip)"/>
          <path d="M170 897Q288 923 407 896L416 920Q288 946 160 920Z" fill="#000" fillOpacity=".35"/>
          <path d="M172 888Q288 916 403 889L412 912Q288 940 163 912Z" fill="url(#strap-leather)" stroke="#09150b" strokeWidth="2"/>
          <path d="M176 892Q288 919 400 893M168 908Q288 935 408 909" stroke="#70805f" strokeOpacity=".23" strokeDasharray="3 3"/>
          <path d="M204 898L225 902L222 923L201 919Z" fill="url(#rail-steel)" stroke="#b9c0a7" strokeOpacity=".35" strokeWidth="2"/><path d="M210 905L219 907L217 916L208 914Z" fill="#111e13"/><path d="M214 904L211 917" stroke="#abb99a" strokeWidth="2"/>
          <path d="M145 977Q288 999 433 976L443 1008Q288 1030 133 1008Z" fill="url(#strap-leather)" stroke="#0a140b" strokeWidth="2"/>
          <path d="M148 981Q288 1003 430 980M139 1003Q288 1025 438 1003" stroke="#75846b" strokeOpacity=".22" strokeDasharray="3 3"/>
          <path d="M345 988L373 985L376 1012L347 1015Z" fill="url(#rail-steel)" stroke="#a0ae91" strokeOpacity=".5" strokeWidth="2"/><path d="M352 994L367 992L368 1006L353 1008Z" fill="#101a11"/><path d="M350 1001L371 998" stroke="#a7b49b" strokeWidth="2"/>
          <path d="M208 855C193 860 180 877 176 892L157 941L146 953L149 968L160 971L170 962L186 927L199 897" fill="#718065" stroke="#34482f" strokeWidth="2"/>
          <path d="M369 856C385 863 395 876 401 897L418 944L431 957L426 972L416 974L406 965L390 928L376 898" fill="#5b7152" stroke="#2a4026" strokeWidth="2"/>
          <path d="M161 932L181 938L175 952L154 946Z" fill="#152317" stroke="#879576" strokeWidth="1.5"/><path d="M396 938L416 931L423 946L402 952Z" fill="#152317" stroke="#879576" strokeWidth="1.5"/>
          <path d="M160 939L128 948M415 939L450 949" stroke="#263525" strokeWidth="7"/>
        </g>
        <path d="M120 805L48 1024M455 805L528 1024" stroke="#071009" strokeWidth="23"/>
        <path d="M120 805L48 1024M455 805L528 1024" stroke="url(#rail-steel)" strokeWidth="14"/>
        <path d="M118 805L46 1024M453 805L526 1024" stroke="#a0ad95" strokeOpacity=".35" strokeWidth="2"/>
        <path d="M128 776L71 1018M448 776L505 1018" stroke="#0a120b" strokeWidth="14"/>
        <path d="M128 776L71 1018M448 776L505 1018" stroke="url(#rail-steel)" strokeWidth="9"/>
        <path d="M118 820L109 849M97 898L86 935M78 978L65 1024M457 820L467 849M479 898L489 935M498 978L512 1024" stroke="url(#rail-steel)" strokeWidth="8"/>
        <path d="M128 776L120 805M448 776L455 805" stroke="#6c7e64" strokeWidth="9"/>
        <path d="M51 644C8 711 52 779 106 816C146 846 111 911 153 960" stroke="#010704" strokeWidth="9"/>
        <path d="M51 644C8 711 52 779 106 816C146 846 111 911 153 960" stroke="#384631" strokeWidth="4"/>
        <path d="M524 622C573 696 526 765 470 807C449 825 453 861 471 883C496 912 476 948 425 961" stroke="#040b06" strokeWidth="8"/>
        <path d="M524 622C573 696 526 765 470 807C449 825 453 861 471 883C496 912 476 948 425 961" stroke="#4a5740" strokeWidth="2"/>
        <g className="patient-emergency"><ellipse cx="288" cy="843" rx="246" ry="230" fill="url(#patient-red)" style={{mixBlendMode:'color'}}/><path d="M118 805L46 1024M453 805L526 1024" stroke="#ff5062" strokeOpacity=".5" strokeWidth="2"/></g>
        <path d="M0 1024V758L71 790L119 1024ZM576 1024V758L505 790L457 1024Z" fill="#020805" fillOpacity=".4"/>
      </svg>
      <div className="patient-darkness"/>
    </div>
  </>;
}

export default memo(HospitalScene);
