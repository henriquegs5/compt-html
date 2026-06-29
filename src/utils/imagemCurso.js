// ============================================================
// utils/imagemCurso.js
// Helpers relacionados à imagem de capa de um curso.
//
// A imagem de um curso pode ser de dois tipos:
//   1. Nome de arquivo (ex: "lol.jpg") — uma das imagens prontas que ficam
//      na pasta public/img e são servidas em /img/<arquivo>.
//   2. Data URL (ex: "data:image/png;base64,....") — uma imagem que o
//      usuário importou do computador e que guardamos em base64.
// ============================================================

// Lista das imagens de capa já disponíveis em public/img.
// Como o navegador não consegue listar uma pasta do servidor em tempo de
// execução, mantemos essa lista manualmente: ao adicionar um arquivo novo
// em public/img, inclua o nome dele aqui para aparecer no seletor.
export const IMAGENS_CURSO = [
  'fortnite.jpg',
  'lol.jpg',
  'rainbow.jpg',
  'clash.jpg',
]

// Resolve o endereço (src) da imagem de um curso para usar no <img>:
//   - data URL (base64) → usa o próprio texto direto
//   - nome de arquivo   → aponta para a pasta pública /img
//   - vazio/indefinido  → cai no logo como imagem padrão
export function srcImagemCurso(imagem) {
  if (!imagem) return '/img/logo.png'
  return imagem.startsWith('data:') ? imagem : `/img/${imagem}`
}
