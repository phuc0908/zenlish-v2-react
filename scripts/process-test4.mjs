import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createWriteStream, existsSync } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')

const SOURCE_JSON = join(ROOT, 'zenlish_v2', 'data', 'test4_ets2026.json')
const TARGET_JSON = join(ROOT, 'ets-web', 'public', 'data', 'test4_ets2026.json')
const IMAGE_DIR = join(ROOT, 'ets-web', 'public', 'data', 'image', 'test4')
const IMAGE_MANIFEST = join(ROOT, 'ets-web', 'public', 'data', 'image', 'test4.json')
const MEDIA_DIR = join(ROOT, 'ets-web', 'public', 'media', 'test4_ets2026')

async function downloadFile(url, destPath) {
  if (existsSync(destPath)) {
    return true
  }
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath))
    return true
  } catch (err) {
    console.error(`Failed to download ${url}: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('Reading source file:', SOURCE_JSON)
  const rawContent = await readFile(SOURCE_JSON, 'utf8')
  const data = JSON.parse(rawContent)

  // 1. Format source JSON nicely
  await writeFile(SOURCE_JSON, JSON.stringify(data, null, 2), 'utf8')
  console.log('Formatted source JSON successfully.')

  // Clean up old directories and files if needed
  const { rm } = await import('node:fs/promises')
  // await rm(IMAGE_DIR, { recursive: true, force: true })
  // await rm(MEDIA_DIR, { recursive: true, force: true })
  await rm(IMAGE_MANIFEST, { force: true })

  await mkdir(IMAGE_DIR, { recursive: true })
  await mkdir(MEDIA_DIR, { recursive: true })

  // Collect all image URLs
  const imageUrlMap = new Map() // remote -> local file name
  const audioUrlMap = new Map() // remote -> local file name

  function scanUrls(obj) {
    if (!obj || typeof obj !== 'object') return
    if (Array.isArray(obj)) {
      obj.forEach(scanUrls)
      return
    }

    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        // Unescape common HTML entities before scanning for image URLs
        const unescapedVal = val
          .replaceAll('&lt;', '<')
          .replaceAll('&gt;', '>')
          .replaceAll('&quot;', '"')
          .replaceAll('&#039;', "'")
          .replaceAll('&amp;', '&')

        // Match any image URL in text/HTML
        const imgRegex = /https?:\/\/[^"'\s&<>]+?\.(?:jpg|jpeg|png|webp|gif)/gi
        let match
        while ((match = imgRegex.exec(unescapedVal)) !== null) {
          const url = match[0]
          if (!imageUrlMap.has(url)) {
            const urlPath = new URL(url).pathname
            const ext = urlPath.split('.').pop() || 'jpg'
            const filename = `img_${imageUrlMap.size + 1}.${ext}`
            imageUrlMap.set(url, filename)
          }
        }

        // Find audio URLs
        if ((key === 'audio_url' || key === 'audio_url_source' || key === 'term_audio') && /^https?:\/\//i.test(val)) {
          if (val.includes('DIRECTION-PART-') || val.includes('direction')) {
            // Direction audio mapping
            const filename = val.split('/').pop()
            audioUrlMap.set(val, `media/direction/${filename}`)
          } else {
            if (!audioUrlMap.has(val)) {
              const urlPath = new URL(val).pathname
              const origName = decodeURIComponent(urlPath.split('/').pop())
              const filename = origName.replace(/[^a-zA-Z0-9._-]+/g, '-')
              audioUrlMap.set(val, `media/test4_ets2026/${filename}`)
            }
          }
        }
      } else if (typeof val === 'object') {
        scanUrls(val)
      }
    }
  }

  scanUrls(data)

  console.log(`Found ${imageUrlMap.size} unique image URLs. Downloading...`)
  const manifestItems = []
  for (const [url, filename] of imageUrlMap.entries()) {
    const destPath = join(IMAGE_DIR, filename)
    const relativePath = `data/image/test4/${filename}`
    console.log(`Downloading image: ${url} -> ${filename}`)
    await downloadFile(url, destPath)
    manifestItems.push({
      original_url: url,
      local_path: relativePath,
      filename
    })
  }

  // Save image manifest
  await writeFile(IMAGE_MANIFEST, JSON.stringify(manifestItems, null, 2), 'utf8')
  console.log('Saved image manifest:', IMAGE_MANIFEST)

  console.log(`Found ${audioUrlMap.size} unique audio URLs. Downloading test 4 audio...`)
  for (const [url, localPath] of audioUrlMap.entries()) {
    if (localPath.startsWith('media/test4_ets2026/')) {
      const filename = basename(localPath)
      const destPath = join(MEDIA_DIR, filename)
      console.log(`Downloading audio: ${url} -> ${filename}`)
      await downloadFile(url, destPath)
    }
  }

  // Now replace URLs in the cloned JSON object
  function replaceUrls(obj) {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) {
      return obj.map(replaceUrls)
    }

    const newObj = {}
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        let newVal = val

        // Replace image src in HTML content
        for (const [url, filename] of imageUrlMap.entries()) {
          if (newVal.includes(url)) {
            newVal = newVal.replaceAll(url, `data/image/test4/${filename}`)
          }
        }

        // Replace direct audio/image url strings
        if (imageUrlMap.has(val)) {
          newVal = `data/image/test4/${imageUrlMap.get(val)}`
        } else if (audioUrlMap.has(val)) {
          newVal = audioUrlMap.get(val)
        }

        newObj[key] = newVal
      } else if (typeof val === 'object') {
        newObj[key] = replaceUrls(val)
      } else {
        newObj[key] = val
      }
    }

    // Process questions or groups to attach explicit image_urls array & normalize sub_questions schema
    if (newObj.questions && Array.isArray(newObj.questions)) {
      for (const q of newObj.questions) {
        // Normalize sub_questions format if present
        if (q.sub_questions && Array.isArray(q.sub_questions)) {
          q.sub_questions = q.sub_questions.map((sub) => {
            const rawChoices = sub.choices || sub.answer || []
            const choices = rawChoices.map((c) => ({
              choice: c.choice || '',
              answer: c.answer !== undefined ? c.answer : (c.choice_answer || ''),
              correct: c.correct !== undefined ? c.correct : (c.choice_right_answer === true)
            }))
            const correctChoice = choices.find((c) => c.correct)
            return {
              question: sub.question || sub.title || '',
              choices,
              correct_answer: sub.correct_answer || (correctChoice ? correctChoice.choice : ''),
              explanation_transcript: sub.explanation_transcript || sub.explanation || ''
            }
          })
        }

        const extractedImages = []
        let content = q.content || ''
        const title = q.title || ''
        const fullHtml = content + ' ' + title
        const imgRegex = /data\/image\/test4\/[^"'\s>&]+/gi
        let match
        while ((match = imgRegex.exec(fullHtml)) !== null) {
          let cleanUrl = match[0]
          if (cleanUrl.endsWith('&quot;')) cleanUrl = cleanUrl.slice(0, -6)
          if (!extractedImages.includes(cleanUrl)) {
            extractedImages.push(cleanUrl)
          }
        }
        if (extractedImages.length > 0) {
          q.image_urls = extractedImages
        }

        // Clean content if it only contains <img> tags
        const unescapedContent = content
          .replaceAll('&lt;', '<')
          .replaceAll('&gt;', '>')
          .replaceAll('&quot;', '"')
          .replaceAll('&#039;', "'")
          .replaceAll('&amp;', '&')
        const strippedContent = unescapedContent.replace(/<img[^>]*>/gi, '').trim()
        if (strippedContent.length === 0) {
          q.content = ''
        }
      }
    }

    return newObj
  }

  const processedData = replaceUrls(data)

  // Write processed JSON to public/data/test4_ets2026.json
  await writeFile(TARGET_JSON, JSON.stringify(processedData, null, 2), 'utf8')
  console.log('Saved processed test4 JSON to:', TARGET_JSON)
}

main().catch(console.error)
