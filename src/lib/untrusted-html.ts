/**
 * User-authored strings (nombres, descripciones, listas) must be rendered as
 * plain text. Strip angle brackets so a stored payload cannot become markup if
 * a caller later interpolates the value into HTML.
 *
 * Prefer single-character removal over tag-stripping regexes: one-pass
 * `/<\/?[^>]*>/` is incomplete against nested payloads like `<scr<script>ipt>`
 * (CodeQL js/incomplete-multi-character-sanitization).
 */
export const toUntrustedPlainText = (value: string): string =>
  value.replace(/[<>]/g, '')
