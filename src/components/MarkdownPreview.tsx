import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownPreviewProps = {
  markdown: string;
  emptyMessage?: string;
};

/**
 * Renders Markdown text using GitHub Flavored Markdown rules, styled to
 * roughly resemble how it would look pasted into a GitHub/Gitea issue.
 */
export function MarkdownPreview({
  markdown,
  emptyMessage = "まだ出力はありません。",
}: MarkdownPreviewProps) {
  if (!markdown.trim()) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h2:text-base prose-h2:mt-4 prose-h2:border-b prose-h2:pb-1 prose-pre:bg-gray-900 prose-pre:text-gray-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
