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
      <div className="subscription">
        <h1>Escolha seu plano</h1>

        <div className="plans">
          <button onClick={() => dispatch(setPlan("Básico"))}>
            Plano Básico
          </button>

          <button onClick={() => dispatch(setPlan("Pro"))}>
            Plano Pro
          </button>

          <button onClick={() => dispatch(setPlan("Premium"))}>
            Plano Premium
          </button>
        </div>

        <p>Plano selecionado: {selectedPlan || "Nenhum"}</p>

        <button
          className="confirm"
          onClick={() => dispatch(subscribe())}
          disabled={!selectedPlan}
        >
          Confirmar Assinatura
        </button>

        {isSubscribed && <p>Assinatura ativa com sucesso!</p>}
      </div>
    </Layout>
  );
}
