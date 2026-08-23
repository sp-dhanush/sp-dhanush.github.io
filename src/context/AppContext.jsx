import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getUserSavedFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../firebase-config';

const AppContext = createContext();

const LOCAL_STORAGE_DEMO_KEY = 'factory_flow_v2_demo_data';

const INITIAL_DEMO_DATA = {
  factories: [
    {
      id: 'f_1',
      factoryName: 'Apex Packaging Pvt Ltd',
      contactPersonName: 'Rajesh Sharma',
      contactPersonNumber: '+91 98765 43210',
      factoryAddress: 'Plot 42, Industrial Area Phase 2, Peenya, Bangalore-560058',
      openingBalance: 25000.00
    },
    {
      id: 'f_2',
      factoryName: 'JKW Packaging Solutions',
      contactPersonName: 'Suresh Kumar',
      contactPersonNumber: '+91 98868 31306',
      factoryAddress: 'Gangondanahalli, Lakshmipura Post, Bangalore-562162',
      openingBalance: 31500.00
    }
  ],
  customers: [
    {
      id: 'c_1',
      customerName: 'Sun Pharma Industries',
      contactPersonName: 'Anil Gupta',
      contactPersonNumber: '+91 91234 56789',
      customerAddress: 'Building B, Electronic City, Bangalore-560100'
    },
    {
      id: 'c_2',
      customerName: 'PRAD 4x4 Accessories',
      contactPersonName: 'Dhanush Gowda',
      contactPersonNumber: '+91 99887 76655',
      customerAddress: 'Koramangala 4th Block, Bangalore-560034'
    }
  ],
  boxDetails: [
    {
      id: 'b_1',
      boxName: 'Z101 Radiator Guard Outer Box',
      length: 610,
      width: 95,
      height: 1630,
      unit: 'mm',
      category: 'Outer',
      ply: '5',
      paperGsm: '180 GSM',
      paperBf: '18 BF',
      openType: 'Over Flop',
      rate: 210.00,
      margin: 25.00,
      note: 'Heavy duty corrugated export packaging',
      photos: []
    },
    {
      id: 'b_2',
      boxName: 'W502 Radiator Guard Inner Box',
      length: 260,
      width: 50,
      height: 560,
      unit: 'mm',
      category: 'Inner',
      ply: '5',
      paperGsm: '180 GSM',
      paperBf: '18 BF',
      openType: 'Over Flop',
      rate: 33.00,
      margin: 7.00,
      note: 'Inner protective sleeve carton',
      photos: []
    }
  ],
  orders: [
    {
      id: 'o_1',
      customerId: 'c_2',
      customerName: 'PRAD 4x4 Accessories',
      factoryId: 'f_2',
      factoryName: 'JKW Packaging Solutions',
      orderDate: '2026-08-18',
      deliveryDate: '2026-08-26',
      notes: 'Palletized cargo dispatch required',
      items: [
        {
          boxId: 'b_1',
          boxName: 'Z101 Radiator Guard Outer Box',
          quantity: 800,
          notes: 'Special Kraft paper print'
        },
        {
          boxId: 'b_2',
          boxName: 'W502 Radiator Guard Inner Box',
          quantity: 2000,
          notes: 'Standard bundle packing'
        }
      ]
    }
  ],
  paymentDetails: [
    {
      id: 'p_1',
      factoryId: 'f_1',
      factoryName: 'Apex Packaging Pvt Ltd',
      paymentDate: '2026-08-22',
      amountPaid: 100000.00,
      paymentMode: 'Bank Transfer',
      notes: 'Advance RTGS for batch order #1'
    }
  ]
};

export const AppProvider = ({ children }) => {
  const getTabFromUrl = () => {
    let path = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (!path) {
      path = window.location.pathname.replace(/^\//, '').toLowerCase();
    }
    if (!path) return 'dashboard';
    if (path === 'products') return 'box-details';
    const validTabs = ['dashboard', 'factories', 'customers', 'box-details', 'orders', 'payments', 'reports'];
    return validTabs.includes(path) ? path : 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState(getTabFromUrl);

  const setActiveTab = (tab, skipPush = false) => {
    const resolvedTab = tab === 'products' ? 'box-details' : tab;
    setActiveTabState(resolvedTab);
    if (!skipPush) {
      const hashPath = '#/' + resolvedTab;
      if (window.location.hash !== hashPath) {
        window.location.hash = hashPath;
      }
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTabState(tabFromUrl);
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const getThemeCookie = () => {
    const match = document.cookie.match(/(?:^|; )factory_flow_theme=([^;]*)/);
    return match ? match[1] : (localStorage.getItem('factory_flow_theme') || 'dark');
  };

  const [theme, setTheme] = useState(getThemeCookie);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('factory_flow_theme', theme);
    document.cookie = `factory_flow_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);

  const [factories, setFactories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [boxDetails, setBoxDetails] = useState([]);
  const [orders, setOrders] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState([]);

  const [activeModal, setActiveModal] = useState(null);
  const [modalPayload, setModalPayload] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [syncNotice, setSyncNotice] = useState(null);

  const unsubscribersRef = useRef([]);

  const detachListeners = () => {
    unsubscribersRef.current.forEach(unsub => typeof unsub === 'function' && unsub());
    unsubscribersRef.current = [];
  };

  const loadLocalDemoState = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFactories(parsed.factories || INITIAL_DEMO_DATA.factories);
        setCustomers(parsed.customers || INITIAL_DEMO_DATA.customers);
        setBoxDetails(parsed.boxDetails || INITIAL_DEMO_DATA.boxDetails);
        setOrders(parsed.orders || INITIAL_DEMO_DATA.orders);
        setPaymentDetails(parsed.paymentDetails || INITIAL_DEMO_DATA.paymentDetails);
      } else {
        localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, JSON.stringify(INITIAL_DEMO_DATA));
        setFactories(INITIAL_DEMO_DATA.factories);
        setCustomers(INITIAL_DEMO_DATA.customers);
        setBoxDetails(INITIAL_DEMO_DATA.boxDetails);
        setOrders(INITIAL_DEMO_DATA.orders);
        setPaymentDetails(INITIAL_DEMO_DATA.paymentDetails);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
      setFactories(INITIAL_DEMO_DATA.factories);
      setCustomers(INITIAL_DEMO_DATA.customers);
      setBoxDetails(INITIAL_DEMO_DATA.boxDetails);
      setOrders(INITIAL_DEMO_DATA.orders);
      setPaymentDetails(INITIAL_DEMO_DATA.paymentDetails);
    }
  };

  const saveLocalDemoState = (partial) => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
      const current = stored ? JSON.parse(stored) : INITIAL_DEMO_DATA;
      const updated = { ...current, ...partial };
      localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  // Initialize Firebase if configured
  useEffect(() => {
    const config = getUserSavedFirebaseConfig();
    if (config) {
      try {
        let app;
        if (!getApps().length) {
          app = initializeApp(config);
        } else {
          app = getApps()[0];
        }
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestore);
        setAuth(firebaseAuth);
        setIsDemoMode(false);
        setIsConnected(true);

        const unsubAuth = onAuthStateChanged(firebaseAuth, (usr) => {
          setUser(usr);
          if (usr) {
            attachFirestoreListeners(firestore, usr.uid);
          } else {
            detachListeners();
            loadLocalDemoState();
          }
        });

        return () => {
          unsubAuth();
          detachListeners();
        };
      } catch (err) {
        console.error('Firebase init error:', err);
        setSyncNotice('Firebase connection failed. Falling back to local offline mode.');
        setIsDemoMode(true);
        setIsConnected(false);
        loadLocalDemoState();
      }
    } else {
      setIsDemoMode(true);
      setIsConnected(false);
      loadLocalDemoState();
    }
  }, []);

  const attachFirestoreListeners = (firestoreDb, uid) => {
    detachListeners();

    const collectionsToSync = [
      { name: 'factories', setter: setFactories },
      { name: 'customers', setter: setCustomers },
      { name: 'boxDetails', setter: setBoxDetails },
      { name: 'orders', setter: setOrders },
      { name: 'paymentDetails', setter: setPaymentDetails }
    ];

    collectionsToSync.forEach(({ name, setter }) => {
      const colRef = collection(firestoreDb, 'users', uid, name);
      const unsub = onSnapshot(colRef, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setter(docs);
      }, (err) => {
        console.error(`Error listening to ${name}:`, err);
      });
      unsubscribersRef.current.push(unsub);
    });
  };

  const startDemoMode = () => {
    setUser({
      uid: 'demo_user',
      displayName: 'Demo Executive',
      email: 'demo@factoryflow.local'
    });
    loadLocalDemoState();
  };

  const loginWithGoogle = async () => {
    if (auth) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (e) {
        alert('Google Sign-in failed: ' + e.message);
      }
    } else {
      setActiveModal('firebase');
    }
  };

  const logout = async () => {
    detachListeners();
    setUser(null);
    setFactories([]);
    setCustomers([]);
    setBoxDetails([]);
    setOrders([]);
    setPaymentDetails([]);
    if (auth) {
      await signOut(auth);
    }
  };

  const sanitizeForFirestore = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        clean[key] = obj[key];
      }
    });
    return clean;
  };

  // 1. Factory Operations
  const saveFactoryDoc = async (id, data) => {
    const clean = sanitizeForFirestore(data);
    if (id) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await updateDoc(doc(db, 'users', user.uid, 'factories', id), clean);
      } else {
        const updated = factories.map(f => f.id === id ? { ...f, ...clean, id } : f);
        setFactories(updated);
        saveLocalDemoState({ factories: updated });
      }
    } else {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await addDoc(collection(db, 'users', user.uid, 'factories'), clean);
      } else {
        const updated = [{ ...clean, id: 'f_' + Date.now() }, ...factories];
        setFactories(updated);
        saveLocalDemoState({ factories: updated });
      }
    }
  };

  const deleteFactoryDoc = async (id) => {
    const f = factories.find(i => i.id === id);
    if (confirm(`Delete factory "${f ? f.factoryName : ''}"?`)) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await deleteDoc(doc(db, 'users', user.uid, 'factories', id));
      } else {
        const updated = factories.filter(i => i.id !== id);
        setFactories(updated);
        saveLocalDemoState({ factories: updated });
      }
    }
  };

  // 2. Customer Operations
  const saveCustomerDoc = async (id, data) => {
    const clean = sanitizeForFirestore(data);
    if (id) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await updateDoc(doc(db, 'users', user.uid, 'customers', id), clean);
      } else {
        const updated = customers.map(c => c.id === id ? { ...c, ...clean, id } : c);
        setCustomers(updated);
        saveLocalDemoState({ customers: updated });
      }
    } else {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await addDoc(collection(db, 'users', user.uid, 'customers'), clean);
      } else {
        const updated = [{ ...clean, id: 'c_' + Date.now() }, ...customers];
        setCustomers(updated);
        saveLocalDemoState({ customers: updated });
      }
    }
  };

  const deleteCustomerDoc = async (id) => {
    const c = customers.find(i => i.id === id);
    if (confirm(`Delete customer "${c ? c.customerName : ''}"?`)) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await deleteDoc(doc(db, 'users', user.uid, 'customers', id));
      } else {
        const updated = customers.filter(i => i.id !== id);
        setCustomers(updated);
        saveLocalDemoState({ customers: updated });
      }
    }
  };

  // 3. Box Details Operations
  const saveBoxDoc = async (id, data) => {
    const clean = sanitizeForFirestore(data);
    if (id) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await updateDoc(doc(db, 'users', user.uid, 'boxDetails', id), clean);
      } else {
        const updated = boxDetails.map(b => b.id === id ? { ...b, ...clean, id } : b);
        setBoxDetails(updated);
        saveLocalDemoState({ boxDetails: updated });
      }
    } else {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await addDoc(collection(db, 'users', user.uid, 'boxDetails'), clean);
      } else {
        const updated = [{ ...clean, id: 'b_' + Date.now() }, ...boxDetails];
        setBoxDetails(updated);
        saveLocalDemoState({ boxDetails: updated });
      }
    }
  };

  const deleteBoxDoc = async (id) => {
    const b = boxDetails.find(i => i.id === id);
    if (confirm(`Delete box specification "${b ? b.boxName : ''}"?`)) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await deleteDoc(doc(db, 'users', user.uid, 'boxDetails', id));
      } else {
        const updated = boxDetails.filter(i => i.id !== id);
        setBoxDetails(updated);
        saveLocalDemoState({ boxDetails: updated });
      }
    }
  };

  // 4. Order Operations (NO MONEY FIELDS)
  const saveOrderDoc = async (id, data) => {
    const clean = sanitizeForFirestore(data);
    if (id) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await updateDoc(doc(db, 'users', user.uid, 'orders', id), clean);
      } else {
        const updated = orders.map(o => o.id === id ? { ...o, ...clean, id } : o);
        setOrders(updated);
        saveLocalDemoState({ orders: updated });
      }
    } else {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await addDoc(collection(db, 'users', user.uid, 'orders'), clean);
      } else {
        const updated = [{ ...clean, id: 'o_' + Date.now() }, ...orders];
        setOrders(updated);
        saveLocalDemoState({ orders: updated });
      }
    }
  };

  const deleteOrderDoc = async (id) => {
    if (confirm('Delete this production order?')) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await deleteDoc(doc(db, 'users', user.uid, 'orders', id));
      } else {
        const updated = orders.filter(i => i.id !== id);
        setOrders(updated);
        saveLocalDemoState({ orders: updated });
      }
    }
  };

  // 5. Payment Details Operations
  const savePaymentDoc = async (id, data) => {
    const clean = sanitizeForFirestore(data);
    if (id) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await updateDoc(doc(db, 'users', user.uid, 'paymentDetails', id), clean);
      } else {
        const updated = paymentDetails.map(p => p.id === id ? { ...p, ...clean, id } : p);
        setPaymentDetails(updated);
        saveLocalDemoState({ paymentDetails: updated });
      }
    } else {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await addDoc(collection(db, 'users', user.uid, 'paymentDetails'), clean);
      } else {
        const updated = [{ ...clean, id: 'p_' + Date.now() }, ...paymentDetails];
        setPaymentDetails(updated);
        saveLocalDemoState({ paymentDetails: updated });
      }
    }
  };

  const deletePaymentDoc = async (id) => {
    if (confirm('Delete this payment transaction record?')) {
      if (!isDemoMode && db && user && user.uid !== 'demo_user') {
        await deleteDoc(doc(db, 'users', user.uid, 'paymentDetails', id));
      } else {
        const updated = paymentDetails.filter(i => i.id !== id);
        setPaymentDetails(updated);
        saveLocalDemoState({ paymentDetails: updated });
      }
    }
  };

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab,
      theme, toggleTheme,
      isDemoMode, isConnected, user,
      loginWithGoogle, startDemoMode, logout,
      factories, saveFactoryDoc, deleteFactoryDoc,
      customers, saveCustomerDoc, deleteCustomerDoc,
      boxDetails, saveBoxDoc, deleteBoxDoc,
      orders, saveOrderDoc, deleteOrderDoc,
      paymentDetails, savePaymentDoc, deletePaymentDoc,
      activeModal, setActiveModal,
      modalPayload, setModalPayload,
      lightboxImg, setLightboxImg,
      syncNotice, setSyncNotice
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
