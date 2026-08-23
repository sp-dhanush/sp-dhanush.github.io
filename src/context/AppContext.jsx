import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getSavedFirebaseConfig } from '../firebase-config';

const AppContext = createContext();

const initialDemoData = {
  factories: [
    {
      id: 'f_1',
      factoryName: 'Apex Packaging Pvt Ltd',
      contactPersonName: 'Rajesh Sharma',
      contactPersonNumber: '+91 98765 43210',
      factoryAddress: 'Plot 42, GIDC Industrial Estate, Vadodara, Gujarat'
    },
    {
      id: 'f_2',
      factoryName: 'Surat Corrugation Works',
      contactPersonName: 'Ketan Patel',
      contactPersonNumber: '+91 98250 11223',
      factoryAddress: 'Station Road, Sachin Industrial Area, Surat'
    }
  ],
  customers: [
    {
      id: 'c_1',
      customerName: 'Sun Pharma Industries',
      customerAddress: '12 Corporate Park, Andheri East, Mumbai',
      contactPersonName: 'Amit Verma',
      contactPersonNumber: '+91 98123 45678'
    },
    {
      id: 'c_2',
      customerName: 'Gujarat Agro Foods Ltd',
      customerAddress: 'Highway Hub, Sanand, Ahmedabad',
      contactPersonName: 'Suresh Patel',
      contactPersonNumber: '+91 97234 56789'
    }
  ],
  boxDetails: [
    {
      id: 'b_1',
      boxName: '1kg Medicine Master Carton',
      length: 350,
      width: 250,
      height: 200,
      unit: 'mm',
      category: 'Outer',
      ply: '5',
      paperGsm: '180 GSM',
      paperBf: '24 BF',
      openType: 'Regular',
      rate: 45.00,
      margin: 5.00,
      note: 'Heavy duty outer carton with waterproof lining',
      photos: []
    },
    {
      id: 'b_2',
      boxName: '500g Inner Bottle Box',
      length: 120,
      width: 120,
      height: 180,
      unit: 'mm',
      category: 'Inner',
      ply: '3',
      paperGsm: '140 GSM',
      paperBf: '18 BF',
      openType: 'Over Flop',
      rate: 18.50,
      margin: 2.50,
      note: 'High stiffness inner folding carton',
      photos: []
    }
  ],
  orders: [
    {
      id: 'o_1',
      customerId: 'c_1',
      customerName: 'Sun Pharma Industries',
      factoryId: 'f_1',
      factoryName: 'Apex Packaging Pvt Ltd',
      boxId: 'b_1',
      boxName: '1kg Medicine Master Carton',
      quantity: 5000,
      orderDate: '2026-08-20',
      deliveryDate: '2026-08-28',
      notes: 'Dispatch via express cargo'
    },
    {
      id: 'o_2',
      customerId: 'c_2',
      customerName: 'Gujarat Agro Foods Ltd',
      factoryId: 'f_2',
      factoryName: 'Surat Corrugation Works',
      boxId: 'b_2',
      boxName: '500g Inner Bottle Box',
      quantity: 10000,
      orderDate: '2026-08-22',
      deliveryDate: '2026-08-30',
      notes: 'Deliver directly to Sanand plant'
    }
  ],
  paymentDetails: [
    {
      id: 'pay_1',
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
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
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
      const targetPath = '/' + resolvedTab;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: resolvedTab }, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTabState(tabFromUrl);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  const unsubscribersRef = useRef([]);

  const detachListeners = () => {
    unsubscribersRef.current.forEach(unsub => typeof unsub === 'function' && unsub());
    unsubscribersRef.current = [];
  };

  useEffect(() => {
    initFirebase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initFirebase = () => {
    detachListeners();
    const config = getSavedFirebaseConfig();
    if (config.apiKey && config.projectId) {
      try {
        let app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        let firebaseAuth = getAuth(app);
        let firebaseDb = getFirestore(app);

        setAuth(firebaseAuth);
        setDb(firebaseDb);
        setIsConnected(true);
        setIsDemoMode(false);

        onAuthStateChanged(firebaseAuth, (currentUser) => {
          setUser(currentUser);
          detachListeners();
          if (currentUser) {
            loadFirestore(firebaseDb, currentUser.uid);
          } else {
            setFactories([]);
            setCustomers([]);
            setBoxDetails([]);
            setOrders([]);
            setPaymentDetails([]);
          }
        });

        return;
      } catch (e) {
        console.warn('Firebase init failed, switching to demo mode', e);
      }
    }
    loadDemoMode();
  };

  const loadDemoMode = () => {
    detachListeners();
    setIsDemoMode(true);
    setIsConnected(false);
    const local = localStorage.getItem('factory_flow_v2_demo_data');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setFactories(parsed.factories || initialDemoData.factories);
        setCustomers(parsed.customers || initialDemoData.customers);
        setBoxDetails(parsed.boxDetails || initialDemoData.boxDetails);
        setOrders(parsed.orders || initialDemoData.orders);
        setPaymentDetails(parsed.paymentDetails || initialDemoData.paymentDetails);
        return;
      } catch (e) {
        console.warn('Local demo data parse error', e);
      }
    }
    setFactories(initialDemoData.factories);
    setCustomers(initialDemoData.customers);
    setBoxDetails(initialDemoData.boxDetails);
    setOrders(initialDemoData.orders);
    setPaymentDetails(initialDemoData.paymentDetails);
  };

  const saveLocalDemoState = (partial) => {
    const current = { factories, customers, boxDetails, orders, paymentDetails, ...partial };
    localStorage.setItem('factory_flow_v2_demo_data', JSON.stringify(current));
  };

  const [syncNotice, setSyncNotice] = useState(null);

  const loadFirestore = (firestoreDb, userId) => {
    if (!userId) return;
    detachListeners();

    const errHandler = (err) => {
      console.warn('Firestore snapshot error', err);
      setSyncNotice('Cloud sync issue detected. Operating in local demo mode.');
      loadDemoMode();
    };

    const unsubFact = onSnapshot(collection(firestoreDb, 'users', userId, 'factories'), snap => {
      setFactories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, errHandler);

    const unsubCust = onSnapshot(collection(firestoreDb, 'users', userId, 'customers'), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, errHandler);

    const unsubBox = onSnapshot(collection(firestoreDb, 'users', userId, 'boxDetails'), snap => {
      setBoxDetails(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, errHandler);

    const unsubOrd = onSnapshot(collection(firestoreDb, 'users', userId, 'orders'), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, errHandler);

    const unsubPay = onSnapshot(collection(firestoreDb, 'users', userId, 'paymentDetails'), snap => {
      setPaymentDetails(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, errHandler);

    unsubscribersRef.current = [unsubFact, unsubCust, unsubBox, unsubOrd, unsubPay];
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
      alert('Please configure your Firebase credentials first!');
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
      if (!isDemoMode && db && user) {
        await updateDoc(doc(db, 'users', user.uid, 'factories', id), clean);
      } else {
        const updated = factories.map(f => f.id === id ? { ...f, ...clean, id } : f);
        setFactories(updated);
        saveLocalDemoState({ factories: updated });
      }
    } else {
      if (!isDemoMode && db && user) {
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
      if (!isDemoMode && db && user) {
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
      if (!isDemoMode && db && user) {
        await updateDoc(doc(db, 'users', user.uid, 'customers', id), clean);
      } else {
        const updated = customers.map(c => c.id === id ? { ...c, ...clean, id } : c);
        setCustomers(updated);
        saveLocalDemoState({ customers: updated });
      }
    } else {
      if (!isDemoMode && db && user) {
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
      if (!isDemoMode && db && user) {
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
      if (!isDemoMode && db && user) {
        await updateDoc(doc(db, 'users', user.uid, 'boxDetails', id), clean);
      } else {
        const updated = boxDetails.map(b => b.id === id ? { ...b, ...clean, id } : b);
        setBoxDetails(updated);
        saveLocalDemoState({ boxDetails: updated });
      }
    } else {
      if (!isDemoMode && db && user) {
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
      if (!isDemoMode && db && user) {
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
      if (!isDemoMode && db && user) {
        await updateDoc(doc(db, 'users', user.uid, 'orders', id), clean);
      } else {
        const updated = orders.map(o => o.id === id ? { ...o, ...clean, id } : o);
        setOrders(updated);
        saveLocalDemoState({ orders: updated });
      }
    } else {
      if (!isDemoMode && db && user) {
        await addDoc(collection(db, 'users', user.uid, 'orders'), clean);
      } else {
        const updated = [{ ...clean, id: 'o_' + Date.now() }, ...orders];
        setOrders(updated);
        saveLocalDemoState({ orders: updated });
      }
    }
  };

  const deleteOrderDoc = async (id) => {
    const o = orders.find(i => i.id === id);
    if (confirm(`Delete order for "${o ? o.boxName : ''}"?`)) {
      if (!isDemoMode && db && user) {
        await deleteDoc(doc(db, 'users', user.uid, 'orders', id));
      } else {
        const updated = orders.filter(i => i.id !== id);
        setOrders(updated);
        saveLocalDemoState({ orders: updated });
      }
    }
  };

  // 5. Payment Operations
  const savePaymentDoc = async (id, data) => {
    const clean = sanitizeForFirestore(data);
    if (id) {
      if (!isDemoMode && db && user) {
        await updateDoc(doc(db, 'users', user.uid, 'paymentDetails', id), clean);
      } else {
        const updated = paymentDetails.map(p => p.id === id ? { ...p, ...clean, id } : p);
        setPaymentDetails(updated);
        saveLocalDemoState({ paymentDetails: updated });
      }
    } else {
      if (!isDemoMode && db && user) {
        await addDoc(collection(db, 'users', user.uid, 'paymentDetails'), clean);
      } else {
        const updated = [{ ...clean, id: 'pay_' + Date.now() }, ...paymentDetails];
        setPaymentDetails(updated);
        saveLocalDemoState({ paymentDetails: updated });
      }
    }
  };

  const deletePaymentDoc = async (id) => {
    if (confirm(`Delete payment transaction?`)) {
      if (!isDemoMode && db && user) {
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
      isDemoMode, setIsDemoMode,
      isConnected, syncNotice, setSyncNotice,
      user, loginWithGoogle, logout,
      factories, customers, boxDetails, products: boxDetails, orders, paymentDetails,
      activeModal, setActiveModal,
      modalPayload, setModalPayload,
      lightboxImg, setLightboxImg,
      saveFactoryDoc, deleteFactoryDoc,
      saveCustomerDoc, deleteCustomerDoc,
      saveBoxDoc, deleteBoxDoc, saveProductDoc: saveBoxDoc, deleteProductDoc: deleteBoxDoc,
      saveOrderDoc, deleteOrderDoc,
      savePaymentDoc, deletePaymentDoc,
      reloadFirebase: () => initFirebase()
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
