import type { FC } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { App as AppContext, ConfigProvider } from 'antd';
import locale from 'antd/locale/ru_RU';
import dayjs from 'dayjs';

import { router } from './router';
import './app.css';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const queryClient = new QueryClient();

const App: FC = () => (
    <ConfigProvider
        locale={locale}
        theme={{
            components: {
                Divider: {
                    margin: 12,
                    marginLG: 12,
                },
            },
        }}
    >
        <AppContext>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </AppContext>
    </ConfigProvider>
);

export default App;
