function basenameSegment(): string {
  return (process.env.APP_BASE_PATH || '').replace(/^\/+|\/+$/g, '');
}

/** Путь с учётом базы приложения (например /voting-platform на GitHub Pages). */
export function appPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const seg = basenameSegment();
  return seg ? `/${seg}${p}` : p;
}

/** Полный URL для копирования ссылок (работает при деплое в подкаталог). */
export function absoluteAppUrl(path: string): string {
  return `${window.location.origin}${appPath(path)}`;
}

/** Basename для BrowserRouter: при деплое в подкаталог — сегмент из APP_BASE_PATH, иначе корень. */
export function routerBasename(): string {
  const seg = basenameSegment();
  return seg ? `/${seg}` : '/';
}
