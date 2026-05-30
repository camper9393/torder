/** Short ding WAV as a data URI — generated client-side for HTML5 Audio. */
export function getKitchenDingSrc(): string {
  if (typeof window === "undefined") return ""

  const sampleRate = 22050
  const duration = 0.28
  const frequency = 880
  const numSamples = Math.floor(sampleRate * duration)
  const dataSize = numSamples * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, dataSize, true)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t * 10)
    const sample =
      Math.sin(2 * Math.PI * frequency * t) * envelope * 0.35 +
      Math.sin(2 * Math.PI * frequency * 1.5 * t) * envelope * 0.12
    const intSample = Math.max(-1, Math.min(1, sample))
    view.setInt16(44 + i * 2, intSample * 0x7fff, true)
  }

  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return `data:audio/wav;base64,${btoa(binary)}`
}
