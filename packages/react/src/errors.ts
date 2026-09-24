export class ZplAiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message); this.name = "ZplAiError"; this.status = status;
  }
}
