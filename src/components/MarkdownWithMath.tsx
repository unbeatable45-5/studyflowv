import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownWithMathProps {
  children: string;
  className?: string;
}

const MarkdownWithMath = ({ children, className }: MarkdownWithMathProps) => {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownWithMath;
