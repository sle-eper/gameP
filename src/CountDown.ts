export default class CountDown {
    countdownContainer: HTMLDivElement;
    private audioCtx?: AudioContext | null;

    constructor() {
        this.countdownContainer = document.createElement('div');
        this.countdownContainer.className = 'countdown-container';
        this.countdownContainer.innerHTML = `
            <div class="countdown">
                <div class="number"><h2>3</h2></div>
            </div>
        `;
        const canvasContainer = document.querySelector('.canvas-container');
        console.debug(' CountDown constructor, canvasContainer=', canvasContainer);
        if (canvasContainer) {
            canvasContainer.appendChild(this.countdownContainer);
        }
    }

    enableSound() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            } else if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        } catch (e) {
            this.audioCtx = null;
        }
    }

    private playTone(freq: number, duration = 0.15) {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);
        const now = ctx.currentTime;
        g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
        o.start(now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        o.stop(now + duration + 0.02);
    }

    sleep(ms: number) {
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }

    async start(onComplete?: () => void) {
        const countdown = this.countdownContainer.querySelector('.countdown') as HTMLElement;
        const numberElement = countdown.querySelector('.number') as HTMLElement;
        const number = numberElement.querySelector('h2') as HTMLElement;
        let count = 3;
        this.countdownContainer.classList.remove('hidden');
        while (count > 0) {
            // play a short tone if audio enabled
            this.playTone(440 + count * 60, 0.12);
            numberElement.classList.remove('fade-out');
            numberElement.classList.add('active');
            number.textContent = String(count);
            await this.sleep(1000);
            // small tick after visible
            this.playTone(600, 0.06);
            numberElement.classList.add('fade-out');
            numberElement.classList.remove('active');
            await this.sleep(500);
            count--;
        }
        numberElement.classList.remove('fade-out');
        numberElement.classList.add('active', 'go');
        number.textContent = 'GO!';
        await this.sleep(1000);
        numberElement.classList.add('fade-out');
        numberElement.classList.remove('active');
        await this.sleep(500);
        this.countdownContainer.classList.add('hidden');
        if (onComplete && typeof onComplete === 'function') onComplete();
    }
}
