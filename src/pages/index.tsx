
import Head from 'next/head';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const IndexPage = () => {

  return (
    <>
      <Head>
        <title>Dundee</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col h-screen bg-slate-900 p-4">
       <AdvancedRealTimeChart  symbol="btcusdt" theme="dark"  autosize/>

        <div>
            <h1 className="text-4xl font-bold text-white">Dundee</h1>
        </div>
        <div>
            <h1 className="text-4xl font-bold text-white">Dundee</h1>
        </div>
        <div>
            <h1 className="text-4xl font-bold text-white">Dundee</h1>
        </div>
      </div>
    </>
  );
}

export default IndexPage
