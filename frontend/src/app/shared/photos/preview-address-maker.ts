import { Injectable } from '@angular/core';

// The browser's addresses for picked files (blob:…), which an <img> can show before anything is uploaded.
// Each one holds its file in memory until it is released, so whoever creates one releases it: the photo
// picker when a photo is removed or the picker empties, NewPostStore when the server's copy of a post
// replaces the pending one. Tests provide a stand-in, since the test browser has no object URLs.
@Injectable({ providedIn: 'root' })
export class PreviewAddressMaker {
  create(photo: File): string {
    return URL.createObjectURL(photo);
  }

  release(address: string): void {
    URL.revokeObjectURL(address);
  }
}
