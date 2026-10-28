export type ScreenId = 'home' | 'order' | 'prep' | 'cook' | 'plate' | 'album' | 'clear';

export type FlowEvent = 'pick' | 'album' | 'accept' | 'ready' | 'plate' | 'retry' | 'home' | 'clear';

/** 场景只按这张表走，避免各按钮各写一套跳转。 */
export function go(screen: ScreenId, event: FlowEvent): ScreenId {
  if (event === 'home') return 'home';
  if (screen === 'home' && event === 'pick') return 'order';
  if (screen === 'home' && event === 'album') return 'album';
  if (screen === 'home' && event === 'clear') return 'clear';
  if (screen === 'order' && event === 'accept') return 'prep';
  if (screen === 'prep' && event === 'ready') return 'cook';
  if (screen === 'cook' && event === 'plate') return 'plate';
  if (screen === 'plate' && event === 'retry') return 'order';
  if (screen === 'plate' && event === 'album') return 'album';
  return screen;
}
