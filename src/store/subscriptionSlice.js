// Esse arquivo cria um "pedaço" do Redux responsável pela assinatura

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedPlan: null, // plano escolhido pelo usuário
  isSubscribed: false // se o usuário já assinou
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    // Define qual plano foi escolhido
    setPlan: (state, action) => {
      state.selectedPlan = action.payload;
    },

    // Marca o usuário como assinante
    subscribe: (state) => {
      state.isSubscribed = true;
    }
  }
});

export const { setPlan, subscribe } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
