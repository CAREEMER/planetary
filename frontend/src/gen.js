const lerp = (a, b, t) => a + (b - a) * t;

export function generateFromSeedString(seed, versionSalt, rand) {
    const planet = {
        radius: lerp(0.6, 1.0, rand()),
        paletteIndex: Math.floor(rand() * 16),
        biomeNoiseScale: lerp(0.6, 2.0, rand()),
        detailNoiseScale: lerp(3.0, 8.0, rand()),
        tiltDeg: lerp(5, 35, rand()),
        rotationSpeed: lerp(0.001, 0.006, rand()),
    };

    const moonEnabled = rand() < 0.6;
    const moon = moonEnabled
        ? {
            radiusRatio: lerp(0.15, 0.35, rand()),
            orbitRadius: lerp(2.0, 3.5, rand()),
            orbitSpeed: lerp(0.01, 0.04, rand()),
            inclinationDeg: lerp(0, 25, rand()),
            paletteIndex: Math.floor(rand() * 6),
        }
        : null;

    return {planet, moon, seed};
}