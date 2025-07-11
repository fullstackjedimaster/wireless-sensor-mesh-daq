// src/utils/sounds.ts

export enum SoundEffect {
    Inject = "inject",
    Success = "success",
    Fail = "fail",
    Click = "click",
}

const audioMap: Record<SoundEffect, HTMLAudioElement> = {
    [SoundEffect.Inject]: new Audio("/sounds/inject.mp3"),
    [SoundEffect.Success]: new Audio("/sounds/success.mp3"),
    [SoundEffect.Fail]: new Audio("/sounds/fail.mp3"),
    [SoundEffect.Click]: new Audio("/sounds/click.mp3"),
};

export function playSound(effect: SoundEffect) {
    const audio = audioMap[effect];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
    }
}
