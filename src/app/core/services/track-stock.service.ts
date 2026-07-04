import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface StockQuote {
  symbol: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class TrackStockService {
  private http = inject(HttpClient);
  private readonly API_URL = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=PGINVIT.BSE&apikey=72W9LNPJXK63X8PT';
  private readonly CACHE_KEY = 'stock_quote_cache';
  private readonly CACHE_TIME_KEY = 'stock_quote_timestamp';
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  getStockQuote(): Observable<StockQuote> {
    const cachedData = localStorage.getItem(this.CACHE_KEY);
    const cachedTime = localStorage.getItem(this.CACHE_TIME_KEY);

    if (cachedData && cachedTime) {
      const parsedTime = parseInt(cachedTime, 10);
      const now = Date.now();
      if (now - parsedTime < this.CACHE_DURATION) {
        try {
          const parsedData = JSON.parse(cachedData) as StockQuote;
          return of(parsedData);
        } catch (e) {
          console.error('Error parsing cached stock data, refetching:', e);
        }
      }
    }

    return this.http.get<any>(this.API_URL).pipe(
      map(res => {
        const quote = res['Global Quote'];
        if (!quote) {
          console.warn('AlphaVantage API limit reached or invalid response, using fallback mock data');
          const fallback = { symbol: 'PGINVIT.BSE', price: 94.03 };
          this.setCache(fallback);
          return fallback;
        }
        const data = {
          symbol: quote['01. symbol'] || 'PGINVIT.BSE',
          price: parseFloat(quote['05. price']) || 94.03
        };
        this.setCache(data);
        return data;
      }),
      catchError(err => {
        console.error('AlphaVantage API call failed, using fallback mock data:', err);
        const fallback = { symbol: 'PGINVIT.BSE', price: 94.03 };
        this.setCache(fallback);
        return of(fallback);
      })
    );
  }

  private setCache(data: StockQuote) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(this.CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  }
}
