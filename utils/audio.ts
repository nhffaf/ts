export const playScream = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // Create a chaotic cluster of oscillators
    const freqs = [400, 500, 600, 800, 1200];
    
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();

      osc.type = 'sawtooth';
      
      // Pitch drop for scream effect
      osc.frequency.setValueAtTime(f + Math.random() * 200, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 1.5);

      // Tremolo/Roughness
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 50 + Math.random() * 50;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 500;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);

      // Random panning
      pan.pan.setValueAtTime((Math.random() * 2) - 1, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3 / freqs.length, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 2);

      osc.connect(pan);
      pan.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 2);
    });

    // Add noise burst
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1);
    
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);

  } catch (e) {
    console.error("Audio play failed", e);
  }
};