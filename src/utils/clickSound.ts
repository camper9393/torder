/** Global ON/OFF — flip to false later for a settings screen. */
export let clickSoundEnabled = true

export const CLICK_SOUND_SRC = "/sounds/click.wav"
export const CLICK_SOUND_VOLUME = 0.28
export const CLICK_SOUND_MIN_INTERVAL_MS = 90

const INTERACTIVE_SELECTOR = [
  "button:not(:disabled)",
  "a[href]",
  '[role="button"]:not([aria-disabled="true"])',
  'input[type="button"]:not(:disabled)',
  'input[type="submit"]:not(:disabled)',
  'input[type="reset"]:not(:disabled)',
  "summary",
  ".click-sound",
].join(", ")

let audio: HTMLAudioElement | null = null
let lastPlayedAt = 0
let isPlaying = false

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(CLICK_SOUND_SRC)
    audio.volume = CLICK_SOUND_VOLUME
    audio.preload = "auto"
    audio.addEventListener("ended", () => {
      isPlaying = false
    })
  }
  return audio
}

export function setClickSoundEnabled(enabled: boolean): void {
  clickSoundEnabled = enabled
}

export function isClickSoundTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false

  const interactive = target.closest(INTERACTIVE_SELECTOR)
  if (!interactive) return false

  if (interactive.closest("[data-no-click-sound]")) return false

  if (
    interactive instanceof HTMLButtonElement ||
    interactive instanceof HTMLInputElement
  ) {
    if (interactive.disabled) return false
  }

  if (interactive.getAttribute("aria-disabled") === "true") return false

  const tag = interactive.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    const input = interactive as HTMLInputElement
    const type = input.type?.toLowerCase() ?? ""
    if (type !== "button" && type !== "submit" && type !== "reset") {
      return false
    }
  }

  return true
}

export function playClickSound(): void {
  if (!clickSoundEnabled) return
  if (typeof window === "undefined") return

  const now = Date.now()
  if (now - lastPlayedAt < CLICK_SOUND_MIN_INTERVAL_MS) return
  if (isPlaying) return

  lastPlayedAt = now

  try {
    const clip = getAudio()
    clip.currentTime = 0
    isPlaying = true
    void clip.play().catch(() => {
      isPlaying = false
    })
  } catch {
    isPlaying = false
  }
}
