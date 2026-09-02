import { FrequencyAudioSpec } from '../AudioTypes';

export class WebAudioRenderer {
  private audioContext: AudioContext | null = null;
  private oscLeft: OscillatorNode | null = null;
  private oscRight: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  private createAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      return new AudioContextClass();
    } catch {
      return null;
    }
  }

  async play(spec: FrequencyAudioSpec, volume: number = 0.2): Promise<void> {
    await this.stop();

    if (!this.audioContext) {
      this.audioContext = this.createAudioContext();
    }
    if (!this.audioContext) {
      throw new Error('Web Audio API is not supported in this environment');
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const ctx = this.audioContext;
    const gain = ctx.createGain();
    const safeVolume = Math.max(0, Math.min(1, volume)) * 0.2; // Cap at 0.2 for safety
    gain.gain.setValueAtTime(safeVolume, ctx.currentTime);

    if (spec.modality === 'pure_tone') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(spec.frequency, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      this.oscLeft = osc;
    } else if (spec.modality === 'binaural_beat') {
      const carrier = spec.carrierFrequency;
      const beat = spec.beatFrequency;

      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();

      oscL.type = 'sine';
      oscR.type = 'sine';

      oscL.frequency.setValueAtTime(carrier, ctx.currentTime);
      oscR.frequency.setValueAtTime(carrier + beat, ctx.currentTime);

      // Stereo separation via ChannelMergerNode or StereoPannerNode
      if (typeof ctx.createStereoPanner === 'function') {
        const pannerL = ctx.createStereoPanner();
        const pannerR = ctx.createStereoPanner();
        pannerL.pan.setValueAtTime(-1, ctx.currentTime); // Left
        pannerR.pan.setValueAtTime(1, ctx.currentTime);  // Right

        oscL.connect(pannerL);
        pannerL.connect(gain);

        oscR.connect(pannerR);
        pannerR.connect(gain);
      } else if (typeof ctx.createChannelMerger === 'function') {
        const merger = ctx.createChannelMerger(2);
        oscL.connect(merger, 0, 0); // Left channel
        oscR.connect(merger, 0, 1); // Right channel
        merger.connect(gain);
      } else {
        oscL.connect(gain);
        oscR.connect(gain);
      }

      oscL.start(ctx.currentTime);
      oscR.start(ctx.currentTime);

      this.oscLeft = oscL;
      this.oscRight = oscR;
    }

    gain.connect(ctx.destination);
    this.gainNode = gain;
  }

  setVolume(volume: number): void {
    if (this.gainNode && this.audioContext) {
      const safeVolume = Math.max(0, Math.min(1, volume)) * 0.2;
      this.gainNode.gain.linearRampToValueAtTime(
        safeVolume,
        this.audioContext.currentTime + 0.05
      );
    }
  }

  async stop(): Promise<void> {
    if (this.oscLeft) {
      try {
        this.oscLeft.stop();
        this.oscLeft.disconnect();
      } catch {}
      this.oscLeft = null;
    }
    if (this.oscRight) {
      try {
        this.oscRight.stop();
        this.oscRight.disconnect();
      } catch {}
      this.oscRight = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
  }

  async destroy(): Promise<void> {
    await this.stop();
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }
}
