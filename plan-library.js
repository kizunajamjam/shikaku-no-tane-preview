(function exposePlanLibrary(root) {
  "use strict";

  // Each generated schedule is immutable. Keep the selected schedule under
  // the original key so single-plan saves use the same IDs after upgrading.
  function plansIn(state) {
    return [state?.plan, ...(Array.isArray(state?.otherPlans) ? state.otherPlans : [])]
      .filter((plan) => typeof plan?.id === "string");
  }

  function selectPlan(state, plan) {
    return { ...state, plan, otherPlans: plansIn(state).filter((entry) => entry.id !== plan.id) };
  }

  function mergeLibraries(local, remote, resetAt) {
    const byId = new Map();
    for (const plan of [...plansIn(remote), ...plansIn(local)]) {
      if (!resetAt || plan.generatedAt > resetAt) byId.set(plan.id, plan);
    }
    const plans = [...byId.values()].sort((a, b) =>
      String(b.generatedAt).localeCompare(String(a.generatedAt)) || a.id.localeCompare(b.id));
    // Preserve the device's selection. Legacy saves had no library and
    // previously displayed the most recently generated schedule after sync.
    const selected = Array.isArray(local?.otherPlans) && byId.get(local.plan?.id);
    const plan = selected || plans[0] || null;
    return { plan, otherPlans: plans.filter((entry) => entry.id !== plan.id) };
  }

  const api = { plansIn, selectPlan, mergeLibraries };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.PassDeckPlanLibrary = api;
})(globalThis);
