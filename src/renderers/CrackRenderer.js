import { clamp } from './signals.js';

// Geometry belongs to the recessed monitor glass, in a 440 × 300 viewBox.
export const fracturePaths = [
  { d: 'M326 122 L303 102 L298 76 L280 63 L264 32 L249 0', width: 1.35, delay: 0 },
  { d: 'M326 122 L323 91 L338 63 L337 38 L350 0', width: 1, delay: .015 },
  { d: 'M326 122 L348 102 L354 80 L379 61 L398 30 L431 0', width: 1.6, delay: .02 },
  { d: 'M326 122 L362 121 L377 107 L404 111 L440 97', width: 1.2, delay: .025 },
  { d: 'M326 122 L348 144 L373 149 L391 167 L417 173 L440 195', width: 1.6, delay: .015 },
  { d: 'M326 122 L324 152 L340 176 L336 200 L350 229 L351 263 L366 300', width: 1.2, delay: .03 },
  { d: 'M326 122 L303 147 L306 171 L289 191 L286 222 L266 248 L258 277 L240 300', width: 1.4, delay: .02 },
  { d: 'M326 122 L288 127 L263 144 L231 146 L202 164 L163 166 L116 187 L69 186 L0 209', width: 1.05, delay: .01 },
  { d: 'M326 122 L302 113 L280 111 L251 91 L220 91 L190 69 L153 62 L119 39 L82 31 L38 0', width: .85, delay: .01 },
  { d: 'M326 122 L313 127 L316 140 L329 144 L338 132 L336 119 L326 113 L313 119 L313 127', width: .75, delay: .08 },
  { d: 'M298 76 L318 56 L318 30 M354 80 L381 83 L407 70 M373 149 L368 174 L387 203', width: .6, delay: .12 },
  { d: 'M303 147 L277 158 L274 182 M336 200 L319 226 L322 251 M263 144 L249 167 L217 182', width: .5, delay: .14 },
  { d: 'M251 91 L239 65 L210 48 M163 166 L148 145 L120 143 M350 229 L379 250 L386 273', width: .6, delay: .16 },
  { d: 'M338 132 L346 126 L348 144 M316 140 L315 151 L324 152 M313 119 L302 113', width: .4, delay: .09 },
];

export const crackProgress = (time, delay = 0) => clamp((time - 60.5 - delay) / .23);
