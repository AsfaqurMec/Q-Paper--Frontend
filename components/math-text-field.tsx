"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Code, Eye, Sigma, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { latexToCleanMath } from "@/lib/math-utils";

type MathTextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  compact?: boolean;
  label?: string;
  hideToolbar?: boolean;
};

type SymbolItem = {
  label: string;
  text: string;
  title: string;
  cursorOffset?: number;
};

type SymbolCategory = {
  name: string;
  items: SymbolItem[];
};

const symbolCategories: SymbolCategory[] = [
  {
    name: "Templates",
    items: [
      { label: "a/b", text: "\\frac{}{}", title: "Empty Fraction (Numerator over Denominator with straight line)" },
      { label: "|2×2|", text: "$\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}$", title: "2x2 Determinant" },
      { label: "[2×2]", text: "$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$", title: "2x2 Matrix" },
      { label: "|3×3|", text: "$\\begin{vmatrix} a_1 & b_1 & c_1 \\\\ a_2 & b_2 & c_2 \\\\ a_3 & b_3 & c_3 \\end{vmatrix}$", title: "3x3 Determinant" },
      { label: "[3×3]", text: "$\\begin{bmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{bmatrix}$", title: "3x3 Matrix" },
      { label: "xⁿ", text: "ⁿ", title: "Power / Exponent" },
      { label: "xₙ", text: "ₙ", title: "Subscript" },
      { label: "√x", text: "√", title: "Square root" },
      { label: "ⁿ√x", text: "∛", title: "Cube/nth Root" },
      { label: "x/y", text: " / ", title: "Inline slash division" }
    ]
  },
  {
    name: "Matrices",
    items: [
      { label: "|2×2|", text: "$\\begin{vmatrix} 2 & 1 \\\\ 3 & 4 \\end{vmatrix}$", title: "2x2 Determinant" },
      { label: "[2×2]", text: "$\\begin{bmatrix} 2 & 1 \\\\ 3 & 4 \\end{bmatrix}$", title: "2x2 Matrix" },
      { label: "(2×2)", text: "$\\begin{pmatrix} 2 & 1 \\\\ 3 & 4 \\end{pmatrix}$", title: "2x2 Matrix with Parentheses" },
      { label: "|3×3|", text: "$\\begin{vmatrix} a_1 & b_1 & c_1 \\\\ a_2 & b_2 & c_2 \\\\ a_3 & b_3 & c_3 \\end{vmatrix}$", title: "3x3 Determinant" },
      { label: "[3×3]", text: "$\\begin{bmatrix} 1 & 0 & 2 \\\\ 2 & 1 & 3 \\\\ 0 & 3 & 1 \\end{bmatrix}$", title: "3x3 Matrix" },
      { label: "[3×1]", text: "$\\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix}$", title: "3x1 Column Vector" },
      { label: "[1×3]", text: "$\\begin{bmatrix} x & y & z \\end{bmatrix}$", title: "1x3 Row Vector" }
    ]
  },
  {
    name: "Calculus & Limits",
    items: [
      { label: "d/dx", text: "$\\frac{d}{dx}$", title: "Derivative d/dx" },
      { label: "dy/dx", text: "$\\frac{dy}{dx}$", title: "Derivative dy/dx" },
      { label: "d²y/dx²", text: "$\\frac{d^2y}{dx^2}$", title: "Second derivative d²y/dx²" },
      { label: "∂/∂x", text: "$\\frac{\\partial}{\\partial x}$", title: "Partial derivative ∂/∂x" },
      { label: "lim x→0", text: "$\\lim_{x \\to 0}$", title: "Limit x -> 0" },
      { label: "lim x→∞", text: "$\\lim_{x \\to \\infty}$", title: "Limit x -> ∞" },
      { label: "∫ dx", text: "$\\int f(x) \\, dx$", title: "Indefinite integral" },
      { label: "∫ₐᵇ", text: "$\\int_{a}^{b} f(x) \\, dx$", title: "Definite integral from a to b" },
      { label: "∬", text: "$\\iint$", title: "Double integral" },
      { label: "∮", text: "$\\oint$", title: "Contour integral" }
    ]
  },
  {
    name: "Common Math",
    items: [
      { label: "±", text: "±", title: "Plus minus" },
      { label: "×", text: "×", title: "Multiply" },
      { label: "÷", text: "÷", title: "Divide" },
      { label: "°", text: "°", title: "Degree" },
      { label: "·", text: "·", title: "Center dot (multiplication)" },
      { label: "≠", text: "≠", title: "Not equal" },
      { label: "≈", text: "≈", title: "Approximately equal" },
      { label: "≤", text: "≤", title: "Less than or equal" },
      { label: "≥", text: "≥", title: "Greater than or equal" },
      { label: "²", text: "²", title: "Superscript 2" },
      { label: "³", text: "³", title: "Superscript 3" },
      { label: "⁴", text: "⁴", title: "Superscript 4" },
      { label: "⁵", text: "⁵", title: "Superscript 5" },
      { label: "ⁿ", text: "ⁿ", title: "Superscript n" },
      { label: "⁻¹", text: "⁻¹", title: "Power -1" },
      { label: "∞", text: "∞", title: "Infinity" },
      { label: "∝", text: "∝", title: "Proportional to" },
      { label: "%", text: "%", title: "Percent" }
    ]
  },
  {
    name: "Subscripts",
    items: [
      { label: "₀", text: "₀", title: "Subscript 0" },
      { label: "₁", text: "₁", title: "Subscript 1" },
      { label: "₂", text: "₂", title: "Subscript 2" },
      { label: "₃", text: "₃", title: "Subscript 3" },
      { label: "₄", text: "₄", title: "Subscript 4" },
      { label: "₅", text: "₅", title: "Subscript 5" },
      { label: "₆", text: "₆", title: "Subscript 6" },
      { label: "₇", text: "₇", title: "Subscript 7" },
      { label: "₈", text: "₈", title: "Subscript 8" },
      { label: "₉", text: "₉", title: "Subscript 9" },
      { label: "ₖ", text: "ₖ", title: "Subscript k" },
      { label: "ₙ", text: "ₙ", title: "Subscript n" },
      { label: "ᵢ", text: "ᵢ", title: "Subscript i" }
    ]
  },
  {
    name: "Greek Letters",
    items: [
      { label: "α", text: "α", title: "alpha" },
      { label: "β", text: "β", title: "beta" },
      { label: "γ", text: "γ", title: "gamma" },
      { label: "δ", text: "δ", title: "delta" },
      { label: "Δ", text: "Δ", title: "Delta" },
      { label: "ε", text: "ε", title: "epsilon" },
      { label: "θ", text: "θ", title: "theta" },
      { label: "λ", text: "λ", title: "lambda" },
      { label: "μ", text: "μ", title: "mu" },
      { label: "π", text: "π", title: "pi" },
      { label: "ρ", text: "ρ", title: "rho" },
      { label: "σ", text: "σ", title: "sigma" },
      { label: "Σ", text: "Σ", title: "Sigma" },
      { label: "φ", text: "φ", title: "phi" },
      { label: "ω", text: "ω", title: "omega" },
      { label: "Ω", text: "Ω", title: "Omega (Ohm)" }
    ]
  },
  {
    name: "Relations & Logic",
    items: [
      { label: "→", text: "→", title: "arrow right" },
      { label: "←", text: "←", title: "arrow left" },
      { label: "↔", text: "↔", title: "arrow left-right" },
      { label: "⇒", text: "⇒", title: "implies" },
      { label: "⇐", text: "⇐", title: "implied by" },
      { label: "∴", text: "∴", title: "therefore" },
      { label: "∵", text: "∵", title: "because" },
      { label: "∫", text: "∫", title: "integral" },
      { label: "∑", text: "∑", title: "summation" }
    ]
  },
  {
    name: "Geometry & Circles",
    items: [
      { label: "∠", text: "∠", title: "angle" },
      { label: "∡", text: "∡", title: "measured angle" },
      { label: "△", text: "△", title: "triangle" },
      { label: "⊙", text: "⊙", title: "circle with center" },
      { label: "◯", text: "◯", title: "circle" },
      { label: "∥", text: "∥", title: "parallel" },
      { label: "⊥", text: "⊥", title: "perpendicular" },
      { label: "≅", text: "≅", title: "congruent" },
      { label: "∼", text: "∼", title: "similar" },
      { label: "⌒", text: "⌒", title: "arc" },
      { label: "□", text: "□", title: "square" }
    ]
  },
  {
    name: "Sets & Number Systems",
    items: [
      { label: "∈", text: "∈", title: "element of" },
      { label: "∉", text: "∉", title: "not an element of" },
      { label: "⊂", text: "⊂", title: "subset of" },
      { label: "⊆", text: "⊆", title: "subset or equal" },
      { label: "⊃", text: "⊃", title: "superset of" },
      { label: "⊇", text: "⊇", title: "superset or equal" },
      { label: "∪", text: "∪", title: "union" },
      { label: "∩", text: "∩", title: "intersection" },
      { label: "∖", text: "∖", title: "set difference" },
      { label: "∅", text: "∅", title: "empty set" },
      { label: "ℕ", text: "ℕ", title: "natural numbers" },
      { label: "ℤ", text: "ℤ", title: "integers" },
      { label: "ℚ", text: "ℚ", title: "rational numbers" },
      { label: "ℝ", text: "ℝ", title: "real numbers" },
      { label: "ℂ", text: "ℂ", title: "complex numbers" }
    ]
  }
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createFractionHtml(num: string, den: string): string {
  const safeNum = escapeHtml(num.trim());
  const safeDen = escapeHtml(den.trim());
  return `<span class="inline-fraction-widget inline-flex flex-col items-center align-middle mx-1 text-center font-serif text-sm bg-slate-100/90 dark:bg-slate-800/90 rounded px-1.5 py-0.5 border border-slate-300 dark:border-slate-600 select-none cursor-default" contenteditable="false" data-math-type="fraction">` +
    `<span class="fraction-num border-b-2 border-slate-800 dark:border-slate-100 px-1 leading-tight font-medium outline-none min-w-[1.2ch] text-center select-text hover:bg-primary/10 rounded-xs transition-colors" contenteditable="true" spellcheck="false">${safeNum}</span>` +
    `<span class="fraction-den px-1 leading-tight font-medium outline-none min-w-[1.2ch] text-center select-text hover:bg-primary/10 rounded-xs transition-colors" contenteditable="true" spellcheck="false">${safeDen}</span>` +
    `</span>`;
}

function parseTextToEditorHtml(input: string): string {
  if (!input) return "";

  // First convert raw LaTeX superscripts/subscripts/symbols to clean math
  const clean = latexToCleanMath(input);

  // Replace \frac{num}{den} with the visual fraction widget
  const fracRegex = /\\frac\{([^{}]*)\}\{([^{}]*)\}/g;
  let html = "";
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = fracRegex.exec(clean)) !== null) {
    if (match.index > lastIdx) {
      html += escapeHtml(clean.slice(lastIdx, match.index));
    }
    html += createFractionHtml(match[1], match[2]);
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < clean.length) {
    html += escapeHtml(clean.slice(lastIdx));
  }

  // Convert newlines to breaks
  return html.replace(/\n/g, "<br>");
}

function serializeEditorToText(rootNode: Node): string {
  let result = "";

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || "";
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      // Fraction widget
      if (el.getAttribute("data-math-type") === "fraction") {
        const numEl = el.querySelector(".fraction-num");
        const denEl = el.querySelector(".fraction-den");
        const numText = numEl?.textContent?.trim() || "";
        const denText = denEl?.textContent?.trim() || "";
        // If whole number right before, ensure a space
        if (result.length > 0 && /[\d\u09E6-\u09EF]$/u.test(result)) {
          result += " ";
        }
        result += `\\frac{${numText}}{${denText}}`;
        return;
      }

      // Line break
      if (el.tagName === "BR") {
        result += "\n";
        return;
      }

      const isBlock = el.tagName === "DIV" || el.tagName === "P";
      if (isBlock && result.length > 0 && !result.endsWith("\n")) {
        result += "\n";
      }

      for (let child = el.firstChild; child; child = child.nextSibling) {
        traverse(child);
      }

      if (isBlock && !result.endsWith("\n")) {
        result += "\n";
      }
    }
  }

  traverse(rootNode);
  return result.replace(/\n+$/, "");
}

export function MathTextField({
  value,
  onChange,
  placeholder = "Write text or insert mathematical symbols...",
  minRows = 3,
  compact = false,
  label,
  hideToolbar = false
}: MathTextFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [symbolsOpen, setSymbolsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [mode, setMode] = useState<"math" | "code">("math");

  // Fraction builder states
  const [builderNum, setBuilderNum] = useState("");
  const [builderDen, setBuilderDen] = useState("");

  const lastSerializedValue = useRef<string>(value);
  const savedSelectionRange = useRef<Range | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSymbolsOpen(false);
      }
    }
    if (symbolsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [symbolsOpen]);

  // Sync external value changes to contentEditable DOM
  useEffect(() => {
    if (mode !== "math" || !editorRef.current) return;
    // Only re-populate innerHTML if value changed externally (not from our own input typing)
    if (value !== lastSerializedValue.current) {
      editorRef.current.innerHTML = parseTextToEditorHtml(value);
      lastSerializedValue.current = value;
    }
  }, [value, mode]);

  // Initial render of editor content
  useEffect(() => {
    if (mode === "math" && editorRef.current) {
      editorRef.current.innerHTML = parseTextToEditorHtml(value);
      lastSerializedValue.current = value;
    }
  }, []);

  function saveCurrentSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      savedSelectionRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function handleEditorInput() {
    if (!editorRef.current) return;
    const serialized = serializeEditorToText(editorRef.current);
    lastSerializedValue.current = serialized;
    onChange(serialized);
    saveCurrentSelection();
  }

  function handleEditorBlur() {
    if (!editorRef.current) return;
    const serialized = serializeEditorToText(editorRef.current);
    lastSerializedValue.current = serialized;
    onChange(serialized);
  }

  function insertFractionIntoEditor(num: string, den: string) {
    if (mode === "code") {
      const insertion = `\\frac{${num}}{${den}}`;
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const next = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
        onChange(next);
        window.requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start + insertion.length, start + insertion.length);
        });
      } else {
        onChange(`${value}${insertion}`);
      }
      setSymbolsOpen(false);
      return;
    }

    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    let range = savedSelectionRange.current;

    // Verify saved range is still within editor
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // Move to end
    }

    const tempWrapper = document.createElement("div");
    tempWrapper.innerHTML = createFractionHtml(num, den);
    const fracEl = tempWrapper.firstElementChild as HTMLElement;

    if (fracEl) {
      range.deleteContents();
      range.insertNode(fracEl);

      // Place cursor inside numerator or denominator
      const numInput = fracEl.querySelector(".fraction-num") as HTMLElement;
      const denInput = fracEl.querySelector(".fraction-den") as HTMLElement;
      const targetInput = num ? (den ? numInput : denInput) : numInput;

      if (targetInput) {
        const newRange = document.createRange();
        newRange.selectNodeContents(targetInput);
        newRange.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
        targetInput.focus();
      }

      handleEditorInput();
    }

    setSymbolsOpen(false);
    setBuilderNum("");
    setBuilderDen("");
  }

  function insertSnippet(snippet: string) {
    if (snippet === "\\frac{}{}" || snippet === " \\frac{}{}") {
      // Check if user selected text in editor
      let selectedText = "";
      if (savedSelectionRange.current) {
        selectedText = savedSelectionRange.current.toString();
      }
      insertFractionIntoEditor(selectedText, "");
      return;
    }

    if (mode === "code") {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const next = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
        onChange(next);
        window.requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start + snippet.length, start + snippet.length);
        });
      } else {
        onChange(`${value}${snippet}`);
      }
      setSymbolsOpen(false);
      return;
    }

    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    let range = savedSelectionRange.current;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    range.deleteContents();
    const textNode = document.createTextNode(snippet);
    range.insertNode(textNode);

    // Advance cursor after inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    handleEditorInput();
    setSymbolsOpen(false);
  }

  function handleToggleMode() {
    if (mode === "math") {
      setMode("code");
    } else {
      setMode("math");
      window.requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = parseTextToEditorHtml(value);
          lastSerializedValue.current = value;
        }
      });
    }
  }

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {!hideToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-0.5" ref={dropdownRef}>
          <div className="flex items-center gap-1.5">
            {/* Symbols Palette Button */}
            <Button
              type="button"
              variant={symbolsOpen ? "secondary" : "outline"}
              size="sm"
              className="h-7 gap-1 px-2.5 text-xs font-medium"
              title="Open math symbols and fraction builder"
              onClick={() => {
                saveCurrentSelection();
                setSymbolsOpen((open) => !open);
              }}
            >
              <Sigma className="h-3.5 w-3.5 text-primary" />
              <span>Symbols</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher: Math Form (Default) vs Raw Code */}
            <button
              type="button"
              onClick={handleToggleMode}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                mode === "math"
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground bg-muted"
              }`}
              title={mode === "math" ? "Currently in visual Math form. Click to view/edit raw LaTeX code." : "Currently in Raw code mode. Click to switch to visual Math form."}
            >
              {mode === "math" ? (
                <>
                  <Eye className="h-3 w-3" />
                  <span>Math Form</span>
                </>
              ) : (
                <>
                  <Code className="h-3 w-3" />
                  <span>Raw Code</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-muted-foreground select-none">
              {label || (compact ? "Option" : "")}
            </span>
          </div>

          {/* Symbols & Fraction Builder Palette Dropdown */}
          {symbolsOpen && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute left-0 top-9 z-50 w-full max-w-md rounded-lg border bg-card p-3 shadow-xl animate-in fade-in-50 zoom-in-95"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {symbolCategories.map((cat, idx) => (
                    <button
                      key={cat.name}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setActiveTab(idx)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        activeTab === idx
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground"
                  onClick={() => setSymbolsOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Fraction Builder (Straight Horizontal Line) when on Templates tab */}
              {activeTab === 0 && (
                <div className="mt-2.5 rounded-md border border-primary/25 bg-primary/5 p-2.5">
                  <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center justify-between">
                    <span>Quick Fraction Builder (Straight Line)</span>
                    <span className="text-[10px] text-muted-foreground">e.g. ১ over ৩৫</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center flex-1 max-w-[130px]">
                      <input
                        type="text"
                        placeholder="Numerator (১)"
                        value={builderNum}
                        onChange={(e) => setBuilderNum(e.target.value)}
                        className="h-6 w-full text-center text-xs border rounded bg-background px-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="w-full h-0.5 bg-foreground/80 my-1 rounded-full" />
                      <input
                        type="text"
                        placeholder="Denominator (৩৫)"
                        value={builderDen}
                        onChange={(e) => setBuilderDen(e.target.value)}
                        className="h-6 w-full text-center text-xs border rounded bg-background px-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs font-semibold px-3"
                      onClick={() => insertFractionIntoEditor(builderNum, builderDen)}
                    >
                      Insert Fraction
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-2.5">
                <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-0.5">
                  {symbolCategories[activeTab].items.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      title={item.title}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertSnippet(item.text)}
                      className="flex h-8 min-w-8 items-center justify-center rounded border bg-background px-2.5 text-xs font-serif transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Field: Mathematical Form by default with in-field horizontal fractions & clean symbols! */}
      {mode === "math" ? (
        <div
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleEditorInput}
          onBlur={handleEditorBlur}
          onKeyUp={saveCurrentSelection}
          onMouseUp={saveCurrentSelection}
          data-placeholder={placeholder}
          className={`w-full rounded-md border bg-background p-2.5 text-sm font-serif leading-relaxed text-foreground transition-colors outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-text select-text ${
            compact ? "min-h-10 py-2 flex items-center" : "min-h-24"
          } [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none [&:empty]:before:font-sans`}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-md border bg-background p-2.5 text-sm font-mono transition-colors outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
            compact ? "min-h-10 py-2 leading-relaxed" : "min-h-24 leading-relaxed"
          }`}
          placeholder={placeholder}
          rows={compact ? 1 : minRows}
        />
      )}
    </div>
  );
}
