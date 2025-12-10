import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EncryptionService {
  private platformId = inject(PLATFORM_ID);

  private keyString = environment.keyString;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  /** Detect browser (SSR-safe) */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Unified crypto accessor (Browser + Node) */
  private getCrypto(): Crypto {
    if (this.isBrowser()) {
      return window.crypto;
    }

    // Node SSR fallback (Node >=18 has globalThis.crypto)
    if (globalThis.crypto?.subtle) {
      return globalThis.crypto;
    }

    throw new Error(
      'No WebCrypto implementation available in SSR environment. Ensure Node 18+ or enable WebCrypto.'
    );
  }

  /** Base64 encode */
  private base64Encode(bytes: Uint8Array): string {
    if (this.isBrowser()) {
      return btoa(String.fromCharCode(...bytes));
    }
    return Buffer.from(bytes).toString('base64');
  }

  /** Base64 decode */
  private base64Decode(str: string): Uint8Array {
    if (this.isBrowser()) {
      return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    }
    return new Uint8Array(Buffer.from(str, 'base64'));
  }

  /** Import AES key */
  private async getCryptoKey(): Promise<CryptoKey> {
    const crypto = this.getCrypto();
    const keyData = this.encoder.encode(this.keyString);

    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /** Encrypt object → Base64 strings */
  async encryptObject(obj: any) {
    const crypto = this.getCrypto();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const data = this.encoder.encode(JSON.stringify(obj));
    const key = await this.getCryptoKey();

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      data
    );

    return {
      iv: this.base64Encode(iv),
      data: this.base64Encode(new Uint8Array(encrypted)),
    };
  }

  /** Decrypt back to object */
  async decryptToObject(payload: { iv: string; data: string }) {
    const crypto = this.getCrypto();

    const iv = this.base64Decode(payload.iv) as any;
    const encrypted = this.base64Decode(payload.data) as any;
    const key = await this.getCryptoKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      encrypted
    );

    return JSON.parse(this.decoder.decode(decrypted));
  }
}
