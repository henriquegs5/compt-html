import { useDispatch, useSelector } from "react-redux";
import { setPlan, subscribe } from "../store/subscriptionSlice";
import Layout from "../components/Layout";
import "./Subscription.css";

export default function Subscription() {
  const dispatch = useDispatch();
  const { selectedPlan, isSubscribed } = useSelector(
    (state) => state.subscription
  );

  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">Assinatura</h1>

        <div className="plans-container">

  {/* PLANO BÁSICO */}
  <div
    className={`plan-box ${selectedPlan === "Básico" ? "selected" : ""}`}
    onClick={() => dispatch(setPlan("Básico"))}
  >
    <h2>Básico</h2>
    <p className="price">R$ 47/mês</p>

    <ul>
      <li>Acesso completo a todos os vídeos</li>
      <li>Comunidade geral da plataforma</li>
      <li>Estatísticas de desempenho dos jogos</li>
      <li>Personalização de perfil (descrição e jogos)</li>
      <li>Suporte 24h para problemas técnicos</li>
    </ul>
  </div>


  {/* PLANO PRO */}
  <div
    className={`plan-box popular ${
      selectedPlan === "Pro" ? "selected" : ""
    }`}
    onClick={() => dispatch(setPlan("Pro"))}
  >
    <span className="badge">Mais Popular</span>

    <h2>Pro</h2>
    <p className="price">R$ 67/mês</p>

    <ul>
      <li>Acesso completo a todos os vídeos</li>
      <li>Comunidade geral + comunidades exclusivas por jogo</li>
      <li>Estatísticas de desempenho dos jogos</li>
      <li>Personalização de perfil (descrição e jogos)</li>
      <li>Suporte 24h priorizado</li>
      <li>3 sessões mensais de mentoria (1h cada)</li>
    </ul>
  </div>


  {/* PLANO PREMIUM */}
  <div
    className={`plan-box ${
      selectedPlan === "Premium" ? "selected" : ""
    }`}
    onClick={() => dispatch(setPlan("Premium"))}
  >
    <h2>Premium</h2>
    <p className="price">R$ 97/mês</p>

    <ul>
      <li>Acesso completo a todos os vídeos</li>
      <li>Comunidade geral + comunidades exclusivas por jogo</li>
      <li>Estatísticas de desempenho dos jogos</li>
      <li>Personalização de perfil (descrição e jogos)</li>
      <li>Suporte 24h priorizado</li>
      <li>5 sessões mensais de mentoria (1h cada)</li>
      <li>Aba exclusiva para falar com profissionais</li>
      <li>Acesso antecipado a novos conteúdos</li>
    </ul>
  </div>

</div>

        <button
          className="primary-button"
          onClick={() => dispatch(subscribe())}
          disabled={!selectedPlan}
        >
          Confirmar Assinatura
        </button>

        {isSubscribed && (
          <p className="success-text">
            Assinatura realizada com sucesso!
          </p>
        )}
      </div>
    </Layout>
  );
}
