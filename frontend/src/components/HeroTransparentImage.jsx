import { useEffect, useState } from "react"

const SRC = "/hero-model.png"

/** Estimates flat background from corners and masks similar, low-saturation pixels. */
function removeLightBackground(image) {
  const w = image.naturalWidth
  const h = image.naturalHeight
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  const data = ctx.getImageData(0, 0, w, h)
  const p = data.data

  const sample = Math.min(56, Math.floor(Math.min(w, h) / 4))
  let r0 = 0
  let g0 = 0
  let b0 = 0
  let n = 0

  const addRegion = (x0, y0) => {
    const x1 = Math.min(x0 + sample, w)
    const y1 = Math.min(y0 + sample, h)
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4
        r0 += p[i]
        g0 += p[i + 1]
        b0 += p[i + 2]
        n++
      }
    }
  }

  addRegion(0, 0)
  addRegion(w - sample, 0)
  addRegion(0, h - sample)
  addRegion(w - sample, h - sample)

  r0 /= n
  g0 /= n
  b0 /= n

  const hard = 40
  const soft = 82

  for (let i = 0; i < p.length; i += 4) {
    const r = p[i]
    const g = p[i + 1]
    const b = p[i + 2]
    const lum = (r + g + b) / 3
    const sat = Math.max(r, g, b) - Math.min(r, g, b)
    const dr = r - r0
    const dg = g - g0
    const db = b - b0
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)

    // Near-pure white / light gray backdrop (studio white)
    if (lum > 248 && sat < 14 && dist < 45) {
      p[i + 3] = 0
      continue
    }

    if (lum > 236) {
      p[i + 3] = 255
      continue
    }
    if (lum < 42) {
      p[i + 3] = 255
      continue
    }
    if (sat > 30) {
      p[i + 3] = 255
      continue
    }

    if (dist < hard) {
      p[i + 3] = 0
    } else if (dist < soft) {
      p[i + 3] = Math.round((255 * (dist - hard)) / (soft - hard))
    } else {
      p[i + 3] = 255
    }
  }

  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL("image/png")
}

export default function HeroTransparentImage({ className }) {
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      try {
        setDataUrl(removeLightBackground(img))
      } catch {
        setDataUrl(SRC)
      }
    }
    img.onerror = () => setDataUrl(SRC)
    img.src = SRC
  }, [])

  if (!dataUrl) {
    return <div className={className} aria-hidden />
  }

  return <img src={dataUrl} alt="" className={className} draggable={false} />
}
