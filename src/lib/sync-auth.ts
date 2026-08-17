import { timingSafeEqual } from "crypto";

export function isAuthorizedSyncRequest(req: Request): boolean {
    const expected = process.env.SYNC_SECRET;
    if (!expected) return false;

    const provided = req.headers.get("x-sync-secret");
    if (!provided) return false;

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
}
