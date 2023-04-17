import '../styles/global.css';
import type { AppType } from 'next/app';
import { api } from '../utils/api';

import 'react-notifications-component/dist/theme.css';
import { ReactNotifications } from 'react-notifications-component';

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <ReactNotifications />
      <Component {...pageProps} />
    </>
  );
};

export default api.withTRPC(MyApp);
