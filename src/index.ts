import React from 'react';
import { registerPlugin } from '@psychedcms/admin-core';
import type { InputResolverProps } from '@psychedcms/admin-core';

import { GeolocationInput } from './GeolocationInput.tsx';
import { enMessages } from './i18n/en.ts';
import { frMessages } from './i18n/fr.ts';

registerPlugin({
    inputResolvers: [
        {
            types: ['geolocation'],
            resolve: (props: InputResolverProps) =>
                React.createElement(GeolocationInput, props),
        },
    ],
    i18nMessages: { en: enMessages, fr: frMessages },
});

export { GeolocationInput } from './GeolocationInput.tsx';
