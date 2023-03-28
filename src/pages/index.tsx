
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { api } from '../utils/api'
import { GiWillowTree } from 'react-icons/gi';
import { GoTerminal, GoSearch } from 'react-icons/go';

const IndexPage = () => {
    const status  = api.settings.status.useMutation()

    const [socketStatus, setSocketStatus]   = useState(true);
    const [ichibotStatus, setIchibotStatus] = useState(true);
    

  // create a timer for ever 10 seconds in useEffect
    useEffect(() => {
        const checkStatus = async () => {
            const res = await status.mutateAsync()
            setSocketStatus(res)
        }

        const interval = setInterval(() => {void checkStatus()}, 10000);
        return () => clearInterval(interval);


    }, []);

  return (
    <>
      <Head>
        <title>Dundee</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col  h-screen max-h-screen min-h-screen bg-slate-900 p-5 gap-5 ">
        <div className='flex flex-col gap-5 text-white'>
            <div className='flex flex-row gap-5'>
                <div className='flex bg-white/5 rounded-md p-5 gap-5 items-center'>
                    { socketStatus ?
                    <div className='flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-green-500'>
                        <GiWillowTree />
                    </div>
                    :
                    <div className='flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-red-500'>
                        <GiWillowTree />
                    </div>
                    }
                    <h1 className='text-lg font-bold'>Tree of Alpha: Websocket</h1>
                </div>
                <div className='flex bg-white/5 rounded-md p-5 gap-5 items-center'>
                    { ichibotStatus ?
                    <div className='flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-green-500'>
                        <GoTerminal title='Ichibot: Terminal'/>
                    </div>
                    :
                    <div className='flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-red-500'>
                        <GoTerminal title='Ichibot: Terminal'/>
                    </div>
                    }
                    <h1 className='text-lg font-bold'>Ichibot: Terminal</h1>
                </div>
                <div className='flex bg-white/[0.01] rounded-md flex-1'></div>
            </div>
            <h1 className='text-2xl font-bold pl-5'>Settings</h1>
            <div className='flex flex-col bg-white/5 rounded-md p-5 gap-2 justify-start'>
                <div className='flex flex-row text-lg gap-5'>
                    <h1 className='font-bold'>Notification Feeds</h1>
                    <label className='flex flex-row gap-2 items-center'>
                        <input type="checkbox" checked={true} className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded'/>
                        <p>Blogs</p>
                    </label>
                    <label className='flex flex-row gap-2 items-center'>
                        <input type="checkbox" checked={true} className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded'/>
                        <p>Twitter</p>
                    </label>
                    <label className='flex flex-row gap-2 items-center'>
                        <input type="checkbox" checked={true} className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded'/>
                        <p>Telegram</p>
                    </label>
                    <label className='flex flex-row gap-2 items-center'>
                        <input type="checkbox" checked={true} className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded'/>
                        <p>Unknown</p>
                    </label>
                <div/>
                </div>
            </div>
            <div className='flex flex-row gap-5'> 
                <div className='flex flex-1 flex-col bg-white/5 rounded-md p-5 gap-5 justify-start'>
                    <div className='flex flex-row items-center gap-5'>
                        <h1 className='text-lg font-bold'>Symbols</h1>
                        <GoSearch className='text-2xl ml-5'/>
                        <input className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-5 text-right" size={1}/>
                        <div className='px-3'>ADD</div>
                    </div>
                    <table className="w-full text-md bg-white shadow-md rounded mb-4">
            <tbody className='overflow-auto'>
                <tr className="border-b">
                    <th className="text-left p-3 px-5">Name</th>
                    <th className="text-left p-3 px-5">Email</th>
                    <th className="text-left p-3 px-5">Role</th>
                    <th></th>
                </tr>
                <tr className="border-b hover:bg-orange-100 bg-gray-100">
                    <td className="p-3 px-5"><input type="text" value="user.name" className="bg-transparent"/></td>
                    <td className="p-3 px-5"><input type="text" value="user.email" className="bg-transparent"/></td>
                    <td className="p-3 px-5">
                        <select value="user.role" className="bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3 px-5 flex justify-end"><button type="button" className="mr-3 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Save</button><button type="button" className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button></td>
                </tr>
                <tr className="border-b hover:bg-orange-100">
                    <td className="p-3 px-5"><input type="text" value="user.name" className="bg-transparent"/></td>
                    <td className="p-3 px-5"><input type="text" value="user.email" className="bg-transparent"/></td>
                    <td className="p-3 px-5">
                        <select value="user.role" className="bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3 px-5 flex justify-end"><button type="button" className="mr-3 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Save</button><button type="button" className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button></td>
                </tr>
                
                <tr className="border-b hover:bg-orange-100">
                    <td className="p-3 px-5"><input type="text" value="user.name" className="bg-transparent"/></td>
                    <td className="p-3 px-5"><input type="text" value="user.email" className="bg-transparent"/></td>
                    <td className="p-3 px-5">
                        <select value="user.role" className="bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3 px-5 flex justify-end"><button type="button" className="mr-3 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Save</button><button type="button" className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button></td>
                </tr>
                <tr className="border-b hover:bg-orange-100 bg-gray-100">
                    <td className="p-3 px-5"><input type="text" value="user.name" className="bg-transparent"/></td>
                    <td className="p-3 px-5"><input type="text" value="user.email" className="bg-transparent"/></td>
                    <td className="p-3 px-5">
                        <select value="user.role" className="bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3 px-5 flex justify-end"><button type="button" className="mr-3 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Save</button><button type="button" className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button></td>
                </tr>
                <tr className="border-b hover:bg-orange-100">
                    <td className="p-3 px-5"><input type="text" value="user.name" className="bg-transparent"/></td>
                    <td className="p-3 px-5"><input type="text" value="user.email" className="bg-transparent"/></td>
                    <td className="p-3 px-5">
                        <select value="user.role" className="bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3 px-5 flex justify-end"><button type="button" className="mr-3 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Save</button><button type="button" className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button></td>
                </tr>
                <tr className="border-b hover:bg-orange-100 bg-gray-100">
                    <td className="p-3 px-5"><input type="text" value="user.name" className="bg-transparent"/></td>
                    <td className="p-3 px-5"><input type="text" value="user.email" className="bg-transparent"/></td>
                    <td className="p-3 px-5">
                        <select value="user.role" className="bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3 px-5 flex justify-end"><button type="button" className="mr-3 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Save</button><button type="button" className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button></td>
                </tr>
                <tr className="border-b hover:bg-orange-100">
                    <td className="p-3 px-5"><input type="text" value="user.name" className="bg-transparent"/></td>
                    <td className="p-3 px-5"><input type="text" value="user.email" className="bg-transparent"/></td>
                    <td className="p-3 px-5">
                        <select value="user.role" className="bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3 px-5 flex justify-end"><button type="button" className="mr-3 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Save</button><button type="button" className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button></td>
                </tr>
                <tr className="border-b hover:bg-orange-100">
                    <td className="p-3 px-5"><input type="text" value="user.name" className="bg-transparent"/></td>
                    <td className="p-3 px-5"><input type="text" value="user.email" className="bg-transparent"/></td>
                    <td className="p-3 px-5">
                        <select value="user.role" className="bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3 px-5 flex justify-end"><button type="button" className="mr-3 text-sm bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Save</button><button type="button" className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline">Delete</button></td>
                </tr>
            </tbody>
        </table>
                </div>
                <div className='flex flex-1 flex-col bg-white/5 rounded-md p-5 gap-2 justify-start'>
            
                </div>
                <div className='flex flex-1 flex-col bg-white/5 rounded-md p-5 gap-2 justify-start'>
            
                </div>

            </div>
        </div>
      </div>
    </>
  );
}

export default IndexPage
