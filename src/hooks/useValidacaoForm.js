import { useState } from 'react'

// ============================================================
// useValidacaoForm
// Hook customizado que encapsula a lógica de validação com Yup.
//
// Recebe um schema Yup e devolve três utilitários:
//   - errosForm   → objeto { campo: mensagem } com os erros atuais
//   - validar     → função assíncrona que valida os dados e retorna
//                   true (válido) ou false (inválido com erros setados)
//   - limparCampo → limpa o erro de um campo específico ao digitar
//
// Uso:
//   const schema = Yup.object({ email: Yup.string().email()... })
//   const { errosForm, validar, limparCampo } = useValidacaoForm(schema)
//   const ok = await validar({ email, senha })
//   if (!ok) return
// ============================================================
export function useValidacaoForm(schema) {
  // Objeto que mapeia cada campo ao seu erro atual.
  // Começa vazio — erros só aparecem após a primeira tentativa de submit.
  const [errosForm, setErrosForm] = useState({})

  // Valida `dados` contra o schema Yup recebido.
  // abortEarly: false → coleta TODOS os erros de uma vez, não para no primeiro.
  // Retorna true se válido, false se inválido (e seta os erros no estado).
  async function validar(dados) {
    try {
      await schema.validate(dados, { abortEarly: false })
      setErrosForm({})  // limpa erros anteriores se tudo passou
      return true
    } catch (erroValidacao) {
      // erroValidacao.inner é um array de ValidationError do Yup.
      // Cada item tem .path (nome do campo) e .message (texto do erro).
      const erros = {}
      erroValidacao.inner.forEach(err => {
        erros[err.path] = err.message
      })
      setErrosForm(erros)
      return false
    }
  }

  // Remove o erro de um campo quando o usuário começa a corrigir o valor.
  // Evita que a mensagem de erro fique visível enquanto o usuário ainda digita.
  function limparCampo(campo) {
    setErrosForm(prev => ({ ...prev, [campo]: '' }))
  }

  return { errosForm, validar, limparCampo }
}
