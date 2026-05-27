import xss from "xss";
function sanitizeObject(input) {
    if (typeof input === "string") {
        return xss(input);
    }
    if (Array.isArray(input)) {
        return input.map((item) => sanitizeObject(item));
    }
    if (input && typeof input === "object") {
        return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, sanitizeObject(value)]));
    }
    return input;
}
export function sanitizeMiddleware(req, _res, next) {
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
}
