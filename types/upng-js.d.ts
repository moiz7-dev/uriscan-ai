declare module 'upng-js' {
  export interface DecodedPng {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    frames: unknown[];
    tabs: Record<string, unknown>;
    data: Uint8Array;
  }

  export function decode(buffer: ArrayBuffer | Uint8Array): DecodedPng;
  export function toRGBA8(decoded: DecodedPng): ArrayBuffer[];

  const UPNG: {
    decode: typeof decode;
    toRGBA8: typeof toRGBA8;
  };
  export default UPNG;
}
