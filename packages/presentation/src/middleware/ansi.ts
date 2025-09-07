import type { OutputPipeline } from '@/output-pipeline'
import type { BaseClient } from '@stratamu/types'

// --- UTF-8 pipeline ---

// Replace non-ASCII or control chars with '?'
const stripDiacriticsAndNonAscii = (text: string): string => {
  const normalized = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const chars: string[] = []
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i)
    chars.push(code >= 0x20 && code <= 0x7e ? normalized[i] : '?')
  }
  return chars.join('')
}

const utf8PipelineCache = new Map<boolean, OutputPipeline>()
const buildUtf8Pipeline = (supportsUtf8: boolean): OutputPipeline =>
  supportsUtf8 ? (text) => text : stripDiacriticsAndNonAscii

export const getUtf8Pipeline = (client: BaseClient): OutputPipeline => {
  const supportsUtf8 = client.capabilities?.utf8 ?? true
  if (!utf8PipelineCache.has(supportsUtf8)) {
    utf8PipelineCache.set(supportsUtf8, buildUtf8Pipeline(supportsUtf8))
  }
  return utf8PipelineCache.get(supportsUtf8)!
}

export const utf8Filter = (
  client: BaseClient,
  text: string,
  next: OutputPipeline
): string => next(getUtf8Pipeline(client)(text))

// --- ANSI filter ---

const ANSI_ESCAPE_REGEX =
  // eslint-disable-next-line no-control-regex
  /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b[PX^_].*?\x1b\\|\x1b\][0-9];.*?\x07|\x1b\[\?1049[hl]/g

export const stripAnsi = (text: string): string =>
  text.replace(ANSI_ESCAPE_REGEX, '')

export const ansiFilter = (
  client: BaseClient,
  text: string,
  next: (text: string) => string
): string => next(client.capabilities?.ansi === false ? stripAnsi(text) : text)
