import '../styles/global.css';
import type { AppType } from 'next/app';
import { api } from '../utils/api';

const MyApp: AppType = ({
  Component,
  pageProps,
}) => {
  return (
   
      <Component {...pageProps} />
  );
};

MyApp.getInitialProps = ({ ctx }) => {
  return {};
};

export default api.withTRPC(MyApp);
