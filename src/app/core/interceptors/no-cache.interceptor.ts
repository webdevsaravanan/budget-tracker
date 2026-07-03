import { HttpInterceptorFn } from '@angular/common/http';

export const noCacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only apply to GET requests targeting the npoint API
  if (req.method !== 'GET' || !req.url.includes('api.npoint.io')) {
    return next(req);
  }

  // Use a query parameter cache-buster to prevent browser caching.
  // Avoid setting custom headers (Cache-Control, Pragma, Expires) on cross-origin
  // requests, as they trigger CORS preflight (OPTIONS) requests, adding latency.
  const busted = req.clone({
    params: req.params.set('_cb', Date.now().toString())
  });

  return next(busted);
};