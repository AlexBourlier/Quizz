export function normalizeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
export function buildProgressiveHint(answer, revealedCount) {
    const chars = [...answer];
    let revealed = 0;
    return chars
        .map((char) => {
        if (char === " ")
            return " ";
        if (revealed < revealedCount) {
            revealed += 1;
            return char;
        }
        return "*";
    })
        .join("");
}
export function buildHintFromPositions(answer, revealedPositions) {
    return [...answer]
        .map((char, i) => {
        if (char === " ")
            return " ";
        return revealedPositions.has(i) ? char : "*";
    })
        .join("");
}
