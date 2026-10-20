"use client";

import React, { useMemo } from "react";
import katex from "katex";

type MathRendererProps = {
  text?: string | null;
  className?: string;
  as?: "span" | "p" | "div";
};

export function convertBracketMatricesToLatex(text?: string | null): string {
  if (!text) return "";

  // 1. Nested bracket determinants: |[[1, 2], [3, 4]]| or | [[1, 2], [3, 4]] |
  let res = text.replace(/\|\s*\[\s*(\[[^\[\]]+\](?:\s*,?\s*\[[^\[\]]+\])*)\s*\]\s*\|/g, (_, inner) => {
    const rawRows = inner.split(/\]\s*,?\s*\[/).map((r: string) => r.replace(/[\[\]]/g, "").trim());
    const latexRows = rawRows.map((r: string) => {
      const cells = r.includes(",")
        ? r.split(/\s*,\s*/).map((c: string) => c.trim()).filter(Boolean)
        : r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      return cells.join(" & ");
    });
    return `\\begin{vmatrix} ${latexRows.join(" \\\\ ")} \\end{vmatrix}`;
  });

  // 2. Nested bracket matrices: [[1, 2, -3], [-2, 1, 0]] or [[x², 2x], [5, 3]]
  res = res.replace(/\[\s*(\[[^\[\]]+\](?:\s*,?\s*\[[^\[\]]+\])*)\s*\]/g, (_, inner) => {
    const rawRows = inner.split(/\]\s*,?\s*\[/).map((r: string) => r.replace(/[\[\]]/g, "").trim());
    const latexRows = rawRows.map((r: string) => {
      const cells = r.includes(",")
        ? r.split(/\s*,\s*/).map((c: string) => c.trim()).filter(Boolean)
        : r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      return cells.join(" & ");
    });
    return `\\begin{bmatrix} ${latexRows.join(" \\\\ ")} \\end{bmatrix}`;
  });

  // 3. Semicolon determinants: |[1, 2; 3, 4]| or |1, 2; 3, 4|
  res = res.replace(/\|\s*(?:\[\s*)?([a-zA-Z0-9\u0980-\u09EF+\-−.,\s\^²³ⁿ]+;[a-zA-Z0-9\u0980-\u09EF+\-−.,\s\^²³ⁿ;]+)(?:\s*\])?\s*\|/g, (match, inner) => {
    const rawRows = inner.split(/\s*;\s*/).map((r: string) => r.trim()).filter(Boolean);
    if (rawRows.length < 2) return match;
    const latexRows = rawRows.map((r: string) => {
      const cells = r.includes(",")
        ? r.split(/\s*,\s*/).map((c: string) => c.trim()).filter(Boolean)
        : r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      return cells.join(" & ");
    });
    return `\\begin{vmatrix} ${latexRows.join(" \\\\ ")} \\end{vmatrix}`;
  });

  // 4. Semicolon bracket matrices: [1, 2; 3, 4] or [k  2 ; 2  k]
  res = res.replace(/\[\s*([a-zA-Z0-9\u0980-\u09EF+\-−.,\s\^²³ⁿ]+;[a-zA-Z0-9\u0980-\u09EF+\-−.,\s\^²³ⁿ;]+)\s*\]/g, (match, inner) => {
    const rawRows = inner.split(/\s*;\s*/).map((r: string) => r.trim()).filter(Boolean);
    if (rawRows.length < 2) return match;
    const latexRows = rawRows.map((r: string) => {
      const cells = r.includes(",")
        ? r.split(/\s*,\s*/).map((c: string) => c.trim()).filter(Boolean)
        : r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      return cells.join(" & ");
    });
    return `\\begin{bmatrix} ${latexRows.join(" \\\\ ")} \\end{bmatrix}`;
  });

  return res;
}

export function MathRenderer({ text, className = "", as: Component = "span" }: MathRendererProps) {
  const parts = useMemo(() => {
    if (!text) return [];

    // Pre-process bracket matrices (e.g. [[1, 2], [3, 4]] or [[x², 2x], [5, 3]]) into standard LaTeX environments
    const normalizedText = convertBracketMatricesToLatex(text);

    // Step 1: Match explicit math blocks: $$...$$, \[...\], $...$, \(...\), \begin{...}...\end{...}
    const delimiterRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|(?<!\\)\$((?:\\\$|[^\$])+?)(?<!\\)\$|\\\([\s\S]+?\\\)|\\begin\{(?:vmatrix|bmatrix|pmatrix|matrix|aligned|cases)\}[\s\S]*?\\end\{(?:vmatrix|bmatrix|pmatrix|matrix|aligned|cases)\})/g;
    const rawTokens: Array<{ type: "text" | "math"; content: string; display: boolean }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = delimiterRegex.exec(normalizedText)) !== null) {
      if (match.index > lastIndex) {
        rawTokens.push({
          type: "text",
          content: normalizedText.slice(lastIndex, match.index),
          display: false
        });
      }

      const raw = match[0];
      const isDisplay = raw.startsWith("$$") || raw.startsWith("\\[");
      let formula = raw;
      if (raw.startsWith("$$") && raw.endsWith("$$")) formula = raw.slice(2, -2);
      else if (raw.startsWith("\\[") && raw.endsWith("\\]")) formula = raw.slice(2, -2);
      else if (raw.startsWith("$") && raw.endsWith("$")) formula = raw.slice(1, -1);
      else if (raw.startsWith("\\(") && raw.endsWith("\\)")) formula = raw.slice(2, -2);

      rawTokens.push({
        type: "math",
        content: formula.trim(),
        display: isDisplay
      });

      lastIndex = match.index + raw.length;
    }

    if (lastIndex < normalizedText.length) {
      rawTokens.push({
        type: "text",
        content: normalizedText.slice(lastIndex),
        display: false
      });
    }

    // Step 2: Scan remaining text tokens for inline standalone LaTeX (e.g. ৮ \frac{১}{৩৫}, \sqrt{x}, matrices, limits, integrals, x^{2}, x^2, \angle, \triangle, \odot, \cup, \cap)
    const standaloneRegex = /((?:[\d\u09E6-\u09EF]+\s+)?\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt(?:\[[^{}\]]*\])?\{[^{}]*\}|\\begin\{(?:vmatrix|bmatrix|pmatrix|matrix|aligned|cases)\}[\s\S]*?\\end\{(?:vmatrix|bmatrix|pmatrix|matrix|aligned|cases)\}|\\lim(?:_\{[^{}]*\}|_[0-9a-zA-Z\u09E6-\u09EF\\]+)|\b(?:\\(?:int|iint|iiint|oint)|[∫∬∭∮])(?:_\{[^{}]*\}|\^\{[^{}]*\}|_[0-9a-zA-Z\u09E6-\u09EF\\]+|\^[0-9a-zA-Z\u09E6-\u09EF\\]+)*|(?:[a-zA-Z\d\u09E6-\u09EF]+|\([^\)]+\))?[\^_](?:\{[^{}]*\}|[0-9a-zA-Z\u09E6-\u09EF]+)|\\(?:alpha|beta|gamma|delta|Delta|theta|vartheta|lambda|Lambda|pi|Pi|sigma|Sigma|omega|Omega|mu|rho|tau|phi|psi|angle|measuredangle|triangle|odot|bigcirc|circ|degree|parallel|perp|cong|sim|cup|cap|setminus|in|notin|subset|subseteq|supset|supseteq|emptyset|times|div|pm|mp|le|leq|ge|geq|neq|approx|equiv|infty|propto|rightarrow|leftarrow|Rightarrow|Leftarrow|sum|prod|sin|cos|tan|cot|sec|csc|partial)\b)/g;

    const finalTokens: Array<{ type: "text" | "math"; content: string; display: boolean }> = [];

    for (const token of rawTokens) {
      if (token.type === "math") {
        finalTokens.push(token);
        continue;
      }

      let subLastIndex = 0;
      let subMatch: RegExpExecArray | null;

      while ((subMatch = standaloneRegex.exec(token.content)) !== null) {
        if (subMatch.index > subLastIndex) {
          finalTokens.push({
            type: "text",
            content: token.content.slice(subLastIndex, subMatch.index),
            display: false
          });
        }

        finalTokens.push({
          type: "math",
          content: subMatch[0].trim(),
          display: false
        });

        subLastIndex = subMatch.index + subMatch[0].length;
      }

      if (subLastIndex < token.content.length) {
        finalTokens.push({
          type: "text",
          content: token.content.slice(subLastIndex),
          display: false
        });
      }
    }

    return finalTokens;
  }, [text]);

  if (!text) return null;

  return (
    <Component className={className}>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <React.Fragment key={index}>{part.content}</React.Fragment>;
        }

        try {
          let mathExpr = part.content;
          const isMatrix = /\\begin\{(?:vmatrix|bmatrix|pmatrix|matrix|cases|aligned)\}/.test(mathExpr);
          // If a matrix environment has single backslash row separators due to serialization, normalize to \\
          if (isMatrix) {
            mathExpr = mathExpr
              .replace(/([^\\])\\\s+(?=[^\\])/g, "$1\\\\ ")
              .replace(/([^\\])\\\n/g, "$1\\\\\n")
              .replace(/\\\\{2,}/g, "\\\\");
          }

          // Ensure limits render with condition directly underneath lim
          if (/\\lim(?!\s*\\limits)/.test(mathExpr)) {
            mathExpr = mathExpr.replace(/\\lim(?!\s*\\limits)/g, "\\lim\\limits");
          }

          const html = katex.renderToString(mathExpr, {
            displayMode: part.display,
            throwOnError: false,
            strict: false
          });

          return (
            <span
              key={index}
              className={
                part.display
                  ? "my-1.5 block overflow-x-auto text-center"
                  : isMatrix
                  ? "katex-matrix-wrapper"
                  : "inline-block align-middle mx-0.5"
              }
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part.content}</span>;
        }
      })}
    </Component>
  );
}
