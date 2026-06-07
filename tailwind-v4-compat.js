const plugin = require("tailwindcss/plugin");

/** Maps Tailwind v4-only utility class names used in shadcn/ui for v3 builds. */
module.exports = plugin(({ addUtilities }) => {
  addUtilities({
    ".outline-hidden": {
      outline: "2px solid transparent",
      "outline-offset": "2px",
    },
    ".rounded-xs": {
      "border-radius": "0.125rem",
    },
    ".w-\\(--sidebar-width\\)": {
      width: "var(--sidebar-width)",
    },
    ".w-\\(--sidebar-width-icon\\)": {
      width: "var(--sidebar-width-icon)",
    },
    ".max-w-\\(--skeleton-width\\)": {
      "max-width": "var(--skeleton-width)",
    },
    ".max-h-\\(--radix-select-content-available-height\\)": {
      "max-height": "var(--radix-select-content-available-height)",
    },
    ".origin-\\(--radix-hover-card-content-transform-origin\\)": {
      "transform-origin": "var(--radix-hover-card-content-transform-origin)",
    },
    ".origin-\\(--radix-select-content-transform-origin\\)": {
      "transform-origin": "var(--radix-select-content-transform-origin)",
    },
    ".origin-\\(--radix-tooltip-content-transform-origin\\)": {
      "transform-origin": "var(--radix-tooltip-content-transform-origin)",
    },
    ".focus-visible\\:outline-ring:focus-visible": {
      outline: "1px solid var(--ring)",
    },
    ".group[data-collapsible=\"icon\"] .group-data-\\[collapsible\\=icon\\]\\:w-\\(--sidebar-width-icon\\)":
      {
        width: "var(--sidebar-width-icon)",
      },
    ".group[data-collapsible=\"icon\"] .group-data-\\[collapsible\\=icon\\]\\:size-8\\!": {
      width: "2rem !important",
      height: "2rem !important",
    },
    ".group[data-collapsible=\"icon\"] .group-data-\\[collapsible\\=icon\\]\\:p-2\\!": {
      padding: "0.5rem !important",
    },
  });
});
