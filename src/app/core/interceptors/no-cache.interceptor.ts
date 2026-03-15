import { HttpInterceptorFn } from '@angular/common/http';

export const noCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);

  const busted = req.clone({
    params: req.params.set('_cb', Date.now().toString()),
    headers: req.headers
      .set('Cache-Control', 'no-cache, no-store, must-revalidate')
      .set('Pragma', 'no-cache')
      .set('Expires', '0'),
  });

  return next(busted);
};