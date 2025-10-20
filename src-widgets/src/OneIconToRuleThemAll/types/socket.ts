/**
 * Minimal socket interface for the methods we actually use
 */
export interface SocketLike {
    getState(oid: string): Promise<{ val?: unknown } | null | undefined>;
    getObject(oid: string): Promise<unknown>;
}
