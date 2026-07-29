/**
 * Форматирует число в строку вида "П-XX/XXX", где XX и XXX — это группы цифр числа,
 * дополненного ведущими нулями до 5 знаков. Если число по модулю больше 99999,
 * используются только последние 5 цифр. Отрицательные числа преобразуются в положительные.
 *
 * @param id - целое число (может быть отрицательным, дробная часть отбрасывается)
 * @param prefix - строка-префикс (по умолчанию 'П')
 * @returns строка в формате "П-XX/XXX"
 *
 * @example
 * formatId(15)      // "П-00/015"
 * formatId(1545)    // "П-01/545"
 * formatId(0)       // "П-00/000"
 * formatId(123456)  // "П-23/456" (использованы последние 5 цифр)
 */
export const formatId = (id: number, prefix: string = 'П'): string => {
    const num = Math.floor(Math.abs(id));
    const padded = String(num).slice(-5).padStart(5, '0');

    return `${prefix}-${padded.substring(0, 2)}/${padded.substring(2)}`;
};
