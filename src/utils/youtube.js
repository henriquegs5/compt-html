// ============================================================
// utils/youtube.js
// Converte um link do YouTube na URL de "embed" usada pelo <iframe>.
//
// O usuário pode colar o link em vários formatos:
//   - https://www.youtube.com/watch?v=ABC123
//   - https://youtu.be/ABC123
//   - https://www.youtube.com/embed/ABC123
//   - https://www.youtube.com/shorts/ABC123
// De todos eles precisamos extrair só o ID do vídeo (11 caracteres) e
// montar a URL que o player embutido entende.
// ============================================================

// Extrai o ID do vídeo a partir do link. Retorna null se não for YouTube.
export function youtubeVideoId(url) {
  if (!url) return null
  // A regex cobre os formatos watch?v=, youtu.be/, embed/ e shorts/.
  // [\w-]{11} é o padrão de um ID de vídeo do YouTube.
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  )
  return match ? match[1] : null
}

// Retorna a URL pronta para o <iframe>, ou null se o link não for do YouTube.
export function youtubeEmbedUrl(url) {
  const id = youtubeVideoId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

// Retorna a URL da miniatura (thumbnail) do vídeo, ou null se não for YouTube.
// Usamos hqdefault.jpg porque ela existe para todo vídeo (480x360). A
// maxresdefault.jpg tem mais qualidade, mas nem todo vídeo a possui (dá 404).
export function youtubeThumbnail(url) {
  const id = youtubeVideoId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
