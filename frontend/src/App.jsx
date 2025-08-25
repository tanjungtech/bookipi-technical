import { useState, useEffect } from 'react';

import axios from 'axios';

export default function App() {

  const [ username, setUsername ] = useState('');
  const [ status, setStatus ] = useState('Loading');
  const [ stock, setStock ] = useState(0);
  const [ timeCounter, setTimeCounter ] = useState('');
  const [ purchaseStatus, setPurchaseStatus ] = useState('');
  const [ purchaseMessage, setPurchaseMessage ] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3020/flashsale-setup');

        const now = new Date();
        const { opening, preOpen, stoppedAt, stock, status } = response.data;
        const salesOpen = new Date(opening);
        const salesEnded = salesOpen.getTime() + stoppedAt;
        const salesPreOpen = salesOpen.getTime() + preOpen;

        let timeStatus = "-";

        if (status === "upcoming") {
          const counterRaw = salesPreOpen - now.getTime();
          const totalSecs = Math.floor(counterRaw/1000);
          const totalMins = Math.floor(totalSecs/60);
          const totalHours = Math.floor(totalMins / 60);
          timeStatus = `${ String(totalHours).padStart(2, '0') }:${ String(totalMins%60).padStart(2, '0') }:${String(totalSecs%60).padStart(2, '0')}`;
        } else if (status === "active") {
          const counterRaw = salesEnded - now.getTime();
          const totalSecs = Math.floor(counterRaw/1000);
          const totalMins = Math.floor(totalSecs/60);
          const totalHours = Math.floor(totalMins / 60);
          timeStatus = `${ String(totalHours).padStart(2, '0') }:${ String(totalMins%60).padStart(2, '0') }:${String(totalSecs%60).padStart(2, '0') }`;
        }

        setTimeCounter(timeStatus);
        
        setStatus(status);
        setStock(stock);
      } catch (error) {
        console.log('error', error);
      }
    }

    // Fetch data per 5 seconds interval
    const interval = setInterval(async () => {
      fetchData();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUsername = (e) => {
    const rawValue = (e.target.value);
    const alphanumericValue = rawValue.replace(/[^0-9a-zA-Z]/g, '');
    setUsername(alphanumericValue);
  }

  const purchaseItem = async () => {
    if (!username || username === '') {
      alert('complete your username');
      return false;
    }
    const formInput = {
      user: username
    };
    try {

      const response = await axios.post("http://localhost:3020/purchase", formInput);
      setPurchaseStatus(response?.data?.status);
      setPurchaseMessage(response?.data?.message);
    } catch (err) {
      if (err.status === 400) {
        setPurchaseStatus(err?.response?.data?.status);
        setPurchaseMessage(err?.response?.data?.message);
      }
      console.log('error', err);
    }
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl min-h-screen mx-auto">
        <div className="flex min-h-screen items-center justify-center">
          <div className="bg-white w-1/4 mx-auto rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-60">
              <img
                src="https://images.unsplash.com/photo-1511556820780-d912e42b4980"
                alt="Flash Sale Item"
                className="object-cover w-full h-full absolute inset-0"
              />
            </div>
            <div className="p-5">
              <div className="h-22 overflow-hidden">
                <h2 className="text-2xl font-semibold text-gray-900 line-clamp-2">Flash Sale Item</h2>
                <div className="flex justify-between items-center">
                  <div className="text-gray-500 text-sm mb-2">50% off</div>
                  <div className="text-gray-900 text-sm mb-2">{ stock } units left</div>
                </div>
              </div>
              <div className="my-2">
                <div>
                  <div className="text-sm font-bold">
                    {status === "ended" && 'Sales ended'}
                    {status === "active" && 'Time left'}
                    {status === "upcoming" && 'Starts in'}
                  </div>
                  { ['active', 'upcoming'].includes(status) && <div className="text-xl capitalize">{ timeCounter }</div> }
                </div>
              </div>
              {
                status === "active" && purchaseStatus === '' &&
                <div className="my-2">
                  <label htmlFor="username" >Username</label>
                  <input
                    name="username"
                    id="username"
                    type="text"
                    placeholder="alphanumeric only (a-z, A-Z, 0-9)"
                    value={username}
                    onChange={handleUsername}
                    required
                    className="w-full text-md px-4 py-2 border border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              }
              <div className="mt-6 text-center">
                {
                  purchaseStatus === '' ?
                  <button
                    onClick={purchaseItem}
                    className="bg-blue-700 inline-block text-white font-bold w-full shadow rounded-md text-sm hover:bg-blue-500 cursor-pointer transition px-4 py-2 disabled:cursor-default disabled:opacity-25 disabled:bg-blue-700"
                    disabled={ username === '' }
                  >{ status === "ended" ? "Expired" : "Buy Now" }</button>
                  :
                  <div className="text-lg">{ purchaseMessage }</div>
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
