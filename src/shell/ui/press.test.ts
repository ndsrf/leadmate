import { handlePress } from './press';

describe('handlePress', () => {
  it('plays press feedback and runs the action in the same tick', () => {
    const order: string[] = [];
    handlePress(() => order.push('action'), false, { press: () => void order.push('feedback') });
    expect(order).toEqual(['feedback', 'action']);
  });

  it('does nothing when disabled', () => {
    const press = jest.fn();
    const action = jest.fn();
    handlePress(action, true, { press });
    expect(press).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });

  it('adds no awaited work: it returns undefined, not a promise', () => {
    expect(handlePress(() => {}, false, { press: () => {} })).toBeUndefined();
  });

  it('still runs the action when the feedback backend is silent (default service)', () => {
    const action = jest.fn();
    handlePress(action);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
