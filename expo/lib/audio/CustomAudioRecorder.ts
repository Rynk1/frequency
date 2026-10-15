import { Platform } from 'react-native';

export interface RecordingResult {
  uri: string;
  durationSeconds: number;
  base64?: string | null;
}

export class CustomAudioRecorder {
  private nativeRecording: any = null;
  private mediaRecorder: any = null;
  private webAudioChunks: Blob[] = [];
  private recordingStartTime: number = 0;

  private getAudioModule(): typeof import('expo-av') | null {
    try {
      return require('expo-av');
    } catch {
      return null;
    }
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          return true;
        }
        return false;
      } else {
        const expoAv = this.getAudioModule();
        if (expoAv && expoAv.Audio) {
          const response = await expoAv.Audio.requestPermissionsAsync();
          return response.granted;
        }
        return false;
      }
    } catch (err) {
      console.warn('[CustomAudioRecorder] Permission request error:', err);
      return false;
    }
  }

  public async startRecording(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Microphone permission is required to record custom affirmations.');
    }

    this.recordingStartTime = Date.now();

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.webAudioChunks = [];
        const mediaRecorder = new (window as any).MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event: any) => {
          if (event.data && event.data.size > 0) {
            this.webAudioChunks.push(event.data);
          }
        };

        this.mediaRecorder = mediaRecorder;
        mediaRecorder.start();
      }
    } else {
      const expoAv = this.getAudioModule();
      if (expoAv && expoAv.Audio) {
        const { Audio } = expoAv;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await recording.startAsync();
        this.nativeRecording = recording;
      }
    }
  }

  public async stopRecording(): Promise<RecordingResult> {
    const durationSeconds = Math.max(1, Math.round((Date.now() - this.recordingStartTime) / 1000));

    if (Platform.OS === 'web') {
      if (this.mediaRecorder) {
        return new Promise<RecordingResult>((resolve, reject) => {
          this.mediaRecorder.onstop = () => {
            try {
              const audioBlob = new Blob(this.webAudioChunks, { type: 'audio/webm' });
              const uri = URL.createObjectURL(audioBlob);
              const reader = new FileReader();

              reader.onloadend = () => {
                const base64Data = typeof reader.result === 'string' ? reader.result : null;
                resolve({
                  uri,
                  durationSeconds,
                  base64: base64Data,
                });
              };
              reader.readAsDataURL(audioBlob);
            } catch (err) {
              reject(err);
            }
          };

          this.mediaRecorder.stop();
          if (this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
          }
          this.mediaRecorder = null;
        });
      } else {
        throw new Error('No web recorder active');
      }
    } else {
      if (this.nativeRecording) {
        await this.nativeRecording.stopAndUnloadAsync();
        const uri = this.nativeRecording.getURI();
        this.nativeRecording = null;

        const expoAv = this.getAudioModule();
        if (expoAv && expoAv.Audio) {
          await expoAv.Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
          });
        }

        if (!uri) {
          throw new Error('Failed to retrieve recording file URI');
        }

        return {
          uri,
          durationSeconds,
        };
      } else {
        throw new Error('No native recorder active');
      }
    }
  }
}
