/** 小游戏运行时有这些全局，但编译目标不带 DOM。 */
export {};

declare global {
  /** 小游戏全局。Node 测试里没有这个名字。 */
  const GameGlobal: Record<string, unknown> | undefined;
  const globalThis: Record<string, unknown>;

  const console: {
    log(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
  };

  function setTimeout(handler: () => void, timeout: number): number;
  function clearTimeout(handle: number): void;
}
