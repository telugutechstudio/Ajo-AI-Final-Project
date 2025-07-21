
/**
 * Triggers a browser download for the given Blob.
 * @param blob The Blob data to download.
 * @param fileName The name of the file to be saved.
 */
export const downloadFile = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Converts a Blob object to a Base64 encoded string.
 * @param blob The Blob to convert.
 * @returns A promise that resolves with the Base64 string (without the data: prefix).
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read blob as a Base64 string."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};

/**
 * Converts a base64 string to a Blob object.
 * @param base64 The base64 string (without the data: prefix).
 * @param mimeType The MIME type of the data.
 * @returns A Blob object.
 */
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};


/**
 * Formats a number of bytes into a human-readable string (KB, MB, GB).
 * @param bytes The number of bytes.
 * @param decimals The number of decimal places to include.
 * @returns A formatted string representation of the file size.
 */
export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * A utility to map language names to BCP 47 tags for the Web Speech API.
 * @param languageName The full name of the language (e.g., 'English', 'Telugu').
 * @returns The corresponding BCP 47 tag string (e.g., 'en-US', 'te-IN') or 'en-US' as a fallback.
 */
export const getBcp47Tag = (languageName: string): string => {
    const map: { [key: string]: string } = {
        'Afrikaans': 'af-ZA',
        'Albanian': 'sq-AL',
        'Amharic': 'am-ET',
        'Arabic': 'ar-SA',
        'Armenian': 'hy-AM',
        'Azerbaijani': 'az-AZ',
        'Basque': 'eu-ES',
        'Bengali': 'bn-BD',
        'Bosnian': 'bs-BA',
        'Bulgarian': 'bg-BG',
        'Catalan': 'ca-ES',
        'Chinese (Simplified)': 'zh-CN',
        'Chinese (Traditional)': 'zh-TW',
        'Croatian': 'hr-HR',
        'Czech': 'cs-CZ',
        'Danish': 'da-DK',
        'Dutch': 'nl-NL',
        'English': 'en-US',
        'Estonian': 'et-EE',
        'Filipino': 'fil-PH',
        'Finnish': 'fi-FI',
        'French': 'fr-FR',
        'Galician': 'gl-ES',
        'Georgian': 'ka-GE',
        'German': 'de-DE',
        'Greek': 'el-GR',
        'Gujarati': 'gu-IN',
        'Hebrew': 'he-IL',
        'Hindi': 'hi-IN',
        'Hungarian': 'hu-HU',
        'Icelandic': 'is-IS',
        'Indonesian': 'id-ID',
        'Italian': 'it-IT',
        'Japanese': 'ja-JP',
        'Javanese': 'jv-ID',
        'Kannada': 'kn-IN',
        'Kazakh': 'kk-KZ',
        'Khmer': 'km-KH',
        'Korean': 'ko-KR',
        'Lao': 'lo-LA',
        'Latvian': 'lv-LV',
        'Lithuanian': 'lt-LT',
        'Macedonian': 'mk-MK',
        'Malay': 'ms-MY',
        'Malayalam': 'ml-IN',
        'Marathi': 'mr-IN',
        'Nepali': 'ne-NP',
        'Norwegian': 'no-NO',
        'Persian': 'fa-IR',
        'Polish': 'pl-PL',
        'Portuguese': 'pt-BR',
        'Romanian': 'ro-RO',
        'Russian': 'ru-RU',
        'Serbian': 'sr-RS',
        'Sinhala': 'si-LK',
        'Slovak': 'sk-SK',
        'Slovenian': 'sl-SI',
        'Spanish': 'es-ES',
        'Sundanese': 'su-ID',
        'Swahili': 'sw-TZ',
        'Swedish': 'sv-SE',
        'Tamil': 'ta-IN',
        'Telugu': 'te-IN',
        'Thai': 'th-TH',
        'Turkish': 'tr-TR',
        'Ukrainian': 'uk-UA',
        'Urdu': 'ur-PK',
        'Uzbek': 'uz-UZ',
        'Vietnamese': 'vi-VN',
        'Zulu': 'zu-ZA'
    };
    return map[languageName] || 'en-US'; // Fallback to English
};