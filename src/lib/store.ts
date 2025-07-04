import type { StoredPlatform } from "./types";

export const savePlatform = (platform: StoredPlatform) => {
    const platforms = getPlatforms();
    platforms.push(platform);
    localStorage.setItem("platforms", JSON.stringify(platforms));
};

export const getPlatforms = (): StoredPlatform[] => {
    const platformsJson = localStorage.getItem("platforms");
    return platformsJson ? JSON.parse(platformsJson) : [];
};
