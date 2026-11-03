import { useMemo } from 'react';
import { motion } from 'motion/react';
import katex from 'katex';
export default function MathExplanation({ phase, reduced }) {
  const equation = useMemo(() => katex.renderToString(phase.formula, { throwOnError: false, displayMode: true, output: 'htmlAndMathml' }), [phase.formula]);
  return <div className="math-panel"><div className="paper-meta"><span>THE MATHEMATICS OF INFECTION</span><span>FIELD NOTE {String(phase.index + 1 || 1).padStart(2,'0')}</span></div><motion.div key={phase.id} initial={{ opacity: reduced ? 1 : .45, y: reduced ? 0 : 2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .14 }}><div className="equation" dangerouslySetInnerHTML={{ __html: equation }}/><p>{phase.explanation}</p></motion.div></div>;
}
