export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buildProgressiveHint(answer: string, revealedCount: number) {
  const chars = [...answer];
  let revealed = 0;

  return chars
    .map((char) => {
      if (char === " ") {
        return " ";
      }

      if (revealed < revealedCount) {
        revealed += 1;
        return char;
      }

      return "*";
    })
    .join("");
}
