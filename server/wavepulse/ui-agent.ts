"use client";
import { Agent, Channel, WebSocketChannel } from '@wavemaker/wavepulse-agent';
import { CALLS } from '@/wavepulse/constants';
import axios from 'axios';
import { Subject } from 'rxjs';

const WAVEPULSE_SESSION_DATA = 'wavepulse:session_data';

export class UIAgent extends Agent {

    private connectionSubject = new Subject();
    private _isConnected = false;
    private _sessionData = {} as any;
    private _currentSessionData = {} as any;
    private _sessionDataKey = '';

    constructor(private wsurl: string,
        private httpurl: string,
        public channelId: string,
        private localStorage: Storage,
        sessionDataKey?: string,) {
        sessionDataKey = sessionDataKey || localStorage.getItem(WAVEPULSE_SESSION_DATA) || '';
        super(sessionDataKey ? {
            send: () => {},
            setListener: () => {}
        } as Channel: WebSocketChannel.connect({
            url: wsurl,
            path: '/wavepulse/socket.io',
            channelId: channelId
        }));
        if (!sessionDataKey) {
            this.checkForWavePulseAgent();
        };
        this._sessionDataKey = sessionDataKey || '';
    }

    get sessionData() {
        return this._sessionData;
    }

    get currentSessionData() {
        return this._currentSessionData;
    }

    get sessionDataKey() {
        return this._sessionDataKey;
    }

    set sessionDataKey(k: string) {
        const previousKey = this._sessionDataKey;
        if (k) {
            this.localStorage.setItem(WAVEPULSE_SESSION_DATA, k);
        } else {
            this.localStorage.removeItem(WAVEPULSE_SESSION_DATA);
        }
        // Only update if changed, and don't reload - let React handle state updates
        if (previousKey !== k) {
            this._sessionDataKey = k;
            // Instead of reloading, emit connection state change
            this.connectionSubject.next(this.isConnected);
        }
    }

    private checkTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 50; // Limit attempts
    private readonly RECONNECT_DELAY = 3000; // 3 seconds between attempts

    private async checkForWavePulseAgent() {
        // Clear any existing timeout
        if (this.checkTimeoutId) {
            clearTimeout(this.checkTimeoutId);
            this.checkTimeoutId = null;
        }

        // Reset attempts if we're already connected
        if (this._isConnected) {
            this.reconnectAttempts = 0;
            return;
        }

        // Check connection with retry logic
        const attemptConnection = async () => {
            if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
                console.warn('Max reconnection attempts reached. Stopping reconnection attempts.');
                return;
            }

            try {
                await this.invoke(CALLS.HANDSHAKE.WISH, [], {
                    timeout: 2000
                });
                this._isConnected = true;
                this.reconnectAttempts = 0;
                this.connectionSubject.next(this.isConnected);
                // Clear timeout once connected
                if (this.checkTimeoutId) {
                    clearTimeout(this.checkTimeoutId);
                    this.checkTimeoutId = null;
                }
            } catch(e) {
                this.reconnectAttempts++;
                // Retry with exponential backoff (capped at 10 seconds)
                const delay = Math.min(this.RECONNECT_DELAY * Math.pow(1.5, Math.min(this.reconnectAttempts / 5, 2)), 10000);
                this.checkTimeoutId = setTimeout(attemptConnection, delay);
            }
        };

        // Start first attempt immediately
        attemptConnection();
    }

    get isConnected() {
        return this._isConnected && !this.sessionDataKey;
    }

    public onConnect(callback : Function) {
        if (this.isConnected) {
            callback();
        }
        const destroy = this.connectionSubject.subscribe(() => {
            if(this.isConnected) {
                callback();
                destroy.unsubscribe();
            }
        });
    }

    public getWavepulseUrl({appId, expoUrl} : {appId?: string, expoUrl?: string}) {
        if (appId) {
            return axios.get(`${this.httpurl}/api/service/url?appId=${appId}&channelId=${this.channelId}`).then(res => res.data);
        } else if(expoUrl) {
            return axios.get(`${this.httpurl}/api/service/url?expoUrl=${expoUrl}&channelId=${this.channelId}`).then(res => res.data);
        }
        return Promise.resolve('');
    }

    exportSessionData(name: string) {
        name = name + '.wavepulse';
        const form = new FormData();
        form.append('filename', name);
        const entries = [] as any;
        Object.keys(this.currentSessionData).forEach((k: string) => {
            form.append(k, JSON.stringify(this.currentSessionData[k]));
            entries.push(k);
        });
        form.append('entries', JSON.stringify(entries));
        return axios.post(`${this.httpurl}/api/session/data/export`, form,  {
            headers: {
                'Content-Type': 'multipart/form'
            }
        }).then(res => {
            window.location.href = `${this.httpurl}/api/session/data/${res.data.path}?name=${name}.zip`;
        });
    }

    importSessionData(file: any) {
        const formData = new FormData();
        formData.append("file", file);
        return axios.post(`${this.httpurl}/api/session/data/import`, formData, {
            headers: {
                'Content-Type': 'multipart/form'
            }
        }).then((res) => {
            this._sessionData = {...res.data};
            // Use setter to update sessionDataKey properly without reload
            this.sessionDataKey = file.name;
        });
    }
}