"use client";

/**
 * Explains bulk workflow: Payload’s built-in row selection + Edit / Delete.
 */
export function ToolSuggestionsListHint() {
  return (
    <div
      className="tool-suggestions-list-hint"
      style={{
        marginBottom: "1rem",
        padding: "0.75rem 1rem",
        borderRadius: "var(--style-radius-m)",
        border: "1px solid var(--theme-elevation-150)",
        background: "var(--theme-elevation-50)",
        fontSize: "0.875rem",
        lineHeight: 1.5,
        color: "var(--theme-elevation-800)",
      }}
    >
      <strong style={{ display: "block", marginBottom: "0.35rem" }}>
        Review workflow
      </strong>
      <span>
        Use the buttons on a suggestion’s edit screen to <strong>Accept</strong> (requires a catalog
        category), <strong>Decline</strong>, or <strong>Delete</strong>. For multiple rows: select
        them, then use <strong>Edit</strong> to set Status and <strong>Suggested catalog category</strong>{" "}
        together, or <strong>Delete</strong> to remove suggestions (editors and admins).
      </span>
    </div>
  );
}
