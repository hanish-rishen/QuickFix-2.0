"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={cn("prose dark:prose-invert max-w-none", className)}
      components={{
        h1: ({ className, ...props }) => (
          <h1
            className={cn("text-2xl font-bold mt-4 mb-2", className)}
            {...props}
          />
        ),
        h2: ({ className, ...props }) => (
          <h2
            className={cn("text-xl font-bold mt-4 mb-2", className)}
            {...props}
          />
        ),
        h3: ({ className, ...props }) => (
          <h3
            className={cn("text-lg font-bold mt-3 mb-2", className)}
            {...props}
          />
        ),
        p: ({ className, ...props }) => (
          <p className={cn("my-2", className)} {...props} />
        ),
        ul: ({ className, ...props }) => (
          <ul className={cn("list-disc pl-6 my-2", className)} {...props} />
        ),
        ol: ({ className, ...props }) => (
          <ol className={cn("list-decimal pl-6 my-2", className)} {...props} />
        ),
        li: ({ className, ...props }) => (
          <li className={cn("my-1", className)} {...props} />
        ),
        a: ({ className, ...props }) => (
          <a
            className={cn("text-blue-500 hover:underline", className)}
            {...props}
          />
        ),
        code: ({ className, ...props }) => (
          <code
            className={cn(
              "bg-gray-100 dark:bg-gray-800 rounded px-1",
              className
            )}
            {...props}
          />
        ),
        pre: ({ className, ...props }) => (
          <pre
            className={cn(
              "bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto",
              className
            )}
            {...props}
          />
        ),
        blockquote: ({ className, ...props }) => (
          <blockquote
            className={cn(
              "border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-2 italic",
              className
            )}
            {...props}
          />
        ),
        table: ({ className, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table
              className={cn(
                "min-w-full divide-y divide-gray-300 dark:divide-gray-700",
                className
              )}
              {...props}
            />
          </div>
        ),
        thead: ({ className, ...props }) => (
          <thead
            className={cn("bg-gray-100 dark:bg-gray-800", className)}
            {...props}
          />
        ),
        th: ({ className, ...props }) => (
          <th
            className={cn(
              "px-4 py-3 text-left text-sm font-semibold",
              className
            )}
            {...props}
          />
        ),
        td: ({ className, ...props }) => (
          <td className={cn("px-4 py-3 text-sm", className)} {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
