export function formatDateTimeForDisplay(date: Date | undefined) {
    if ((date === undefined) || (date === null)) {
        return "";
    }
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    let month = '' + (date.getMonth() + 1)
    let day = '' + date.getDate()
    let year = date.getFullYear();
    let hours = ("00" + date.getHours()).slice(-2);
    let minutes = ("00" + date.getMinutes()).slice(-2);

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return day + '-' + month + '-' + year + ' ' + hours + ":" + minutes;
}

export function formatDateForDisplay(date: Date | undefined) {
    if ((date === undefined) || (date === null)) {
        return "";
    }
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    let month = '' + (date.getMonth() + 1)
    let day = '' + date.getDate()
    let year = date.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return day + '-' + month + '-' + year;
}

export function formatTimeForDisplay(date: Date | undefined) {
    if ((date === undefined) || (date === null)) {
        return "";
    }
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    let hours = ("00" + date.getHours()).slice(-2);
    let minutes = ("00" + date.getMinutes()).slice(-2);

    return hours + ":" + minutes;
}

export function toNullableDate(date: Date | string | undefined) {
    if (date) {
        return new Date(date);
    }
    return undefined;
}
