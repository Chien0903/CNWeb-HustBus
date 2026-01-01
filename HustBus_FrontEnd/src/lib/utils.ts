import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function fixMojibake(data: any): any {
    if (typeof data === 'string') {
        try {
            const bytes = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                bytes[i] = data.charCodeAt(i);
            }
            const decoded = new TextDecoder('utf-8').decode(bytes);
            if (decoded.indexOf('\0') !== -1) return data;
            return decoded;
        } catch (e) {
            return data;
        }
    } else if (Array.isArray(data)) {
        return data.map(fixMojibake);
    } else if (typeof data === 'object' && data !== null) {
        const result: any = {};
        for (const key in data) {
            result[key] = fixMojibake(data[key]);
        }
        return result;
    }
    return data;
}
