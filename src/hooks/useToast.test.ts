import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';
import { useToastStore } from '../store/toastStore';

describe('useToast', () => {
  beforeEach(() => {
    // Reset the underlying store between tests since it's a module-level singleton
    useToastStore.setState({ toasts: [] });
  });

  it('starts with no toasts', () => {
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('toast.success adds a toast with variant "success"', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.success('Task added');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ message: 'Task added', variant: 'success' });
  });

  it('toast.error adds a toast with variant "error"', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.error('Something went wrong');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts[0]).toMatchObject({ message: 'Something went wrong', variant: 'error' });
  });

  it('toast.info adds a toast with variant "info"', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.info('Heads up');
    });

    expect(useToastStore.getState().toasts[0]).toMatchObject({ variant: 'info' });
  });

  it('each toast gets a unique id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.success('First');
      result.current.toast.success('Second');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(2);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('dismiss removes a toast by id', () => {
    const { result } = renderHook(() => useToast());

    let id = '';
    act(() => {
      id = result.current.toast.success('Dismiss me');
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss(id);
    });
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('dismissing an unknown id does not throw and leaves other toasts intact', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.success('Stays');
    });

    expect(() => {
      act(() => {
        result.current.dismiss('nonexistent-id');
      });
    }).not.toThrow();

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
