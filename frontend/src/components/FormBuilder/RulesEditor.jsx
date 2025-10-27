import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

const RulesEditorModal = ({ form, onClose, onSave }) => {
  const initialPages = useMemo(() => JSON.parse(JSON.stringify(form?.pages || [])), [form]);
  const [pages, setPages] = useState(initialPages);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!form) return null;
  const ops = [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'contains', label: 'contains' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'in', label: 'in list' },
  ];

  const allFields = (pages || []).flatMap(p => p.fields || []);
  const page = pages[activeIndex];
  const rules = Array.isArray(page?.logic?.skipTo) ? page.logic.skipTo : [];

  const updateRules = (nextRules) => {
    const nextPages = pages.map((p, idx) =>
      idx === activeIndex ? { ...p, logic: { ...(p.logic || {}), skipTo: nextRules } } : p
    );
    setPages(nextPages);
  };

  const addRule = () => updateRules([...(rules || []), { when: [{ field: '', op: 'eq', value: '' }], toPageId: '' }]);
  const removeRule = (i) => updateRules(rules.filter((_, idx) => idx !== i));

  const updateRule = (i, next) => {
    const nextRules = [...rules];
    nextRules[i] = { ...(nextRules[i] || {}), ...next };
    updateRules(nextRules);
  };

  const updateCond = (ri, ci, next) => {
    const nextRules = [...rules];
    const whenArr = Array.isArray(nextRules[ri]?.when) ? nextRules[ri].when : [];
    whenArr[ci] = { ...(whenArr[ci] || { field: '', op: 'eq', value: '' }), ...next };
    nextRules[ri] = { ...(nextRules[ri] || {}), when: whenArr };
    updateRules(nextRules);
  };

  const addCond = (ri) => {
    const nextRules = [...rules];
    const whenArr = Array.isArray(nextRules[ri]?.when) ? nextRules[ri].when : [];
    whenArr.push({ field: '', op: 'eq', value: '' });
    nextRules[ri] = { ...(nextRules[ri] || {}), when: whenArr };
    updateRules(nextRules);
  };

  const removeCond = (ri, ci) => {
    const nextRules = [...rules];
    const whenArr = Array.isArray(nextRules[ri]?.when) ? nextRules[ri].when : [];
    nextRules[ri] = { ...(nextRules[ri] || {}), when: whenArr.filter((_, idx) => idx !== ci) };
    updateRules(nextRules);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white w-full h-full flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Form Rules</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2">
            {(pages || []).map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActiveIndex(idx)}
                className={`w-full text-left px-3 py-2 rounded border ${idx === activeIndex ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                {p.name || p.id}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Page Logic: Skip To</h3>
            <div className="bg-gray-50 rounded border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Page: {page?.name || page?.id}</span>
                <button onClick={addRule} className="text-xs text-gray-700">+ Add rule</button>
              </div>
              <div className="space-y-3">
                {(!rules || rules.length === 0) && (
                  <p className="text-xs text-gray-500">No skip rules. Page advances sequentially.</p>
                )}
                {(rules || []).map((rule, rIndex) => (
                  <div key={rIndex} className="bg-white rounded border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Rule {rIndex + 1}</span>
                      <button onClick={() => removeRule(rIndex)} className="text-xs text-red-600">Remove</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(Array.isArray(rule.when) ? rule.when : []).map((cond, cIndex) => (
                        <div key={cIndex} className="grid grid-cols-3 gap-2 items-center">
                          <select
                            value={cond.field || ''}
                            onChange={(e) => updateCond(rIndex, cIndex, { field: e.target.value })}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="">Select field</option>
                            {allFields.map(f => (
                              <option key={f.id} value={f.id}>{f.label || f.id}</option>
                            ))}
                          </select>
                          <select
                            value={cond.op || 'eq'}
                            onChange={(e) => updateCond(rIndex, cIndex, { op: e.target.value })}
                            className="px-2 py-1 border rounded"
                          >
                            {ops.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                          </select>
                          <input
                            type="text"
                            value={cond.value ?? ''}
                            onChange={(e) => updateCond(rIndex, cIndex, { value: e.target.value })}
                            placeholder="value"
                            className="px-2 py-1 border rounded"
                          />
                          <div className="col-span-3 flex justify-end">
                            <button onClick={() => removeCond(rIndex, cIndex)} className="text-xs text-red-500">Remove condition</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button onClick={() => addCond(rIndex)} className="text-xs text-gray-700">+ And condition</button>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">Skip to</span>
                        <select
                          value={rule.toPageId || ''}
                          onChange={(e) => updateRule(rIndex, { toPageId: e.target.value })}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="">Select page</option>
                          {pages.map(p => (<option key={p.id} value={p.id}>{p.name || p.id}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => onSave(pages)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Save Rules</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesEditorModal;
