import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Cross-platform replacement for `Alert.alert`.
 *
 * `react-native-web` ships `Alert` as a no-op (`static alert() {}`), so every
 * error message, confirmation and success notice on web was silently dropped —
 * including sign-in failures and the privacy policy. On web this renders an
 * accessible DOM dialog instead; on native it delegates to `Alert.alert` so
 * platform behaviour (destructive styling, accessibility) is preserved.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons as any);
    return;
  }
  showWebDialog(title, message, buttons);
}

function showWebDialog(title: string, message?: string, buttons?: AlertButton[]): void {
  if (typeof document === 'undefined') return;

  const actions: AlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }];

  const previousFocus = document.activeElement as HTMLElement | null;

  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'presentation');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'rgba(3, 6, 15, 0.72)',
    backdropFilter: 'blur(4px)',
  } satisfies Partial<CSSStyleDeclaration>);

  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'hf-alert-title');
  if (message) dialog.setAttribute('aria-describedby', 'hf-alert-message');
  Object.assign(dialog.style, {
    width: '100%',
    maxWidth: '380px',
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '16px',
    padding: '22px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#F9FAFB',
  } satisfies Partial<CSSStyleDeclaration>);

  const titleEl = document.createElement('h2');
  titleEl.id = 'hf-alert-title';
  titleEl.textContent = title;
  Object.assign(titleEl.style, {
    margin: '0 0 8px',
    fontSize: '17px',
    fontWeight: '600',
    lineHeight: '1.35',
  });
  dialog.appendChild(titleEl);

  if (message) {
    const messageEl = document.createElement('p');
    messageEl.id = 'hf-alert-message';
    messageEl.textContent = message;
    Object.assign(messageEl.style, {
      margin: '0 0 20px',
      fontSize: '14px',
      lineHeight: '1.5',
      color: 'rgba(249,250,251,0.78)',
      whiteSpace: 'pre-wrap',
    });
    dialog.appendChild(messageEl);
  }

  const footer = document.createElement('div');
  Object.assign(footer.style, {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKeyDown, true);
    overlay.remove();
    previousFocus?.focus?.();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      const cancelButton = actions.find((b) => b.style === 'cancel');
      close();
      cancelButton?.onPress?.();
    }
  };
  document.addEventListener('keydown', onKeyDown, true);

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.text;

    const isCancel = action.style === 'cancel';
    const isDestructive = action.style === 'destructive';
    Object.assign(button.style, {
      padding: '10px 16px',
      borderRadius: '10px',
      border: isCancel ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
      background: isDestructive
        ? 'rgba(239,68,68,0.16)'
        : isCancel
          ? 'transparent'
          : 'rgba(99,102,241,0.9)',
      color: isDestructive ? '#FCA5A5' : '#F9FAFB',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      minWidth: '84px',
    } satisfies Partial<CSSStyleDeclaration>);

    button.addEventListener('click', () => {
      close();
      action.onPress?.();
    });
    footer.appendChild(button);
  });

  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      const cancelButton = actions.find((b) => b.style === 'cancel');
      if (cancelButton) {
        close();
        cancelButton.onPress?.();
      }
    }
  });

  document.body.appendChild(overlay);
  (footer.querySelector('button') as HTMLButtonElement | null)?.focus();
}
