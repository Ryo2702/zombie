# Reference comparison checklist

The source MP4 was not attached or present in the supplied workspace. No screenshot was inspected from the original video, and visual fidelity to that source is **unverified**. This checklist records the requested comparison timestamps and the implemented specification-derived states. It must not be treated as a completed source comparison.

## Verification status

- [x] Ten phase boundaries cover 0–67 seconds without gaps (automated engine test).
- [x] Supplied vital keyframes remain exact (automated engine test).
- [x] Bite increments the counter at 35.5s; no early spread or declining count (automated engine test).
- [x] Death holds HR 0 from 44–47s and SpO₂ remains unavailable (automated engine test).
- [x] Direct seek reconstructs lights, patient, phase and fracture; seeking backward resets them (automated engine test).
- [x] Reduced effects preserve clinical values and story state (automated engine test).
- [x] Play/pause/end/replay/seek maintain one story RAF callback (fake-RAF lifecycle test).
- [x] Audio requires initialization, clears transient sources on pause/seek, avoids seek backlogs, and disposes sources (mock-WebAudio test).
- [x] Monitor beeps follow the R spike; quarantine siren and outbreak alarms activate in their scene and disappear after seeking to death (mock-WebAudio test).
- [ ] Compare original video framing, monitor geometry, patient position, material texture and lettering at every timestamp below.
- [ ] Compare original video waveform shape, speed, values, alerts, formulas and phase indicators at every timestamp below.
- [ ] Compare original video lighting, glitches, event timing and sound by direct playback.

Browser interaction, responsive layout, full playback and screenshot results are documented separately by the integration QA run. Mock audio tests cannot establish audible quality or browser/device loudness.

## Timestamp comparison queue

The user requested 22 timestamps from 0 to 63 seconds; 67 seconds is included as the final-state acceptance check. Values below are the deterministic implementation output, including intentional interpolation between the supplied keyframes. Every source comparison remains pending.

| Time | Phase / signal | HR | SpO₂ | °C | Infected | Scene / event checks | Source comparison |
|---|---|---:|---:|---:|---:|---|---|
| 0s | HEARTBEAT / ECG II | 072 | 98 | 37.0 | 0001 | Stable green room; paused start; original title; regular ECG. | Pending MP4 |
| 3s | HEARTBEAT / ECG II | 073 | 98 | 37.0 | 0001 | Regular P/QRS/T green ECG; no emergency light. | Pending MP4 |
| 6s | BREATHING / RESP | 075 | 98 | 37.0 | 0001 | Yellow rounded respiration; blanket follows the breath. | Pending MP4 |
| 9s | BREATHING / RESP | 076 | 98 | 37.0 | 0001 | Calm respiration; no red warning wash. | Pending MP4 |
| 12s | PULSE OX / PLETH SpO₂ | 078 | 98 | 37.0 | 0001 | Cyan stepped pleth; oxygen begins its decline. | Pending MP4 |
| 15s | PULSE OX / PLETH SpO₂ | 082 | 93 | 37.0 | 0001 | Cyan pleth instability; oxygen at 93. | Pending MP4 |
| 18s | PULSE OX / PLETH SpO₂ | 085 | 86 | 37.0 | 0001 | SpO₂ LOW; cyan warning burst at 17.5s has released. | Pending MP4 |
| 21s | FEVER / TEMP CORE | 117 | 84 | 40.1 | 0001 | TEMP HIGH; amber stairs; fever warning event. | Pending MP4 |
| 24s | FEVER / TEMP CORE | 128 | 84 | 41.2 | 0001 | High amber staircase; minor warning interference. | Pending MP4 |
| 27s | INCUBATION / GENOME | 132 | 84 | 41.6 | 0001 | Flowing DNA helix; mutation count begins near 02 OF 16. | Pending MP4 |
| 30s | INCUBATION / GENOME | 132 | 84 | 41.6 | 0001 | Mutations progress; red local flashes; green strands. | Pending MP4 |
| 33s | THE BITE / ECG II | 132 | 84 | 41.6 | 0001 | Fast green ECG returns; count still 0001. | Pending MP4 |
| 36s | THE BITE / ECG II | 144 | 71 | 41.6 | 0002 | Bite event completed; count 0002; LEADS OFF briefly visible. | Pending MP4 |
| 39s | THE BITE / ECG II | 093 | 65 | 41.6 | 0002 | Erratic green ECG; count remains 0002. | Pending MP4 |
| 42s | FLATLINE / ECG II | 041 | 58 | 41.6 | 0002 | Declining HR and waveform amplitude; room darkens. | Pending MP4 |
| 45s | FLATLINE / ECG II | 000 | — | 41.6 | 0002 | HR 000; unavailable oxygen; clean flatline; ASYSTOLE and death time 0:43. | Pending MP4 |
| 48s | IT WAKES / ECG II | 070 | — | 36.7 | 0002 | Red abnormal ECG; reanimation headline; eyes and emergency light activate. | Pending MP4 |
| 51s | IT WAKES / ECG II | 188 | — | 31.8 | 0002 | Rapid red ECG; HR 188; colder temperature; count 0002. | Pending MP4 |
| 54s | R₀ > 1 / TRANSMISSION | 188 | — | 31.8 | 0008 | First transmission generation; R₀=3; count 0008. | Pending MP4 |
| 57s | R₀ > 1 / TRANSMISSION | 188 | — | 31.8 | 0080 | Branching generations grow; count 0080; deep red room. | Pending MP4 |
| 60s | OUTBREAK / ECG II | 240 | — | 31.8 | 0308 | Outbreak; HR 240/count 0308; fracture has not started yet (60.4s). | Pending MP4 |
| 63s | OUTBREAK / ECG II | 240 | — | 31.8 | 0308 | Dense red ECG remains beneath complete monitor-glass cracks. | Pending MP4 |
| 67s | OUTBREAK / ECG II | 240 | — | 31.8 | 0308 | Final held outbreak frame; replay visible; count 0308. | Pending MP4 |

## Comparison procedure once the MP4 is available

1. Extract the source at the timestamps above without the platform ending or watermark.
2. Run the development app with `?debug`; pause and seek to the exact same timestamp.
3. Capture the central 576×1024 composition at 1× resolution. The developer export control captures only the signal canvas, so use browser screenshot capture for the full scene.
4. Compare composition first, then reading/signal state, environmental light and effect intensity. Record concrete mismatches before changing animation timings.
5. Replay the complete 67 seconds with audio and compare event onset, flatline hold and final fracture timing.

The fictional equations support the narrative. They are not medical predictions or an infection-risk assessment.
