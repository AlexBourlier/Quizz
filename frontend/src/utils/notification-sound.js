let audioCtx = null;
function getCtx() {
    if (!audioCtx)
        audioCtx = new AudioContext();
    return audioCtx;
}
function playTone(opts) {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = opts.type ?? "sine";
        osc.frequency.setValueAtTime(opts.frequency, ctx.currentTime);
        gain.gain.setValueAtTime(opts.gain ?? 0.15, ctx.currentTime);
        if (opts.fadeOut !== false) {
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + opts.duration);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + opts.duration);
    }
    catch {
        // AudioContext may be blocked before first user gesture — silently ignore
    }
}
/** Soft ping for a new chat room message */
export function playMessageSound() {
    playTone({ frequency: 880, duration: 0.12, gain: 0.1, type: "sine" });
}
/** Slightly warmer tone for an incoming DM */
export function playDmSound() {
    playTone({ frequency: 660, duration: 0.08, gain: 0.12, type: "sine" });
    setTimeout(() => playTone({ frequency: 880, duration: 0.1, gain: 0.1, type: "sine" }), 80);
}
