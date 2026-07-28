export function generateId(): number {
    const digits = 9;
    const multiplier = 1000000;
    const id = Math.floor(Math.random() * digits * multiplier) + multiplier;

    return id;
}
