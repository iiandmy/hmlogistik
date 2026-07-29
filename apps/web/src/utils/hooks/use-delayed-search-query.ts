import { useEffect, useRef, useState } from 'react';

interface Args {
    delay?: number;
    initialValue?: string;
    skipInitialCall?: boolean;
}

const defaultInitialArgs = {
    delay: 300,
    initialValue: '',
    skipInitialCall: false,
};

export interface DelayedSearchQueryValue {
    q: string;
    setSearchQuery: (value: string) => void;
    delayedSearchQuery: string;
    isTyping: boolean;
}

export const useDelayedSearchQuery = (args: Args = defaultInitialArgs): DelayedSearchQueryValue => {
    const [searchQuery, setSearchQuery] = useState<string>(args.initialValue || defaultInitialArgs.initialValue);
    const [delayedSearchQuery, setDelayedSearchQuery] = useState<string>(
        args.initialValue || defaultInitialArgs.initialValue,
    );
    const [isTyping, setIsTyping] = useState<boolean>(false);
    // eslint-disable-next-line react/naming-convention-ref-name
    const isFirstRender = useRef(true);

    useEffect(() => {
        // eslint-disable-next-line react/set-state-in-effect
        setIsTyping(true);
    }, [searchQuery]);

    useEffect(() => {
        if (args.skipInitialCall && isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timeout = setTimeout(() => {
            setDelayedSearchQuery(searchQuery);
            setIsTyping(false);
            isFirstRender.current = false;
        }, args.delay || defaultInitialArgs.delay);

        return (): void => clearTimeout(timeout);
    }, [searchQuery, args.delay, args.skipInitialCall]);

    return { q: searchQuery, setSearchQuery, delayedSearchQuery, isTyping };
};
