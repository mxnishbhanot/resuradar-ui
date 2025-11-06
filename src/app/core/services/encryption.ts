import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EncryptionService {
  private keyString = environment.keyString;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  private async getCryptoKey() {
    const keyData = this.encoder.encode(this.keyString);
    return crypto.subtle.importKey('raw', keyData, 'AES-CBC', false, ['encrypt', 'decrypt']);
  }

  async encryptObject(obj: any) {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const data = this.encoder.encode(JSON.stringify(obj));
    const key = await this.getCryptoKey();

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, data);

    return {
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    };
  }

  async decryptToObject(payload: any) {
    const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
    const key = await this.getCryptoKey();

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, encrypted);
    return JSON.parse(this.decoder.decode(decrypted));
  }
}
