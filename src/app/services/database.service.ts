import { Injectable } from '@angular/core';
import { Log } from './log.service';

export enum TableKeys {
    AudioFiles = 'audioFiles'
}

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    private db?: IDBDatabase;

    constructor() {
        this.openDatabase();
    }

    private openDatabase() {
        const request = window.indexedDB.open('myDB', 1);

        request.onerror = (event) => {
            Log.error('Database', 'IndexedDB error:', event);
        };

        request.onsuccess = (event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            Log.info('Database', 'Successfully opened');
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const store = db.createObjectStore(TableKeys.AudioFiles, { keyPath: 'key' });
            Log.info('Database', 'Successfully upgraded');
        };
    }

    public async saveByteArray(key: string, byteArray: Uint8Array) {
        return new Promise<void>((resolve, reject) => {
            if (!this.db) {
                reject('Called saveByteArray before DB init');
                return;
            }
            const transaction = this.db.transaction([TableKeys.AudioFiles], 'readwrite');
            const store = transaction.objectStore(TableKeys.AudioFiles);
            const request = store.put({ key: key, value: byteArray });

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    public async getByteArray(key: string): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            if (!this.db) {
                reject('Called getByteArray before DB init');
                return;
            }
            const transaction = this.db.transaction([TableKeys.AudioFiles], 'readonly');
            const store = transaction.objectStore(TableKeys.AudioFiles);
            const request = store.get(key);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.value);
                } else {
                    reject(new Error('Key not found in IndexedDB'));
                }
            };
        });
    }
}