import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // This makes the service a singleton and provides it at the root level
})
export class DeviceCacheService {
  private cachedDeviceData: any = {};

  setCache(key: string, data: any): void {
    this.cachedDeviceData[key] = data;
  }

  getCache(key: string): any {
    return this.cachedDeviceData[key];
  }

  clearCache(): void {
    this.cachedDeviceData = {};
  }
}