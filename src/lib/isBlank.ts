/**
 * Returns `true` if the passed value is:
 *
 * - `undefined`
 * - `null`
 * - `NaN`
 * - `""` (an empty string)
 * - `[]` (an empty array)
 * - `{}` (an empty object)
 *
 * @param data any value
 */
export const isBlank = (data: any): boolean => {

    // Null or undefined
    if (data == undefined) { return true }
    if (data == null)      { return true }

    // NaN
    if (data?.toString() == "NaN") {
        return true
    }

    // Empty string
    if (data === "") {
        return true
    }

    // Empty array
    if (Array.isArray(data) && data.length === 0) {
        return true
    }

    // Empty object
    // if (JSON.stringify(data) === "{}") {
    //     return true;
    // }

    // Empty object
    if (data.constructor === Object && Object.keys(data).length === 0) {
        return true
    }

    // Looks like there is a value
    return false
}