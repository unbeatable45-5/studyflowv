import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownWithMathProps {
  children: string;
  className?: string;
}

/**
 * Normalize common LaTeX/math patterns the model may emit so KaTeX can render
 * them and copying still yields readable text.
 *  - \( ... \)  -> $ ... $
 *  - \[ ... \]  -> $$ ... $$
 *  - Stray ``` math fences are unwrapped to $$ blocks.
 */
function normalizeMath(input: string): string {
  if (!input) return input;
  let s = input;
  // Inline:  \( ... \)  -> $ ... $
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_m, body) => `$${body}$`);
  // Block:  \[ ... \]   -> $$ ... $$
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_m, body) => `$$${body}$$`);
  // ```math fenced blocks -> $$ ... $$
  s = s.replace(/```math\s*([\s\S]+?)```/g, (_m, body) => `$$${body.trim()}$$`);
  // ```latex fenced blocks -> $$ ... $$
  s = s.replace(/```latex\s*([\s\S]+?)```/g, (_m, body) => `$$${body.trim()}$$`);
  return s;
}

const MarkdownWithMath = ({ children, className }: MarkdownWithMathProps) => {
  const safe = normalizeMath(children ?? "");
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, output: "html", strict: "ignore" }]]}
      >
        {safe}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownWithMath;
