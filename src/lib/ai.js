export async function analyzeClothing(base64Image) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
          {
            type: 'text',
            text: 'Analyse ce vetement et reponds UNIQUEMENT en JSON valide sans markdown: { "name": "nom court", "category": "Hauts | Bas | Vestes | Chaussures | Ceintures | Accessoires", "subcategory": "type precis", "colors": ["couleur1"], "style": "casual | smart-casual | formel | sport | streetwear", "season": ["printemps", "ete", "automne", "hiver"], "description": "description courte max 20 mots", "tags": ["tag1"], "brand": "marque si visible sinon null" }'
          }
        ]
      }]
    })
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || '{}'
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

export async function generateOutfits(items, context = {}) {
  const available = items.filter(i => i.status === 'available')
  if (available.length < 2) return []
  const desc = available.map((item, i) =>
    `[${i}] id:${item.id} | ${item.name} (${item.category}/${item.subcategory || ''}, style:${item.style}, couleurs:${item.colors?.join(',')}, saisons:${item.season?.join(',')})`
  ).join('\n')
  const contextStr = [
    context.weather ? `Meteo: ${context.weather.temp}C, ${context.weather.condition}` : '',
    context.occasion ? `Occasion souhaitee: ${context.occasion}` : '',
  ].filter(Boolean).join(' | ')
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: 'Tu es un styliste expert. ' + contextStr + '\n\nGarde-robe disponible:\n' + desc + '\n\nCree 3 tenues coherentes. Reponds UNIQUEMENT en JSON valide sans markdown:\n[\n  {\n    "name": "Nom de la tenue",\n    "occasion": "occasion precise",\n    "vibe": "mot ambiance",\n    "reasoning": "explication courte max 25 mots",\n    "item_ids": ["uuid1", "uuid2"]\n  }\n]'
      }]
    })
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || '[]'
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

export async function getWeather(city) {
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY
  if (!apiKey || !city) return null
  try {
    const res = await fetch(
      'https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&appid=' + apiKey + '&units=metric&lang=fr'
    )
    const data = await res.json()
    if (data.cod !== 200) return null
    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      condition: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
    }
  } catch { return null }
}

export function resizeImage(file, maxSize = 1024) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize }
      else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
