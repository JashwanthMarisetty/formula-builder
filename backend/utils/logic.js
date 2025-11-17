// Simple conditional logic evaluator shared by controllers
// Rule format examples:
// Field visibility: [{ when: [{ field, op, value }], action: 'show' | 'hide' }]
// Page logic: { skipTo: [{ when: [{ field, op, value }], toPageId: 'page-2' }] }

function evalCondition(cond, data) {
  const left = data?.[cond.field];
  const right = cond.value;
  switch (cond.op) {
    case 'eq': return left === right;
    case 'neq': return left !== right;
    case 'gt': return Number(left) > Number(right);
    case 'lt': return Number(left) < Number(right);
    case 'contains':
      if (Array.isArray(left)) return left.includes(right);
      if (typeof left === 'string') return left.toLowerCase().includes(String(right).toLowerCase());
      return false;
    case 'in':
      if (Array.isArray(right)) return right.includes(left);
      return false;
    default: return false;
  }
}

function evalWhenArray(whenArr = [], data) {
  // AND all conditions inside a rule
  return whenArr.every((cond) => evalCondition(cond, data));
}

function isFieldVisible(field, data) {
  const rules = Array.isArray(field.visibilityRules) ? field.visibilityRules : [];
  if (rules.length === 0) return true; // no rules means visible
  // OR the rules
  for (const rule of rules) {
    if (evalWhenArray(rule.when || [], data)) {
      const action = rule.action || 'show';
      return action === 'show';
    }
  }
  // if no rule matched, default visible
  return true;
}

function buildReachablePageIds(pages = [], data) {
  const idIndexMap = new Map();
  pages.forEach((p, idx) => idIndexMap.set(p.id, idx));
  const visited = new Set();
  const reachable = new Set();
  let idx = 0;
  while (idx >= 0 && idx < pages.length) {
    const page = pages[idx];
    if (visited.has(page.id)) break; // prevent loops
    visited.add(page.id);
    reachable.add(page.id);
    const logic = page.logic || {};
    const skipRules = Array.isArray(logic.skipTo) ? logic.skipTo : [];
    let jumped = false;
    for (const rule of skipRules) {
      if (evalWhenArray(rule.when || [], data)) {
        const toId = rule.toPageId;
        if (toId && idIndexMap.has(toId)) {
          idx = idIndexMap.get(toId);
          jumped = true;
          break;
        }
      }
    }
    if (!jumped) idx += 1;
  }
  return reachable;
}

module.exports = {
  isFieldVisible,
  buildReachablePageIds,
};