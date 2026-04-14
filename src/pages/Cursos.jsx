// ============================================================
// Cursos.jsx
// Tela inicial após o login — exibe todos os cursos disponíveis
// em cards. Ao clicar em "Abrir curso" o usuário é levado para
// a página de módulos daquele curso específico.
//
// Funcionalidade de admin/moderador:
//   No final da grade existe um card extra com "+" centralizado.
//   Esse card só aparece para usuários com role "admin" ou
//   "moderador". Ao clicar, abre um modal com um formulário
//   que permite cadastrar um novo curso no json-server.
// ============================================================

// useState → cria "variáveis reativas" no componente (quando mudam, re-renderiza)
// useEffect → executa código em momentos específicos (ex: ao montar o componente)
import { useEffect, useState } from 'react'

// useDispatch → envia ações para o Redux (ex: disparar um thunk)
// useSelector → lê pedaços do estado global do Redux
import { useDispatch, useSelector } from 'react-redux'

// useNavigate → troca de rota sem recarregar a página (navegação SPA)
import { useNavigate } from 'react-router-dom'

// Importa os thunks que vão interagir com o json-server
import { fetchCursos, adicionarCurso, editarCurso, excluirCurso } from '../store/cursosSlice'

// Layout envolve a página com topbar + sidebar
import Layout from '../components/Layout'

// Modal — componente reutilizável usado aqui para mostrar o formulário
import Modal from '../components/Modal'

import './Cursos.css'

export default function Cursos() {
  // dispatch é a função que dispara ações/thunks para o Redux
  const dispatch = useDispatch()

  // navigate é a função que faz a troca de URL sem recarregar o site
  const navigate = useNavigate()

  // Lê do estado global do Redux:
  //   items  → lista de cursos já carregados da API
  //   status → 'idle' | 'loading' | 'succeeded' | 'failed'
  // useSelector "observa" essas propriedades: sempre que elas mudam,
  // o componente re-renderiza automaticamente.
  const { items, status } = useSelector(s => s.cursos)

  // Pega o usuário logado (contém uid, name, email e role)
  const usuario = useSelector(s => s.auth.usuario)

  // Define se o usuário tem permissão para adicionar cursos.
  // Usamos ?. para evitar erro caso "usuario" seja null (não logado).
  // Cliente não pode; só admin e moderador veem o card "+".
  const podeAdicionar = usuario?.role === 'admin' || usuario?.role === 'moderador'

  // ---- Estado local do componente (não vai para o Redux) ----

  // Controla a abertura/fechamento do modal de criação/edição de curso.
  // true  = modal visível na tela
  // false = modal escondido
  const [modalAberto, setModalAberto] = useState(false)

  // Guarda o id do curso que está sendo editado.
  // null  = modal está em modo de CRIAÇÃO (não há curso selecionado)
  // "ID"  = modal está em modo de EDIÇÃO daquele curso específico
  // Esse mesmo modal é reaproveitado para ambos os casos (criar e editar).
  const [cursoEditandoId, setCursoEditandoId] = useState(null)

  // Guarda os valores digitados no formulário do modal.
  // Começa com todos os campos vazios/zerados.
  // Conforme o usuário digita, atualizamos este objeto via handleChange.
  const [novoCurso, setNovoCurso] = useState({
    titulo: '',
    descricao: '',
    imagem: '',
    totalModulos: 0,
  })

  // useEffect roda automaticamente quando:
  //   - o componente é montado pela primeira vez
  //   - qualquer valor da lista de dependências [dispatch, status] mudar
  //
  // Aqui ele dispara fetchCursos apenas se o status for "idle" (ainda
  // não buscamos). Isso evita requisições duplicadas se o usuário
  // voltar para esta página várias vezes.
  useEffect(() => {
    if (status === 'idle') dispatch(fetchCursos())
  }, [dispatch, status])

  // ---- Funções do modal/formulário ----

  // Abre o modal em modo de CRIAÇÃO.
  // Chamada quando o admin/moderador clica no card "+".
  function abrirModal() {
    // Reseta o estado do formulário para um objeto "em branco"
    setNovoCurso({ titulo: '', descricao: '', imagem: '', totalModulos: 0 })
    // Sem id → modo criação
    setCursoEditandoId(null)
    // Marca o modal como aberto → o React re-renderiza e mostra ele na tela
    setModalAberto(true)
  }

  // Abre o modal em modo de EDIÇÃO com os dados do curso já preenchidos.
  // Chamada quando o admin/moderador clica em "Editar" em um card.
  //
  // Recebe o objeto do curso todo (curso) e popula o formulário com
  // os valores atuais. Também guarda o id para saber qual curso atualizar
  // quando o usuário clicar em "Salvar".
  function abrirModalEdicao(curso) {
    setNovoCurso({
      titulo: curso.titulo,
      descricao: curso.descricao,
      imagem: curso.imagem,
      totalModulos: curso.totalModulos,
    })
    // Guarda o id — é isso que diferencia "criação" de "edição"
    setCursoEditandoId(curso.id)
    setModalAberto(true)
  }

  // Atualiza o estado do formulário conforme o usuário digita.
  // Usamos o mesmo handler para todos os campos — o "name" do input
  // nos diz qual propriedade do objeto atualizar.
  //
  // Como funciona:
  //   e.target.name  → nome do input (ex: "titulo")
  //   e.target.value → texto digitado
  //   spread "...prev" → copia os outros campos como estão
  //   [name]: value   → sobrescreve apenas o campo alterado
  function handleChange(e) {
    const { name, value } = e.target
    setNovoCurso(prev => ({ ...prev, [name]: value }))
  }

  // Dispara quando o usuário clica em "Salvar curso".
  // e.preventDefault() impede o comportamento padrão do <form> de
  // recarregar a página ao enviar.
  function handleSubmit(e) {
    e.preventDefault()

    // Validação mínima — título e descrição são obrigatórios.
    // .trim() remove espaços em branco do começo e do fim,
    // evitando que o usuário "burle" o required digitando só espaços.
    if (!novoCurso.titulo.trim() || !novoCurso.descricao.trim()) {
      alert('Preencha o título e a descrição do curso.')
      return
    }

    // Decide qual thunk disparar baseado no modo do modal:
    //   - cursoEditandoId === null → estamos CRIANDO um curso novo
    //   - cursoEditandoId tem valor → estamos EDITANDO um curso existente
    if (cursoEditandoId) {
      // Edição: envia PATCH com o id + novos dados
      dispatch(editarCurso({ id: cursoEditandoId, ...novoCurso }))
    } else {
      // Criação: envia POST com os dados do novo curso
      dispatch(adicionarCurso(novoCurso))
    }

    // Fecha o modal após enviar. O ideal seria só fechar APÓS a
    // confirmação da API, mas para simplificar já fechamos aqui.
    setModalAberto(false)
  }

  // Exclui o curso que está aberto no modal de edição.
  // Pede confirmação via window.confirm() para evitar exclusões acidentais
  // — se o usuário clicar "Cancelar" a função sai sem fazer nada.
  function handleExcluir() {
    if (!cursoEditandoId) return // segurança: só exclui em modo edição
    const confirmar = window.confirm(
      'Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.'
    )
    if (!confirmar) return

    // Dispara o DELETE — o reducer remove o curso da grade automaticamente
    dispatch(excluirCurso(cursoEditandoId))
    // Fecha o modal já que o curso não existe mais
    setModalAberto(false)
  }

  return (
    <Layout>
      {/* Títulos da página */}
      <h1 className="title">Cursos Disponíveis</h1>
      <p className="subtitle">Escolha um curso para ver os módulos</p>
      <input type="text" className="page-search" placeholder="Pesquisar curso..." />

      {/* Exibe mensagem de carregamento enquanto os dados chegam da API */}
      {status === 'loading' && <p className="loading-msg">Carregando cursos...</p>}

      {/* Grade de cards — um card por curso */}
      <div className="cursos-grid">
        {/* items.map percorre o array de cursos e gera um card para cada um.
            A prop "key" é obrigatória no React para listas — ela ajuda o
            React a identificar cada item e atualizar só o que mudou. */}
        {items.map(curso => (
          <div className="curso-card" key={curso.id}>

            {/* Área da imagem de capa do curso */}
            <div className="curso-image">
              <img
                src={`/img/${curso.imagem}`}
                alt={curso.titulo}
                // Se a imagem não existir no servidor, escondemos o <img>
                // para não aparecer aquele ícone quebrado do navegador.
                onError={e => e.target.style.display = 'none'}
              />
              {/* Gradiente escuro sobre a imagem para melhorar leitura do texto */}
              <div className="curso-overlay" />
            </div>

            {/* Botão "Editar" no canto superior direito da imagem.
                Só aparece para admin/moderador — cliente normal não vê.
                O stopPropagation evita que o clique "vaze" para elementos pai. */}
            {podeAdicionar && (
              <button
                className="btn-editar-curso"
                onClick={() => abrirModalEdicao(curso)}
                title="Editar curso"
              >
                {/* Emoji de lápis como ícone de edição */}
                ✏️
              </button>
            )}

            {/* Corpo do card: título, descrição e rodapé */}
            <div className="curso-body">
              <h2 className="curso-titulo">{curso.titulo}</h2>
              <p className="curso-descricao">{curso.descricao}</p>

              <div className="curso-footer">
                {/* Mostra quantos módulos o curso tem */}
                <span className="curso-modulos-count">
                  {curso.totalModulos} módulos
                </span>

                {/* Ao clicar, navega para /cursos/[id do curso]
                    ex: /cursos/1 → módulos do Fortnite */}
                <button
                  className="btn-abrir-curso"
                  onClick={() => navigate(`/cursos/${curso.id}`)}
                >
                  Abrir curso
                </button>
              </div>
            </div>

          </div>
        ))}

        {/* Card extra de "Adicionar curso".
            Renderização condicional: o JavaScript entende
            "expressão && JSX" como "só renderiza se a expressão for true".
            Se podeAdicionar for false (cliente comum), nada é renderizado. */}
        {podeAdicionar && (
          <button
            type="button"
            // Usa as mesmas classes do curso-card para manter o tamanho,
            // mais a classe "--adicionar" que aplica o estilo tracejado
            className="curso-card curso-card--adicionar"
            onClick={abrirModal}
            // "title" aparece como tooltip ao passar o mouse em cima
            title="Adicionar novo curso"
          >
            {/* Ícone "+" grande centralizado no card */}
            <span className="curso-adicionar-icone">+</span>
            {/* Texto abaixo do ícone */}
            <span className="curso-adicionar-texto">Adicionar curso</span>
          </button>
        )}
      </div>

      {/* Modal com o formulário de criação de curso.
          Só entra na árvore do React quando modalAberto === true.
          Enquanto estiver fechado, nem o JSX nem os estilos são carregados. */}
      {modalAberto && (
        // onClose é chamado quando o usuário clica fora do modal (overlay).
        // Aqui passamos uma função que simplesmente fecha o modal.
        <Modal onClose={() => setModalAberto(false)}>
          {/* Título muda conforme o modo do modal:
              edição (tem id) → "Editar curso"
              criação (sem id) → "Adicionar novo curso" */}
          <h2 className="modal-titulo">
            {cursoEditandoId ? 'Editar curso' : 'Adicionar novo curso'}
          </h2>

          {/* Formulário controlado: cada input tem "value" ligado ao estado
              e "onChange" que atualiza o estado. Por isso chamamos de
              "controlled form" — o React controla o valor de cada campo. */}
          <form className="curso-form" onSubmit={handleSubmit}>

            {/* Campo do título do curso */}
            <label>
              Título
              <input
                type="text"
                name="titulo"                     // bate com a chave do estado
                value={novoCurso.titulo}          // valor vem do estado
                onChange={handleChange}           // ao digitar, atualiza o estado
                placeholder="Ex: Valorant"
                required                          // HTML5 impede envio se vazio
              />
            </label>

            {/* Campo da descrição (textarea = texto multilinha) */}
            <label>
              Descrição
              <textarea
                name="descricao"
                value={novoCurso.descricao}
                onChange={handleChange}
                placeholder="Breve descrição do curso..."
                rows={3}                          // altura inicial em linhas
                required
              />
            </label>

            {/* Campo do nome do arquivo de imagem.
                Não é um upload — o usuário só informa o nome do arquivo
                que já existe em /public/img (ex: "valorant.jpg") */}
            <label>
              Imagem (arquivo em /public/img)
              <input
                type="text"
                name="imagem"
                value={novoCurso.imagem}
                onChange={handleChange}
                placeholder="Ex: valorant.jpg"
              />
            </label>

            {/* Campo numérico para o total de módulos do curso */}
            <label>
              Total de módulos
              <input
                type="number"
                name="totalModulos"
                value={novoCurso.totalModulos}
                onChange={handleChange}
                min="0"                           // impede número negativo
              />
            </label>

            {/* Linha com os botões no final do formulário */}
            <div className="curso-form-acoes">
              {/* Botão "Excluir curso" — só aparece no modo EDIÇÃO.
                  Fica à esquerda para separar visualmente as ações
                  destrutivas das ações seguras (cancelar/salvar). */}
              {cursoEditandoId && (
                <button
                  type="button"
                  className="btn-excluir"
                  onClick={handleExcluir}
                >
                  Excluir curso
                </button>
              )}

              {/* Spacer empurra os próximos botões para a direita
                  quando o botão "Excluir" aparece */}
              <div className="curso-form-spacer" />

              {/* type="button" evita que o botão envie o form ao clicar */}
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>

              {/* type="submit" é o que dispara o onSubmit do <form>.
                  Texto do botão muda conforme o modo (editar ou criar). */}
              <button type="submit" className="btn-salvar">
                {cursoEditandoId ? 'Salvar alterações' : 'Salvar curso'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  )
}
