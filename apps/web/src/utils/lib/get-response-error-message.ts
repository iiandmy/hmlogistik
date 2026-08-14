export const getResponseErrorMessage = async (
    response: Response,
    fallbackMessage: string,
): Promise<string> => {
    try {
        const body = await response.json() as { message?: string | string[] };
        if (Array.isArray(body.message)) {
            return body.message.join('; ');
        }
        if (typeof body.message === 'string' && body.message.length > 0) {
            return body.message;
        }
    }
    catch {
        return fallbackMessage;
    }

    return fallbackMessage;
};
