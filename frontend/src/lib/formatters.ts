export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

export const fmtPct = (n: number, digits = 1) =>
  `${n >= 0 ? "" : ""}${n.toFixed(digits)}%`;

export const fmtCr = (n: number) => `₹${n.toFixed(1)} Cr`;

export const fmtScore = (n: number) => n.toFixed(1);
