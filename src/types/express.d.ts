import type { TokenPayload } from './tokenPayload.ts';
declare global {
  namespace Express {
    interface Request {
      tokenPayload?: TokenPayload;
    }
  }
}
