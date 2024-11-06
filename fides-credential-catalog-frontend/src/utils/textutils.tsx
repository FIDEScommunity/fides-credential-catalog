
export function addNonVisibleHtmlBreaks(value: string) : string {

    function findPositionOfFirstSpecialChar(input: string): number {
        const specialChars = [' ', ',', '.', ';'];
        const indices = specialChars.map(char => input.indexOf(char)).filter(index => index !== -1);

        return indices.length === 0 ? input.length : Math.min(...indices);
    }

    function findFirstCapitalCharAfterPosition(input: string, position: number): number {
        for (let i = position; i < input.length; i++) {
            if (input[i] >= 'A' && input[i] <= 'Z') {
                return i;
            }
        }
        return -1;
    }

    let positionOfFirstSpecialChar = findPositionOfFirstSpecialChar(value);
    if (positionOfFirstSpecialChar > 30) {
        const firstCapitalPosition = findFirstCapitalCharAfterPosition(value, 0);
        if (firstCapitalPosition === -1) {
            value = value.substring(0, 30) + '&ZeroWidthSpace;' + addNonVisibleHtmlBreaks(value.substring(30));
        } else {
            value = value.substring(0, firstCapitalPosition) + '&ZeroWidthSpace;' + value.substring(firstCapitalPosition, firstCapitalPosition + 1) + addNonVisibleHtmlBreaks(value.substring(firstCapitalPosition + 1));
        }
    } else if (positionOfFirstSpecialChar < value.length) {
        value = value.substring(0, positionOfFirstSpecialChar + 1) + addNonVisibleHtmlBreaks(value.substring(positionOfFirstSpecialChar + 1));
    }

    return value
        .replaceAll(':', ':&ZeroWidthSpace;')
        .replaceAll('_', '_&ZeroWidthSpace;')
        .replaceAll('-', '-&ZeroWidthSpace;')
        .replaceAll('.', '.&ZeroWidthSpace;')
        .replaceAll(',', ',&ZeroWidthSpace;')
}
