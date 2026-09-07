export function AlphanumericCheck(inputString) {
    const regex = /^[A-Z0-9]+$/;
    return regex.test(inputString);
}