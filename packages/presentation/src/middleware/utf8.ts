import type { BaseClient, OutputPipeline } from '@stratamu/types'

const COMBINING_MARKS = /[\u0300-\u036f]/g
const NON_ASCII = /[^\x20-\x7e]/g

// Remove diacritics (e.g., á -> a) and replace remaining non-ASCII/control chars with '?'.
const stripDiacriticsAndNonAscii: OutputPipeline = (text): Promise<string> =>
  Promise.resolve(
    text.normalize('NFKD').replace(COMBINING_MARKS, '').replace(NON_ASCII, '?')
  )

const identity: OutputPipeline = (text): Promise<string> =>
  Promise.resolve(text)

const utf8PipelineCache = new Map<boolean, OutputPipeline>()
const buildUtf8Pipeline = (supportsUtf8: boolean): OutputPipeline =>
  supportsUtf8 ? identity : stripDiacriticsAndNonAscii

export const getUtf8Pipeline = (client: BaseClient): OutputPipeline => {
  const supportsUtf8 = client.capabilities?.utf8 ?? true
  return (
    utf8PipelineCache.get(supportsUtf8) ??
    utf8PipelineCache
      .set(supportsUtf8, buildUtf8Pipeline(supportsUtf8))
      .get(supportsUtf8)!
  )
}

export const utf8Filter = async (
  client: BaseClient,
  text: string,
  next: OutputPipeline
): Promise<string> => {
  const processed = await getUtf8Pipeline(client)(text)
  return next(processed)
}
