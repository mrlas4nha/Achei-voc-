/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, 
  Search, 
  Shield, 
  MapPin, 
  AlertTriangle, 
  QrCode, 
  Phone, 
  Menu, 
  X,
  Bell,
  Settings,
  History,
  ChevronLeft,
  Navigation,
  Plus,
  Camera,
  Siren,
  Building2,
  CheckCircle2,
  Map as MapIcon,
  Heart,
  Star,
  LogOut,
  MessageCircle
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Html5Qrcode } from 'html5-qrcode';
import { cn } from './utils';
import { Child, UserRole, SupportPoint, User, Notification } from './types';

// Mock Data
const MOCK_CHILDREN: Child[] = [];
const MOCK_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Admin Prefeitura',
    email: 'admin@mendes.rj.gov.br',
    password: '123',
    role: 'authority',
    subRole: 'authority'
  },
  {
    id: 'guard-1',
    name: 'Guarda Municipal',
    email: 'guarda@mendes.rj.gov.br',
    password: '123',
    role: 'authority',
    subRole: 'guard'
  }
];

export default function App() {
  const [role, setRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('achei_voce_current_user');
    if (saved) {
      return JSON.parse(saved).role;
    }
    return null;
  });
  const [view, setView] = useState<'selection' | 'splash' | 'dashboard' | 'location' | 'qr_generator' | 'emergency' | 'register' | 'login' | 'settings' | 'manual_entry' | 'register_child' | 'child_details' | 'notifications' | 'authority_reports' | 'authority_alerts' | 'occurrence_details' | 'citizen_scan' | 'log_found_location'>(() => {
    return 'selection';
  });
  const [scannedChild, setScannedChild] = useState<Child | null>(null);
  const [citizenLocation, setCitizenLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [foundLocationForm, setFoundLocationForm] = useState({
    address: '',
    notes: ''
  });
  const [children, setChildren] = useState<Child[]>(() => {
    const saved = localStorage.getItem('achei_voce_children');
    return saved ? JSON.parse(saved) : MOCK_CHILDREN;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('achei_voce_users');
    const parsed = saved ? JSON.parse(saved) : [];
    // Ensure mock users are always present
    const combined = [...MOCK_USERS];
    parsed.forEach((u: User) => {
      if (!combined.find(m => m.email === u.email)) {
        combined.push(u);
      }
    });
    return combined;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('achei_voce_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [emergencyChildId, setEmergencyChildId] = useState<string | null>(null);
  const [emergencyStep, setEmergencyStep] = useState<'select' | 'alert'>('select');
  const [isAuthorityOnline, setIsAuthorityOnline] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('achei_voce_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'Criança Encontrada!',
        message: 'A Guarda Municipal localizou Lucas no Ponto de Apoio 03. Ele está seguro e aguardando você.',
        time: '10 min',
        type: 'success',
        read: false
      },
      {
        id: '2',
        title: 'Alerta de Segurança',
        message: 'O Modo Evento foi ativado para a região do Parque Ibirapuera. Fique atento às notificações.',
        time: '1h',
        type: 'alert',
        read: true
      },
      {
        id: '3',
        title: 'Bem-vindo ao Achei Você',
        message: 'Seu cadastro foi concluído com sucesso. Não esqueça de vincular a pulseira da sua criança.',
        time: '2h',
        type: 'info',
        read: true
      }
    ];
  });

  // Persist notifications
  React.useEffect(() => {
    localStorage.setItem('achei_voce_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Real-time simulation between tabs
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'achei_voce_notifications' && e.newValue) {
        setNotifications(JSON.parse(e.newValue));
      }
      if (e.key === 'achei_voce_children' && e.newValue) {
        setChildren(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const triggerNotification = (notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotif: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      time: 'Agora',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Also update localStorage immediately to trigger storage event in other tabs
    const currentNotifs = JSON.parse(localStorage.getItem('achei_voce_notifications') || '[]');
    localStorage.setItem('achei_voce_notifications', JSON.stringify([newNotif, ...currentNotifs]));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const [authorityNotes, setAuthorityNotes] = useState(() => {
    return localStorage.getItem('achei_voce_authority_notes') || '';
  });
  const [isSharing, setIsSharing] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    age: '',
    gender: '' as 'M' | 'F' | 'Outro' | '',
    allergies: '',
    medications: '',
    disability: '',
    description: '',
    photo: 'https://picsum.photos/seed/newchild/200',
    qrCode: '',
    responsiblePhone: ''
  });
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('achei_voce_current_user');
    if (saved) {
      const user = JSON.parse(saved);
      return {
        name: user.name,
        photo: user.photo || 'https://picsum.photos/seed/maria_resp/200',
        email: user.email
      };
    }
    return {
      name: 'Maria Silva',
      photo: 'https://picsum.photos/seed/maria_resp/200',
      email: 'maria@exemplo.com'
    };
  });

  const [regForm, setRegForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    registrationId: ''
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Persistence Effects
  React.useEffect(() => {
    localStorage.setItem('achei_voce_children', JSON.stringify(children));
  }, [children]);

  React.useEffect(() => {
    localStorage.setItem('achei_voce_users', JSON.stringify(users));
  }, [users]);

  React.useEffect(() => {
    if (currentUser) {
      localStorage.setItem('achei_voce_current_user', JSON.stringify(currentUser));
      setRole(currentUser.role);
      setUserProfile({
        name: currentUser.name,
        photo: currentUser.photo || 'https://picsum.photos/seed/maria_resp/200',
        email: currentUser.email
      });
    } else {
      localStorage.removeItem('achei_voce_current_user');
    }
  }, [currentUser]);

  React.useEffect(() => {
    localStorage.setItem('achei_voce_authority_notes', authorityNotes);
  }, [authorityNotes]);
  const [regRole, setRegRole] = useState<UserRole | null>(null);
  const [regSubRole, setRegSubRole] = useState<'guard' | 'authority' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // QR Scanner Effect
  React.useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    if ((view === 'qr_generator' || view === 'citizen_scan') && !scanSuccess && isScanning) {
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader");
        if (element) {
          html5QrCode = new Html5Qrcode("qr-reader");
          
          const startScanner = async () => {
            try {
              await html5QrCode?.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                  if (html5QrCode) {
                    html5QrCode.stop().then(() => {
                      setIsScanning(false);
                      setScanSuccess(true);

                      if (view === 'citizen_scan') {
                        const child = children.find(c => c.id === decodedText || (decodedText.startsWith('child_id:') && c.id === decodedText.split(':')[1]) || c.qrCode === decodedText);
                        if (child) {
                          setScannedChild(child);
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((position) => {
                              setCitizenLocation({
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                                address: 'Localização Atual'
                              });
                            });
                          }
                          setTimeout(() => setView('location'), 1500);
                        } else {
                          alert('Criança não encontrada no sistema.');
                          setView('splash');
                        }
                      } else if (view === 'qr_generator' && selectedChildId) {
                        if (selectedChildId === 'TEMP_REG') {
                          setNewChild(prev => ({ ...prev, qrCode: decodedText }));
                          setTimeout(() => {
                            setView('register_child');
                            setScanSuccess(false);
                          }, 2000);
                        } else {
                          setChildren(prev => prev.map(c => c.id === selectedChildId ? { ...c, qrCode: decodedText } : c));
                          setTimeout(() => {
                            setView('dashboard');
                            setScanSuccess(false);
                          }, 2000);
                        }
                      }
                    }).catch(err => console.error("Stop failed", err));
                  }
                },
                () => {}
              );
            } catch (err) {
              console.error("Unable to start scanning", err);
              // Try a fallback if environment camera fails
              try {
                await html5QrCode?.start(
                  { facingMode: "user" },
                  { fps: 10, qrbox: { width: 250, height: 250 } },
                  (decodedText) => { /* same logic as above, but keeping it simple for fallback */ 
                    html5QrCode?.stop().then(() => {
                      setIsScanning(false);
                      setScanSuccess(true);
                      // ... (reusing logic would be better but let's see if this fixes the primary issue)
                    });
                  },
                  () => {}
                );
              } catch (fallbackErr) {
                console.error("Fallback also failed", fallbackErr);
                if (isScanning) {
                  alert("Não foi possível acessar a câmera. Verifique as permissões de privacidade do seu navegador.");
                  setIsScanning(false);
                }
              }
            }
          };

          startScanner();
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(error => console.error("Failed to stop scanner", error));
          }
        }
      };
    }
  }, [view, scanSuccess, isScanning, children, selectedChildId]);

  const activeChild = children.find(c => c.id === selectedChildId) || children[0];
  const missingChild = children.find(c => c.status === 'missing') || children[1];

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {view === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-brand-gradient flex flex-col p-3.5 pt-7 overflow-x-hidden"
          >
            <div className="absolute top-3.5 right-3.5 z-10">
              <button onClick={() => setView('notifications')} className="relative w-7.5 h-7.5 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md shadow-lg active:scale-95 transition-all">
                <Bell className="w-3.5 h-3.5 text-brand-secondary fill-brand-secondary/20" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-brand-emergency rounded-full border-2 border-brand-dark" />
                )}
              </button>
            </div>

            <div className="flex flex-col items-center gap-0.5 mb-2.5">
              <h1 className="text-[24px] sm:text-[30px] text-white font-black tracking-tighter">
                ACHEI <span className="text-brand-secondary">VOCÊ</span>
              </h1>
              <p className="text-blue-100 text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 text-center">Segurança infantil e familiar</p>
            </div>

            <div className="text-center mb-2.5">
              <h2 className="text-[18px] text-white font-bold">Quem você quer proteger hoje?</h2>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto pb-3.5 scrollbar-hide">
              {/* Crianças Card */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (currentUser) {
                    setView('dashboard');
                  } else {
                    setView('splash');
                  }
                }}
                className="relative overflow-hidden rounded-[14.5px] p-3.5 cursor-pointer group shadow-[0_6.8px_20.4px_rgba(0,0,0,0.2)] border border-white/10 w-[85%] mx-auto"
                style={{ background: 'linear-gradient(145deg, #2A9D5C 0%, #146B3A 100%)' }}
              >
                <div className="absolute top-1.5 right-2.5 bg-white/15 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                  <Shield className="w-1.5 h-1.5 text-white" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider">Prioridade</span>
                </div>
                
                <div className="flex flex-col items-center text-center gap-1.25">
                  <div className="w-[13vw] h-[13vw] max-w-[51px] max-h-[51px] relative">
                    <img 
                      src="https://i.postimg.cc/8ThNw3rh/teste.png" 
                      alt="Crianças" 
                      className="w-full h-full object-contain drop-shadow-[0_6.8px_6.8px_rgba(0,0,0,0.3)] brightness-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-[22px] text-white font-black tracking-tight uppercase">CRIANÇAS</h3>
                    <p className="text-white/80 text-[12px] font-medium leading-tight max-w-[130px] mx-auto">
                      Localização rápida com pulseira QR Code
                    </p>
                  </div>
                  <button className="mt-1 bg-white text-[#187A44] hover:bg-white/90 px-3 py-0.5 rounded-full font-extrabold text-[13px] flex items-center gap-1.5 shadow-[0_3.4px_10.2px_rgba(0,0,0,0.15)] transition-all w-[85%] mx-auto justify-center">
                    Acessar Crianças <ChevronLeft className="w-2 h-2 rotate-180" />
                  </button>
                </div>
              </motion.div>

              {/* Pets Card */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => alert('Em breve: Funcionalidade de Pets em desenvolvimento!')}
                className="relative overflow-hidden rounded-[14.5px] p-3.5 cursor-pointer group shadow-[0_6.8px_20.4px_rgba(0,0,0,0.2)] border border-white/10 w-[85%] mx-auto"
                style={{ background: 'linear-gradient(145deg, #F5C518 0%, #C99300 100%)' }}
              >
                <div className="flex flex-col items-center text-center gap-1.25">
                  <div className="w-[13vw] h-[13vw] max-w-[51px] max-h-[51px] relative">
                    <img 
                      src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog.png" 
                      alt="Pets" 
                      className="w-full h-full object-contain drop-shadow-[0_6.8px_6.8px_rgba(0,0,0,0.3)] brightness-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-[17.3px] text-brand-dark font-black tracking-tight uppercase">PETS</h3>
                    <p className="text-brand-dark/70 text-[12px] font-medium leading-tight max-w-[130px] mx-auto">
                      Encontre seu pet com identificação segura
                    </p>
                  </div>
                  <button className="mt-1 bg-brand-dark text-white hover:bg-brand-dark/90 px-3 py-0.5 rounded-full font-extrabold text-[13px] flex items-center gap-1.5 shadow-[0_3.4px_10.2px_rgba(0,0,0,0.15)] transition-all w-[85%] mx-auto justify-center">
                    Acessar Pets
                  </button>
                </div>
              </motion.div>
            </div>

            <div className="mt-auto pt-1.5 text-center space-y-2.5">
              <p className="text-white/50 text-[12px] font-bold">Cada segundo importa. Comece agora.</p>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <p className="text-white/30 text-[10px] uppercase font-bold tracking-[0.4em]">Parceria</p>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-1.5 border border-white/5 flex items-center justify-center gap-2.5 shadow-lg max-w-[160px] mx-auto w-full">
                  <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center p-1 shrink-0">
                    <Building2 className="w-full h-full text-brand-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-black text-[12px] leading-tight">Prefeitura de Mendes/RJ</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'splash' && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-brand-gradient flex flex-col p-3.5 pt-7 overflow-x-hidden"
          >
            <div className="absolute top-3.5 left-3.5 z-10">
              <button 
                onClick={() => setView('selection')}
                className="w-7.5 h-7.5 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md shadow-lg active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="absolute top-3.5 right-3.5 z-10">
              <button onClick={() => setView('notifications')} className="relative w-7.5 h-7.5 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md shadow-lg active:scale-95 transition-all">
                <Bell className="w-3.5 h-3.5 text-brand-secondary fill-brand-secondary/20" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-brand-emergency rounded-full border-2 border-brand-dark" />
                )}
              </button>
            </div>

            <div className="flex flex-col items-center gap-1.25 mb-3.5 flex-1 justify-center overflow-y-auto scrollbar-hide">
              <div className="w-[34vw] h-[34vw] max-w-[127px] max-h-[127px] bg-transparent flex items-center justify-center overflow-hidden relative logo-glow shrink-0">
                <img 
                  src="https://i.postimg.cc/8ThNw3rh/teste.png" 
                  alt="Achei Você Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center space-y-0.5">
                <h1 className="text-[28px] sm:text-[34px] text-white font-black tracking-tighter">
                  ACHEI <span className="text-brand-secondary">VOCÊ</span>
                </h1>
                <p className="text-blue-100 text-[12px] font-bold tracking-[0.2em] uppercase opacity-80">Segurança Infantil</p>
              </div>
              <div className="bg-brand-icon-green text-white px-3.5 py-1 rounded-full text-[14px] sm:text-[16px] font-black flex items-center gap-1.5 mt-1 shadow-[0_0_17px_rgba(24,165,88,0.4)] border border-white/20 animate-pulse-subtle text-center">
                <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Localização Rápida de Crianças
              </div>

              <div className="w-full space-y-1.5 mt-3.5">
                <button 
                  className="btn-mobile btn-emergency py-1.5 text-[15px] sm:text-[17px] animate-emergency"
                  onClick={() => { setRole('citizen'); setView('citizen_scan'); }}
                >
                  <Search className="w-3 h-3" />
                  ENCONTROU UMA CRIANÇA?
                </button>

                <div className="grid grid-cols-1 gap-1.5 w-full">
                  <button 
                    className="btn-mobile btn-primary-mobile py-1.5 text-[15px]"
                    onClick={() => { setRegRole('responsible'); setView('login'); }}
                  >
                    <UserIcon className="w-3 h-3" />
                    Sou Responsável
                  </button>
                  <button 
                    className="btn-mobile btn-success-mobile py-1.5 text-[15px]"
                    onClick={() => { setRegRole('authority'); setRegSubRole('guard'); setView('login'); }}
                  >
                    <Shield className="w-3 h-3" />
                    Prefeitura / Guarda
                  </button>
                  <button 
                    className="btn-mobile btn-secondary-mobile py-1.5 text-[15px]"
                    onClick={() => { setRegRole('authority'); setRegSubRole('authority'); setView('login'); }}
                  >
                    <Siren className="w-3 h-3" />
                    Autoridades
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-auto text-center space-y-2.5 pt-1.5 shrink-0">
              <div className="space-y-1.25">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em]">Patrocinadores</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-1.5 border border-white/10 flex items-center gap-2.5 min-w-[115px] shadow-xl">
                    <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center p-1 shrink-0">
                      <Building2 className="w-full h-full text-brand-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-white/40 font-bold uppercase leading-none mb-1">Apoio</p>
                      <p className="text-white font-black text-[12px] leading-none">Prefeitura de Mendes/RJ</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-1 text-brand-secondary">
                {[1,2,3,4,5].map(i => <Heart key={i} className="w-1.25 h-1.25 fill-current" />)}
                <span className="text-white text-[11px] font-bold ml-1">4.9</span>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'register' && (
          <motion.div 
            key="register"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="h-full flex flex-col bg-brand-gradient text-white p-3.5 pt-7 overflow-hidden"
          >
            <div className="flex items-center gap-3.5 mb-4">
              <button onClick={() => setView('splash')} className="w-7.5 h-7.5 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-[15.6px] sm:text-[17.3px] font-bold leading-tight">
                {regRole === 'responsible' ? 'Cadastro Responsável' : 
                 regSubRole === 'guard' ? 'Cadastro Prefeitura / Guarda' : 'Cadastro Autoridades'}
              </h2>
            </div>

            <div className="flex-1 min-h-0 max-h-full space-y-2.5 overflow-y-auto pb-5 scrollbar-hide">
              <div className="space-y-1">
                <label className="text-[8.5px] font-bold uppercase opacity-60 ml-1 tracking-widest">
                  {regRole === 'responsible' ? 'Nome Completo' : 
                   regSubRole === 'guard' ? 'Nome da Instituição' : 'Instituição'}
                </label>
                <input 
                  type="text" 
                  value={regForm.name}
                  onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                  placeholder={regRole === 'responsible' ? "Digite seu nome" : "Ex: Guarda Municipal / Polícia"}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                />
              </div>

              {regRole === 'responsible' ? (
                <div className="space-y-1">
                  <label className="text-[8.5px] font-bold uppercase opacity-60 ml-1 tracking-widest">CPF</label>
                  <input 
                    type="text" 
                    value={regForm.cpf}
                    onChange={(e) => setRegForm({...regForm, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[8.5px] font-bold uppercase opacity-60 ml-1 tracking-widest">
                    {regSubRole === 'guard' ? 'CNPJ' : 'Departamento'}
                  </label>
                  <input 
                    type="text" 
                    value={regForm.registrationId}
                    onChange={(e) => setRegForm({...regForm, registrationId: e.target.value})}
                    placeholder={regSubRole === 'guard' ? "00.000.000/0000-00" : "Ex: Divisão de Busca"}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[8.5px] font-bold uppercase opacity-60 ml-1 tracking-widest">
                  {regRole === 'responsible' ? 'Celular' : 'Nome do Responsável / Agente'}
                </label>
                <input 
                  type="text" 
                  value={regForm.phone}
                  onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                  placeholder={regRole === 'responsible' ? "(00) 00000-0000" : "Digite o nome completo"}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                />
              </div>

              {regRole !== 'responsible' && (
                <div className="space-y-1">
                  <label className="text-[8.5px] font-bold uppercase opacity-60 ml-1 tracking-widest">Matrícula / ID Funcional</label>
                  <input 
                    type="text" 
                    value={regForm.registrationId}
                    onChange={(e) => setRegForm({...regForm, registrationId: e.target.value})}
                    placeholder="Digite seu ID"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[8.5px] font-bold uppercase opacity-60 ml-1 tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  value={regForm.email}
                  onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                  placeholder="seu@email.com"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-bold uppercase opacity-60 ml-1 tracking-widest">Senha</label>
                <input 
                  type="password" 
                  value={regForm.password}
                  onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                />
              </div>
            </div>

            <div className="pt-2 pb-8 space-y-1.5 shrink-0">
              <button 
                className={cn(
                  "btn-mobile shadow-xl py-2.5 text-[13px]",
                  regRole === 'responsible' ? "btn-primary-mobile" : 
                  regSubRole === 'guard' ? "btn-success-mobile" : "btn-secondary-mobile"
                )}
                onClick={() => { 
                  if (!regForm.email || !regForm.password || !regForm.name) {
                    alert('Por favor, preencha os campos obrigatórios.');
                    return;
                  }
                  
                  if (users.find(u => u.email === regForm.email)) {
                    alert('Este e-mail já está cadastrado. Por favor, faça login.');
                    setView('login');
                    return;
                  }

                  const newUser: User = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: regForm.name,
                    email: regForm.email,
                    password: regForm.password,
                    role: regRole!,
                    subRole: regSubRole || undefined,
                    cpf: regForm.cpf,
                    phone: regForm.phone,
                    registrationId: regForm.registrationId
                  };
                  
                  const updatedUsers = [...users, newUser];
                  setUsers(updatedUsers);
                  localStorage.setItem('achei_voce_users', JSON.stringify(updatedUsers));
                  
                  setCurrentUser(newUser);
                  localStorage.setItem('achei_voce_current_user', JSON.stringify(newUser));
                  
                  setRole(newUser.role);
                  setRegForm({ name: '', cpf: '', phone: '', email: '', password: '', registrationId: '' });
                  setView('dashboard'); 
                }}
              >
                Concluir Cadastro
              </button>
              <button 
                className="w-[85%] mx-auto py-1.5 text-[13.9px] font-bold text-white/60 hover:text-white transition-colors"
                onClick={() => setView('login')}
              >
                Já tem uma conta? <span className="text-brand-secondary">Entrar</span>
              </button>
            </div>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div 
            key="login"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white p-3.5 pt-7 overflow-x-hidden"
          >
            <div className="flex items-center gap-3.5 mb-4">
              <button onClick={() => setView('splash')} className="w-7.5 h-7.5 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-[15.6px] sm:text-[17.3px] font-bold leading-tight">
                {regRole === 'responsible' ? 'Login Responsável' : 
                 regSubRole === 'guard' ? 'Login Prefeitura / Guarda' : 'Login Autoridades'}
              </h2>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto scrollbar-hide">
              <div className="space-y-1">
                <label className="text-[8.5px] font-bold uppercase opacity-60 ml-1 tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  placeholder="seu@email.com"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[8.5px] font-bold uppercase opacity-60 tracking-widest">Senha</label>
                  <button className="text-[8.5px] font-bold text-brand-secondary uppercase tracking-wider">Esqueceu?</button>
                </div>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-1.5 px-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors text-[10.7px]"
                />
              </div>

              <div className="pt-3.5 space-y-2.5">
                <button 
                  className={cn(
                    "btn-mobile shadow-xl py-2 text-[12.2px]",
                    regRole === 'responsible' ? "btn-primary-mobile" : 
                    regSubRole === 'guard' ? "btn-success-mobile" : "btn-secondary-mobile"
                  )}
                  onClick={() => { 
                    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
                    if (user) {
                      // Check if user role matches the intended login panel
                      if (user.role !== regRole) {
                        const roleName = user.role === 'responsible' ? 'Responsável' : 'Autoridade';
                        alert(`Acesso Negado: Esta conta foi cadastrada como "${roleName}". Por favor, use o botão correto na tela inicial.`);
                        return;
                      }
                      
                      // If it's an authority, check if subRole matches (Guard vs Authority)
                      if (user.role === 'authority' && user.subRole !== regSubRole) {
                        const subRoleName = user.subRole === 'guard' ? 'Prefeitura / Guarda' : 'Autoridades';
                        alert(`Acesso Negado: Esta conta pertence ao painel de "${subRoleName}".`);
                        return;
                      }

                      setCurrentUser(user);
                      setRole(user.role);
                      setView('dashboard');
                    } else {
                      // Check if email exists but password is wrong
                      const emailExists = users.find(u => u.email === loginForm.email);
                      if (emailExists) {
                        alert('Senha incorreta. Por favor, tente novamente.');
                      } else {
                        alert('E-mail não encontrado. Por favor, cadastre-se primeiro.');
                      }
                    }
                  }}
                >
                  Entrar no Painel
                </button>
                <button 
                  className="w-[85%] mx-auto py-1.5 text-[13.9px] font-bold text-white/60 hover:text-white transition-colors"
                  onClick={() => setView('register')}
                >
                  Não tem conta? <span className="text-brand-secondary">Cadastre-se</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'dashboard' && role === 'responsible' && (
          <motion.div 
            key="resp-dash"
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white overflow-x-hidden"
          >
            {/* Header */}
            <div className="p-2.5 pt-6 flex justify-between items-center bg-transparent border-b border-white/10 shrink-0">
              <button onClick={() => setView('splash')} className="w-6.5 h-6.5 sm:w-8.5 sm:h-8.5 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group active:scale-95 transition-all overflow-hidden shrink-0">
                <img 
                  src="https://i.postimg.cc/8ThNw3rh/teste.png" 
                  alt="Logo" 
                  className="w-5 h-5 sm:w-6.5 sm:h-6.5 object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>
              <h2 className="text-[16px] sm:text-[18px] font-bold">Dashboard</h2>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setView('notifications')} className="relative">
                  <Bell className="w-3.5 h-3.5 sm:w-4.25 sm:h-4.25 text-brand-secondary fill-brand-secondary/20" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.25 h-1.25 bg-brand-emergency rounded-full border border-brand-dark" />
                  )}
                </button>
                <button onClick={() => setView('settings')}><Settings className="w-3.5 h-3.5 sm:w-4.25 sm:h-4.25 text-white/60" /></button>
              </div>
            </div>

            <div className="p-3 min-h-0 space-y-2.5 overflow-y-auto flex-1 scrollbar-hide">
              {/* Profile Card */}
              <div className="flex items-center gap-2">
                <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full border-2 border-white/20 shadow-lg overflow-hidden relative group shrink-0">
                  <img src={userProfile.photo} alt={userProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => setView('settings')}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[18px] sm:text-[20px] text-white truncate font-bold">{userProfile.name}</h3>
                  <p className="text-white/60 text-[14px] sm:text-[15px] uppercase tracking-widest">{role === 'responsible' ? 'Responsável' : 'Autoridade'}</p>
                </div>
              </div>

              {/* Children List */}
              <div className="space-y-2">
                <h4 className="text-[14px] sm:text-[15px] font-bold text-white/40 uppercase tracking-widest ml-1">Minhas Crianças</h4>
                <div className="space-y-1.5">
                  {children.filter(child => child.responsibleId === currentUser?.id).map((child) => (
                    <button 
                      key={child.id} 
                      onClick={() => { setSelectedChildId(child.id); setView('child_details'); }}
                      className="w-[85%] mx-auto bg-white/5 p-1.5 rounded-2xl border border-white/10 card-shadow flex items-center gap-2 text-left active:bg-white/10 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/20 shrink-0">
                        <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold truncate">{child.name}</h4>
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] font-bold",
                          child.status === 'safe' ? "text-brand-icon-green" : "text-brand-emergency"
                        )}>
                          <div className={cn(
                            "w-0.75 h-0.75 rounded-full",
                            child.status === 'safe' ? "bg-brand-icon-green animate-pulse" : "bg-brand-emergency animate-pulse"
                          )} />
                          {child.status === 'safe' ? 'Seguro • Pulseira Ativa' : 'DESAPARECIDO'}
                        </div>
                      </div>
                      <div className="p-1 bg-white/10 rounded-lg shrink-0"><ChevronLeft className="w-2 h-2 rotate-180" /></div>
                    </button>
                  ))}
                </div>
                {children.filter(child => child.responsibleId === currentUser?.id).length === 0 && (
                  <div className="py-5 text-center space-y-1.5 opacity-30">
                    <Plus className="w-6 h-6 mx-auto" />
                    <p className="text-[13px] font-bold">Nenhuma criança cadastrada.</p>
                  </div>
                )}
              </div>

              {/* QR & Summary Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="qr-container card-shadow p-1.5 h-28 flex flex-col justify-center items-center text-center" onClick={() => {
                  const userChildren = children.filter(c => c.responsibleId === currentUser?.id);
                  if (userChildren.length === 0) {
                    setView('register_child');
                  } else if (userChildren.length === 1) {
                    setSelectedChildId(userChildren[0].id);
                    setView('qr_generator');
                    setScanSuccess(false);
                    setIsScanning(false);
                  } else {
                    alert('Selecione a criança na lista acima para vincular a pulseira.');
                  }
                }}>
                  <p className="text-[13px] font-bold text-white/60 mb-1">Vincular Pulseira</p>
                  <div className="p-1 bg-white/10 rounded-xl">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary" />
                  </div>
                </div>
                <div className="bg-white/5 p-1.5 rounded-2xl border border-white/10 card-shadow h-28 flex flex-col justify-center items-center text-center">
                  <p className="text-[13px] font-bold text-white/60 mb-0.5">Total de Crianças</p>
                  <div className="text-lg sm:text-[19px] font-black text-brand-primary">
                    {children.filter(child => child.responsibleId === currentUser?.id).length}
                  </div>
                </div>
              </div>

              {/* Emergency Button */}
              <button 
                className="btn-mobile btn-emergency py-2 sm:py-2.5 flex-row gap-2 shadow-2xl shadow-red-900/20"
                onClick={() => {
                  const userChildren = children.filter(c => c.responsibleId === currentUser?.id);
                  if (userChildren.length === 1) {
                    setEmergencyChildId(userChildren[0].id);
                    setEmergencyStep('alert');
                    setChildren(prev => prev.map(c => c.id === userChildren[0].id ? { ...c, status: 'missing' } : c));
                  } else {
                    setEmergencyStep('select');
                  }
                  setView('emergency');
                }}
              >
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[15px] sm:text-[17px]">Botão de Emergência</span>
              </button>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-white/5 p-1.5 rounded-2xl border border-white/10 card-shadow flex items-center gap-1.5 justify-center">
                  <div className="p-1 bg-white/10 rounded-full shrink-0"><History className="w-2.5 h-2.5 text-white/60" /></div>
                  <span className="text-[13px] font-bold truncate">Histórico</span>
                </button>
                <button className="bg-white/5 p-1.5 rounded-2xl border border-white/10 card-shadow flex items-center gap-1.5 justify-center" onClick={() => setView('settings')}>
                  <div className="p-1 bg-brand-success/20 rounded-full shrink-0"><Settings className="w-2.5 h-2.5 text-brand-success" /></div>
                  <span className="text-[13px] font-bold truncate">Configurações</span>
                </button>
              </div>

              {/* Bottom Sections from Image */}
              <div className="space-y-2 pt-1">
                <h4 className="text-[14px] sm:text-[15px] font-bold text-white/40 uppercase tracking-widest ml-1">Para Responsáveis</h4>
                <div className="space-y-1.5">
                  <ActionCard 
                    icon={<UserIcon className="text-brand-secondary w-3 h-3" />} 
                    title="Cadastrar Criança" 
                    onClick={() => setView('register_child')}
                  />
                  <ActionCard 
                    icon={<QrCode className="text-brand-icon-green w-3 h-3" />} 
                    title="Vincular QR Code" 
                    onClick={() => setView('qr_generator')}
                  />
                  <ActionCard 
                    icon={<MapIcon className="text-brand-primary w-3 h-3" />} 
                    title="Modo Evento" 
                    onClick={() => {}}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="glass-nav p-1.5 sm:p-2.5 flex justify-around items-center shrink-0">
              <button onClick={() => setView('dashboard')} className={cn(view === 'dashboard' ? "text-white" : "text-white/40")}><MapIcon className="w-3.5 h-3.5" /></button>
              <button onClick={() => setView('notifications')} className={cn("relative", view === 'notifications' ? "text-white" : "text-white/40")}>
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-brand-emergency rounded-full border border-brand-dark" />
                )}
              </button>
              <button 
                onClick={() => setView('register_child')}
                className="w-8.5 h-8.5 sm:w-10 sm:h-10 bg-brand-primary rounded-full flex items-center justify-center -mt-6 sm:-mt-7.5 shadow-2xl border-4 border-brand-dark active:scale-90 transition-transform shrink-0"
              >
                <Plus className="text-white w-4.25 h-4.25 sm:w-5 sm:h-5" />
              </button>
              <button className="text-white/40"><History className="w-3.5 h-3.5" /></button>
              <button onClick={() => setView('settings')} className={cn(view === 'settings' ? "text-white" : "text-white/40")}><UserIcon className="w-3.5 h-3.5" /></button>
            </div>
          </motion.div>
        )}

        {view === 'dashboard' && role === 'authority' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-brand-dark flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-2.5 pt-6 sm:p-5 sm:pt-9 flex justify-between items-center bg-transparent border-b border-white/10 shrink-0">
              <button onClick={() => setView('splash')} className="w-7.5 h-7.5 sm:w-10 sm:h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group active:scale-95 transition-all overflow-hidden shrink-0">
                <img 
                  src="https://i.postimg.cc/8ThNw3rh/teste.png" 
                  alt="Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>
              <h2 className="text-[18px] sm:text-[22px] font-bold">Painel Autoridade</h2>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setView('notifications')} className="relative">
                  <Bell className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-brand-secondary fill-brand-secondary/20" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-brand-emergency rounded-full border-2 border-brand-dark" />
                  )}
                </button>
                <button onClick={() => setView('settings')}><Settings className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white/60" /></button>
              </div>
            </div>

            <div className="p-2.5 sm:p-5 min-h-0 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
              <button 
                onClick={() => setIsAuthorityOnline(!isAuthorityOnline)}
                className={cn(
                  "w-[85%] mx-auto p-3.5 sm:p-5 rounded-[17px] sm:rounded-[27px] shadow-xl flex items-center justify-between transition-all active:scale-95",
                  isAuthorityOnline ? "bg-brand-primary" : "bg-white/10 border border-white/20"
                )}
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  <div className={cn(
                    "w-8.5 h-8.5 sm:w-13.5 sm:h-13.5 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                    isAuthorityOnline ? "bg-white/20" : "bg-white/5"
                  )}>
                    <Shield className={cn("w-4 h-4 sm:w-7 sm:h-7", isAuthorityOnline ? "text-white" : "text-white/40")} />
                  </div>
                  <div className="text-left min-w-0">
                    <h3 className="text-[18px] sm:text-[26px] font-bold truncate">Guarda Municipal</h3>
                    <p className={cn("text-[12px] sm:text-[16px] truncate", isAuthorityOnline ? "text-blue-200" : "text-white/40")}>
                      Unidade Centro • {isAuthorityOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "w-7.5 h-3.5 sm:w-10 sm:h-5 rounded-full relative transition-colors shrink-0",
                  isAuthorityOnline ? "bg-brand-icon-green" : "bg-white/20"
                )}>
                  <motion.div 
                    animate={{ x: isAuthorityOnline ? (window.innerWidth < 400 ? 15 : 20) : 3 }}
                    className="absolute top-1 w-2 h-2 sm:w-3.5 sm:h-3.5 bg-white rounded-full shadow-md"
                  />
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                <button 
                  onClick={() => setView('authority_alerts')}
                  className="bg-white/5 p-3.5 sm:p-5 rounded-[20px] sm:rounded-[27px] border border-white/10 card-shadow flex flex-col items-center gap-1.5 sm:gap-2.5 text-center active:bg-white/10 transition-all aspect-square justify-center"
                >
                  <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 bg-red-100/20 text-brand-emergency rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-bold text-white/80 text-[16px] sm:text-[18px]">Alertas</span>
                </button>
                <button className="bg-white/5 p-3.5 sm:p-5 rounded-[20px] sm:rounded-[27px] border border-white/10 card-shadow flex flex-col items-center gap-1.5 sm:gap-2.5 text-center active:bg-white/10 transition-all aspect-square justify-center">
                  <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 bg-blue-100/20 text-brand-primary rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <MapIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-bold text-white/80 text-[16px] sm:text-[18px]">Mapa</span>
                </button>
                <button className="bg-white/5 p-3.5 sm:p-5 rounded-[20px] sm:rounded-[27px] border border-white/10 card-shadow flex flex-col items-center gap-1.5 sm:gap-2.5 text-center active:bg-white/10 transition-all aspect-square justify-center">
                  <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 bg-orange-100/20 text-brand-secondary rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-bold text-white/80 text-[16px] sm:text-[18px]">Atendimentos</span>
                </button>
                <button 
                  onClick={() => setView('authority_reports')}
                  className="bg-white/5 p-3.5 sm:p-5 rounded-[20px] sm:rounded-[27px] border border-white/10 card-shadow flex flex-col items-center gap-1.5 sm:gap-2.5 text-center active:bg-white/10 transition-all aspect-square justify-center"
                >
                  <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 bg-white/10 text-white/60 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <History className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-bold text-white/80 text-[16px] sm:text-[18px]">Relatórios</span>
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-[13px] sm:text-[16px] font-bold text-white/40 uppercase tracking-widest">Ocorrências Ativas</h4>
                  <span className="px-1.5 py-0.5 bg-brand-emergency/20 text-brand-emergency text-[13px] font-black rounded-full">
                    {children.filter(c => c.status === 'missing').length} ATIVAS
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  {children.filter(c => c.status === 'missing').map(child => (
                    <button 
                      key={child.id}
                      onClick={() => { setSelectedChildId(child.id); setView('occurrence_details'); }}
                      className="w-[85%] mx-auto bg-white/5 p-3.5 rounded-2xl border border-white/10 card-shadow border-l-4 border-red-500 flex items-center gap-3.5 text-left active:bg-white/10 transition-all"
                    >
                      <div className="w-10 h-10 bg-white/10 rounded-xl overflow-hidden shrink-0">
                        <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-[18px] sm:text-[20px] truncate">{child.name}, {child.age} anos</p>
                        <p className="text-[13px] sm:text-[16px] text-white/40">Desaparecido há 15 min</p>
                      </div>
                      <div className="p-1.5 bg-brand-primary text-white rounded-lg shrink-0"><Navigation className="w-3.5 h-3.5" /></div>
                    </button>
                  ))}
                  {children.filter(c => c.status === 'missing').length === 0 && (
                    <div className="py-7 text-center space-y-1.5 opacity-40">
                      <CheckCircle2 className="w-10 h-10 mx-auto" />
                      <p className="text-[19px] font-bold">Nenhuma ocorrência ativa no momento.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'authority_reports' && (
          <motion.div 
            key="auth-reports"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="h-full flex flex-col bg-brand-gradient text-white p-3 pt-6 sm:p-4 sm:pt-8 overflow-hidden"
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 mb-3.5 shrink-0">
              <button onClick={() => setView('authority_dashboard')} className="w-6 h-6 sm:w-7 sm:h-7 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <h2 className="text-[15.6px] sm:text-[17.3px] font-bold leading-tight">Relatórios e Comunicados</h2>
            </div>

            <div className="flex-1 min-h-0 max-h-full flex flex-col gap-1.5 sm:gap-2.5 overflow-y-auto scrollbar-hide">
              <div className="bg-white/5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/10 flex-1 flex flex-col gap-1.5 sm:gap-2.5 min-h-[127px] sm:min-h-[170px]">
                <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 sm:pb-2.5 shrink-0">
                  <div className="p-1.5 bg-brand-secondary/20 rounded-lg"><History className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-secondary" /></div>
                  <div>
                    <h4 className="font-bold text-[16px] sm:text-[17px]">Bloco de Notas Compartilhado</h4>
                    <p className="text-[12px] sm:text-[13px] opacity-40 uppercase tracking-widest">Atualizado em tempo real</p>
                  </div>
                </div>
                <textarea 
                  value={authorityNotes}
                  onChange={(e) => setAuthorityNotes(e.target.value)}
                  placeholder="Digite aqui comunicados importantes para outros agentes..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none text-[16px] sm:text-[17px] leading-relaxed"
                />
              </div>
              
              <div className="bg-brand-primary/10 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-brand-primary/20 flex items-start gap-1.5 sm:gap-2 shrink-0">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-primary shrink-0 mt-0.5" />
                <p className="text-[12px] sm:text-[13px] text-blue-100 leading-relaxed">
                  Este bloco de notas é visível para todos os agentes da Unidade Centro. Use para informações táticas e avisos rápidos.
                </p>
              </div>
            </div>

            <div className="pt-2.5 pb-10 shrink-0">
              <button 
                onClick={() => setView('authority_dashboard')}
                className="btn-mobile btn-primary-mobile py-1.5 sm:py-2 shadow-xl shrink-0 text-[17px] sm:text-[19px]"
              >
                Salvar e Voltar
              </button>
            </div>
          </motion.div>
        )}

        {view === 'authority_alerts' && (
          <motion.div 
            key="auth-alerts"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="h-full flex flex-col bg-brand-gradient text-white p-3 pt-6 sm:p-4 sm:pt-8 overflow-hidden"
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 mb-3.5 shrink-0">
              <button onClick={() => setView('authority_dashboard')} className="w-6 h-6 sm:w-7 sm:h-7 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <h2 className="text-[15.6px] sm:text-[17.3px] font-bold leading-tight">Alertas de Emergência</h2>
            </div>

            <div className="flex-1 min-h-0 max-h-full space-y-1.5 sm:space-y-2.5 overflow-y-auto pb-10 scrollbar-hide">
              {children.filter(c => c.status === 'missing').map(child => (
                <div key={child.id} className="bg-brand-emergency/10 p-2.5 sm:p-3.5 rounded-xl sm:rounded-[20px] border border-brand-emergency/30 space-y-2.5 sm:space-y-3.5">
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 bg-brand-emergency rounded-lg sm:rounded-xl flex items-center justify-center animate-pulse shrink-0">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[15px] sm:text-[17px] font-black uppercase tracking-tighter truncate">ALERTA ATIVO</h4>
                      <p className="text-[12px] sm:text-[13px] opacity-60">Acionado há 15 min</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-white/10 flex items-center gap-1.5 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-lg sm:rounded-xl overflow-hidden border border-white/20 shrink-0">
                      <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-[15px] sm:text-[17px] font-bold truncate">{child.name}</h5>
                      <p className="text-[12px] sm:text-[13px] opacity-60 truncate">{child.age} anos • {child.description?.substring(0, 30)}...</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => { setSelectedChildId(child.id); setView('occurrence_details'); }}
                      className="py-1.2 sm:py-1.6 bg-white/10 rounded-lg sm:rounded-xl text-[12px] sm:text-[13px] font-black uppercase tracking-widest border border-white/10 active:bg-white/20 transition-colors"
                    >
                      Ver Detalhes
                    </button>
                    <button className="py-1.2 sm:py-1.6 bg-brand-primary rounded-lg sm:rounded-xl text-[12px] sm:text-[13px] font-black uppercase tracking-widest active:bg-brand-primary/80 transition-colors">
                      Traçar Rota
                    </button>
                  </div>
                </div>
              ))}
              {children.filter(c => c.status === 'missing').length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 sm:py-13.5 opacity-30">
                  <Shield className="w-8.5 h-8.5 sm:w-13.5 sm:h-13.5 mb-1.5 sm:mb-2.5" />
                  <p className="text-[17px] sm:text-[22px] font-bold">Nenhum alerta de emergência ativo.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'occurrence_details' && selectedChildId && (
          <motion.div 
            key="occ-details"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="h-full flex flex-col bg-brand-gradient text-white p-3 pt-6 sm:p-4 sm:pt-8 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 mb-3.5 shrink-0">
              <button onClick={() => setView('authority_dashboard')} className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-[15.6px] sm:text-[17.3px] font-bold leading-tight">Detalhes da Ocorrência</h2>
            </div>

            {(() => {
              const child = children.find(c => c.id === selectedChildId);
              if (!child) return null;

              return (
                <>
                  <div className="flex-1 min-h-0 max-h-full space-y-3.5 overflow-y-auto pb-4 scrollbar-hide">
                    <div className="bg-white/5 p-3.5 sm:p-4.5 rounded-[17px] sm:rounded-[20px] border border-white/10 space-y-3.5">
                      <div className="aspect-square w-full max-w-[170px] sm:max-w-[204px] mx-auto rounded-xl sm:rounded-2xl overflow-hidden border-4 border-brand-emergency shadow-2xl shrink-0">
                        <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      
                      <div className="text-center space-y-0.5">
                        <h3 className="text-[17.3px] sm:text-[19px] font-black truncate">{child.name}</h3>
                        <p className="text-brand-emergency font-bold uppercase tracking-[0.2em] text-[12px] sm:text-[15px]">Desaparecido</p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 text-center">
                          <p className="text-[12px] font-bold opacity-40 uppercase tracking-widest">Idade</p>
                          <p className="text-[17px] sm:text-[19px] font-bold">{child.age} anos</p>
                        </div>
                        <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 text-center">
                          <p className="text-[12px] font-bold opacity-40 uppercase tracking-widest">Sexo</p>
                          <p className="text-[17px] sm:text-[19px] font-bold truncate">{child.gender === 'M' ? 'Masculino' : child.gender === 'F' ? 'Feminino' : child.gender || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Medical Info */}
                      {(child.allergies || child.medications || child.disability) && (
                        <div className="bg-brand-emergency/10 p-2.5 rounded-xl border border-brand-emergency/20 space-y-1.5">
                          <p className="text-[13px] font-bold text-brand-emergency uppercase tracking-widest flex items-center gap-1.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Informações Médicas Críticas
                          </p>
                          <div className="space-y-1.5">
                            {child.allergies && (
                              <div>
                                <p className="text-[12px] font-bold opacity-60 uppercase">Alergias</p>
                                <p className="text-[15px] sm:text-[17px] font-bold">{child.allergies}</p>
                              </div>
                            )}
                            {child.medications && (
                              <div>
                                <p className="text-[12px] font-bold opacity-60 uppercase">Medicamentos</p>
                                <p className="text-[15px] sm:text-[17px] font-bold">{child.medications}</p>
                              </div>
                            )}
                            {child.disability && (
                              <div>
                                <p className="text-[10px] font-bold opacity-60 uppercase">Deficiência / Condição</p>
                                <p className="text-[15px] sm:text-[17px] font-bold">{child.disability}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                        <p className="text-[12px] font-bold opacity-40 uppercase tracking-widest">Características</p>
                        <p className="text-[15px] sm:text-[17px] leading-relaxed">{child.description || 'Nenhuma descrição fornecida.'}</p>
                      </div>

                      <div className="bg-brand-primary/10 p-2.5 rounded-xl border border-brand-primary/20 space-y-1.5">
                        <p className="text-[12px] font-bold text-brand-primary uppercase tracking-widest">Responsável</p>
                        <div className="flex justify-between items-center gap-1.5">
                          <p className="font-bold text-[15px] sm:text-[17px] truncate">{child.responsibleName}</p>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => {
                                if (child.responsiblePhone) {
                                  window.location.href = `tel:${child.responsiblePhone.replace(/\D/g, '')}`;
                                } else {
                                  alert('Telefone do responsável não cadastrado.');
                                }
                              }}
                              className="p-1.5 bg-brand-primary text-white rounded-lg active:scale-95 transition-transform shrink-0"
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => {
                                if (child.responsiblePhone) {
                                  const phone = child.responsiblePhone.replace(/\D/g, '');
                                  const message = encodeURIComponent("Olá! Tudo bem? Encontre a criança neste momento, ela está bem e em segurança. 🙏 Pode me orientar como faço para te encontrar ou me informar onde você está agora? Se preferir, posso te enviar minha localização. Aguardo seu retorno.");
                                  window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                                } else {
                                  alert('Telefone do responsável não cadastrado.');
                                }
                              }}
                              className="p-1.5 bg-[#25D366] text-white rounded-lg active:scale-95 transition-transform shrink-0"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2.5 pb-10 shrink-0">
                    <button 
                      onClick={() => {
                        setSelectedChildId(child.id);
                        setView('log_found_location');
                      }}
                      className="btn-mobile btn-success-mobile py-1.5 font-black uppercase tracking-widest text-[15px] sm:text-[17px]"
                    >
                      Marcar como Encontrado
                    </button>
                    <button 
                      disabled={isSharing}
                      onClick={() => {
                        setIsSharing(true);
                        // Simulate effective sharing with units
                        setTimeout(() => {
                          setIsSharing(false);
                          alert(`ALERTA ENVIADO!\n\nA ficha de ${child.name} foi compartilhada com todas as unidades da Guarda Municipal, Polícia Militar e Pontos de Apoio em um raio de 10km.`);
                        }, 1500);
                      }}
                      className={cn(
                        "btn-mobile py-1.5 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-xl transition-all text-[15px] sm:text-[17px]",
                        isSharing ? "bg-white/20 text-white/40 cursor-wait" : "bg-white/10 text-white border border-white/20 active:bg-white/20"
                      )}
                    >
                      {isSharing ? 'Compartilhando...' : 'Compartilhar com Unidades'}
                    </button>
                    <button 
                      onClick={() => setView('authority_dashboard')}
                      className="btn-mobile btn-secondary-mobile py-1.5 font-black uppercase tracking-widest opacity-60 mt-1.5 text-[15px] sm:text-[17px]"
                    >
                      Voltar
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {view === 'log_found_location' && selectedChildId && (
          <motion.div 
            key="log-found"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="h-full flex flex-col bg-brand-gradient text-white p-3 pt-6 sm:p-4 sm:pt-8 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 mb-3.5 shrink-0">
              <button onClick={() => setView('occurrence_details')} className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-[15.6px] sm:text-[17.3px] font-bold leading-tight">Registrar Localização</h2>
            </div>

            {(() => {
              const child = children.find(c => c.id === selectedChildId);
              if (!child) return null;

              return (
                <>
                  <div className="flex-1 min-h-0 max-h-full space-y-4 overflow-y-auto pb-4 scrollbar-hide">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20">
                          <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[17px]">{child.name}</h3>
                          <p className="text-[13px] opacity-60 uppercase tracking-widest">Registrar Encontro</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold opacity-60 uppercase tracking-widest ml-1">Localização (Endereço/Ponto de Referência)</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                            <input 
                              type="text"
                              value={foundLocationForm.address}
                              onChange={(e) => setFoundLocationForm(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Ex: Praça Central, Próximo ao Coreto"
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[15px] focus:border-brand-primary outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold opacity-60 uppercase tracking-widest ml-1">Observações Adicionais</label>
                          <textarea 
                            value={foundLocationForm.notes}
                            onChange={(e) => setFoundLocationForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Ex: A criança estava bem, acompanhada por um cidadão..."
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[15px] focus:border-brand-primary outline-none transition-colors resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 pb-10 shrink-0">
                    <button 
                      onClick={() => {
                        if (!foundLocationForm.address) {
                          alert('Por favor, informe a localização onde a criança foi encontrada.');
                          return;
                        }
                        
                        setChildren(prev => prev.map(c => c.id === child.id ? { 
                          ...c, 
                          status: 'safe',
                          foundLocation: {
                            lat: -22.5312, // Mock lat
                            lng: -43.7289, // Mock lng
                            address: foundLocationForm.address
                          },
                          foundTime: new Date(),
                          description: c.description + (foundLocationForm.notes ? `\n\nObs Encontro: ${foundLocationForm.notes}` : '')
                        } : c));
                        
                        alert(`SUCESSO!\n\nO encontro de ${child.name} foi registrado. O responsável será notificado imediatamente.`);
                        setFoundLocationForm({ address: '', notes: '' });
                        setView('authority_dashboard');
                      }}
                      className="btn-mobile btn-success-mobile py-2.5 font-black uppercase tracking-widest text-[17px] sm:text-[19px] shadow-xl"
                    >
                      Confirmar Encontro
                    </button>
                    <button 
                      onClick={() => setView('occurrence_details')}
                      className="btn-mobile bg-white/5 border border-white/10 py-2.5 font-black uppercase tracking-widest text-[15px] mt-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {view === 'citizen_scan' && (
          <motion.div 
            key="citizen-scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col bg-brand-gradient p-3 pt-6 sm:p-4 sm:pt-8 text-white overflow-x-hidden"
          >
            <button onClick={() => { setView('splash'); setScanSuccess(false); }} className="mb-3.5 text-white shrink-0"><ChevronLeft className="w-5 h-5" /></button>
            <div className="text-center space-y-2.5 flex-1 flex flex-col justify-center">
              <div className="w-10 h-10 sm:w-13.5 sm:h-13.5 bg-brand-emergency/20 rounded-2xl flex items-center justify-center mx-auto shrink-0">
                <Search className="w-5 h-5 sm:w-7 sm:h-7 text-brand-emergency" />
              </div>
              <div className="space-y-1">
                <h2 className="text-[19px] sm:text-[22.4px] font-bold">Escanear Pulseira</h2>
                <p className="text-white/60 text-[15px] sm:text-[17px]">Aproxime a câmera do QR Code na pulseira da criança encontrada.</p>
              </div>
              
              <div className="relative aspect-square w-full max-w-[170px] sm:max-w-[204px] mx-auto bg-black/40 rounded-[20px] sm:rounded-[27px] border-2 border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {!scanSuccess ? (
                  <>
                    {!isScanning ? (
                      <div className="flex flex-col items-center gap-2.5 text-center p-3.5">
                        <Camera className="w-8.5 h-8.5 sm:w-10 sm:h-10 text-brand-secondary opacity-40" />
                        <p className="text-[11px] sm:text-[13px] font-bold opacity-60 uppercase tracking-widest">Câmera Pronta</p>
                      </div>
                    ) : (
                      <div id="qr-reader" className="w-full h-full" />
                    )}
                  </>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2.5"
                  >
                    <div className="w-10 h-10 sm:w-13.5 sm:h-17 bg-brand-icon-green rounded-full flex items-center justify-center shadow-2xl">
                      <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-8.5 text-white" />
                    </div>
                    <p className="font-bold text-brand-icon-green uppercase tracking-widest text-[11px] sm:text-[13px]">Identificado!</p>
                  </motion.div>
                )}
              </div>

              <div className="mt-3.5 space-y-1.5 shrink-0">
                {!scanSuccess ? (
                  <button 
                    className="btn-mobile btn-emergency-mobile py-2 text-[13px] sm:text-[15px]" 
                    onClick={() => setIsScanning(true)}
                    disabled={isScanning}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {isScanning ? 'Escaneando...' : 'Iniciar Scanner'}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-brand-secondary animate-pulse">
                    <MapPin className="w-3.5 h-3.5" />
                    <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-widest">Obtendo Localização...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'location' && (
          <motion.div 
            key="location"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white overflow-x-hidden"
          >
            <div className="p-2.5 pt-5 sm:p-3.5 sm:pt-7 flex items-center justify-between bg-transparent border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <button onClick={() => setView('splash')} className="shrink-0"><ChevronLeft className="w-4 h-4" /></button>
                <h2 className="text-[18px] sm:text-[20px] font-bold leading-tight">Localização</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="relative shrink-0">
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-secondary fill-brand-secondary/20" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-emergency rounded-full border-2 border-brand-dark" />
                </button>
                <button className="shrink-0"><Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" /></button>
              </div>
            </div>

            <div className="flex-1 relative bg-slate-200 overflow-hidden">
              {/* Simulated Map */}
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/800/1200')] bg-cover opacity-50" />
              
              {/* Map Pins */}
              <div className="absolute top-1/4 left-1/3"><MapPin className="text-brand-icon-green w-5 h-5 sm:w-7 sm:h-7 fill-brand-icon-green/20" /></div>
              <div className="absolute top-1/2 left-1/2"><MapPin className="text-brand-pin-yellow w-7 h-7 sm:w-8.5 sm:h-8.5 fill-brand-pin-yellow/20" /></div>
              <div className="absolute bottom-1/3 right-1/4"><MapPin className="text-brand-emergency w-5 h-5 sm:w-7 sm:h-7 fill-brand-emergency/20" /></div>

              {/* Found Child Card */}
              <div className="absolute bottom-2.5 sm:bottom-5 left-2.5 sm:left-5 right-2.5 sm:right-5 bg-blue-900/80 backdrop-blur-xl rounded-[20px] sm:rounded-[27px] p-2.5 sm:p-4.5 shadow-2xl border border-white/10 space-y-2.5 sm:space-y-5">
                <div className="text-center space-y-1.5">
                  <h3 className="text-[20px] sm:text-[26px] text-white font-black">Criança Encontrada!</h3>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-8.5 h-8.5 sm:w-13.5 sm:h-13.5 rounded-xl overflow-hidden border-2 border-brand-secondary shadow-lg shrink-0">
                      <img src={scannedChild?.photo || "https://picsum.photos/seed/lucas/200"} alt={scannedChild?.name || "Criança"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[18px] sm:text-[23px] font-bold text-white truncate">{scannedChild?.name || "Lucas"}, {scannedChild?.age || 6} anos</p>
                      <div className="flex gap-0.5 text-brand-secondary">
                        {[1,2,3,4,5].map(i => <Heart key={i} className="w-2 h-2 fill-current" />)}
                      </div>
                    </div>
                  </div>
                  {scannedChild && (scannedChild.allergies || scannedChild.medications || scannedChild.disability) && (
                    <div className="bg-brand-emergency/20 p-1.5 rounded-lg border border-brand-emergency/30 text-left mt-1.5">
                      <p className="text-[10px] font-bold text-brand-emergency uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                        <AlertTriangle className="w-2 h-2" />
                        Atenção Médica
                      </p>
                      <p className="text-[10px] text-white/80 line-clamp-2">
                        {[scannedChild.allergies, scannedChild.medications, scannedChild.disability].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="btn-mobile btn-success-mobile py-2 text-[13px] sm:text-[15px] flex items-center justify-center gap-1.5"
                      onClick={() => {
                        if (scannedChild?.responsiblePhone) {
                          window.location.href = `tel:${scannedChild.responsiblePhone.replace(/\D/g, '')}`;
                        } else {
                          alert('Telefone do responsável não cadastrado.');
                        }
                      }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Ligar
                    </button>
                    <button 
                      className="btn-mobile bg-[#25D366] text-white py-2 text-[13px] sm:text-[15px] rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-xl active:scale-95 transition-all"
                      onClick={() => {
                        if (scannedChild?.responsiblePhone) {
                          const phone = scannedChild.responsiblePhone.replace(/\D/g, '');
                          const message = encodeURIComponent("Olá! Tudo bem? Encontre a criança neste momento, ela está bem e em segurança. 🙏 Pode me orientar como faço para te encontrar ou me informar onde você está agora? Se preferir, posso te enviar minha localização. Aguardo seu retorno.");
                          window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                        } else {
                          alert('Telefone do responsável não cadastrado.');
                        }
                      }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </div>
                  <button 
                    className="btn-mobile btn-primary-mobile py-2 text-[13px] sm:text-[15px]"
                    onClick={() => {
                      alert('Guarda Municipal acionada! Uma viatura está a caminho da sua localização.');
                    }}
                  >
                    Acionar Guarda
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'qr_generator' && (
          <motion.div 
            key="qr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col bg-brand-gradient p-3 pt-6 sm:p-4 sm:pt-8 text-white overflow-x-hidden"
          >
            <button onClick={() => { setView('dashboard'); setScanSuccess(false); }} className="mb-4 text-white w-fit shrink-0"><ChevronLeft className="w-6 h-6" /></button>
            <div className="text-center space-y-3 sm:space-y-4 flex-1 flex flex-col justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-secondary/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shrink-0">
                <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-brand-secondary" />
              </div>
              <div className="space-y-1 shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold">Vincular Pulseira</h2>
                <p className="text-white/60 text-[14px] sm:text-[17px]">
                  {selectedChildId === 'TEMP_REG' 
                    ? 'Escaneie o QR Code da pulseira física para o novo cadastro.' 
                    : `Escaneie o QR Code da pulseira física para registrar ${activeChild?.name}.`}
                </p>
              </div>
              
              <div className="relative aspect-square w-full max-w-[200px] sm:max-w-[240px] mx-auto bg-black/40 rounded-[24px] sm:rounded-[32px] border-2 border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {!scanSuccess ? (
                  <>
                    {!isScanning ? (
                      <div className="flex flex-col items-center gap-3 text-center p-4">
                        <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-brand-secondary opacity-40" />
                        <p className="text-[11px] sm:text-[14px] font-bold opacity-60 uppercase tracking-widest">Câmera Pronta</p>
                      </div>
                    ) : (
                      <div id="qr-reader" className="w-full h-full" />
                    )}
                  </>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-17 bg-brand-icon-green rounded-full flex items-center justify-center shadow-2xl">
                      <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-8.5 text-white" />
                    </div>
                    <p className="font-bold text-brand-icon-green text-[10px] sm:text-[14px] uppercase tracking-widest">PULSEIRA VINCULADA!</p>
                  </motion.div>
                )}
              </div>

              <div className="mt-4 space-y-2 shrink-0">
                {!scanSuccess ? (
                  <button 
                    className="btn-mobile btn-primary-mobile py-2 text-[14px] sm:text-[16px]" 
                    onClick={() => setIsScanning(true)}
                    disabled={isScanning}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {isScanning ? 'Escaneando...' : 'Escanear Agora'}
                  </button>
                ) : (
                  <button className="btn-mobile btn-success-mobile py-2 text-[14px] sm:text-[16px]" onClick={() => { setView('dashboard'); setScanSuccess(false); }}>
                    Voltar ao Painel
                  </button>
                )}
                <button 
                  className="btn-mobile py-2 bg-white/10 text-white border border-white/20 active:bg-white/20 transition-colors text-[14px] sm:text-[16px]"
                  onClick={() => setView('manual_entry')}
                >
                  Digitar Código Manualmente
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'manual_entry' && (
          <motion.div 
            key="manual"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col bg-brand-gradient p-2.5 pt-5 sm:p-3.5 sm:pt-7 text-white overflow-x-hidden"
          >
            <button onClick={() => setView('qr_generator')} className="mb-3.5 text-white w-fit shrink-0"><ChevronLeft className="w-5 h-5" /></button>
            <div className="text-center space-y-2.5 sm:space-y-3.5 flex-1 flex flex-col justify-center">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-brand-secondary/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shrink-0">
                <QrCode className="w-5 h-5 sm:w-7 sm:h-7 text-brand-secondary" />
              </div>
              <div className="space-y-1 shrink-0">
                <h2 className="text-lg sm:text-xl font-bold">Código Manual</h2>
                <p className="text-white/60 text-[12px] sm:text-[15px]">Digite o código de 8 dígitos impresso na pulseira.</p>
              </div>

              <div className="space-y-1.5 shrink-0">
                <input 
                  type="text" 
                  maxLength={8}
                  placeholder="Ex: ABC12345"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  disabled={isScanning}
                  className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl py-2 sm:py-3.5 px-2.5 sm:px-3.5 text-center text-[17px] sm:text-[21px] font-black tracking-[0.2em] text-white placeholder:text-white/10 focus:outline-none focus:border-brand-secondary transition-colors disabled:opacity-50"
                />
                
                <button 
                  className="btn-mobile btn-primary-mobile py-2 sm:py-3 text-[14px] sm:text-[16px]"
                  disabled={manualCode.length < 8 || isScanning}
                  onClick={() => {
                    if (selectedChildId && manualCode.length >= 4) {
                      setChildren(prev => prev.map(c => c.id === selectedChildId ? { ...c, qrCode: manualCode } : c));
                      setIsScanning(true);
                      setTimeout(() => {
                        setIsScanning(false);
                        setScanSuccess(true);
                        setManualCode('');
                        setView('qr_generator');
                      }, 1500);
                    } else {
                      alert('Por favor, digite um código válido.');
                    }
                  }}
                >
                  {isScanning ? (
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Validando...
                    </div>
                  ) : 'Confirmar Código'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-brand-gradient text-white p-2.5 pt-5 sm:p-3.5 sm:pt-7 overflow-x-hidden"
          >
            <div className="flex items-center gap-2.5 mb-5 shrink-0">
              <button onClick={() => setView('dashboard')} className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-[17px] sm:text-[19px] font-bold">Configurações</h2>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto pb-5 scrollbar-hide">
              {/* Photo Edit */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <div className="w-17 h-17 sm:w-24 sm:h-24 rounded-full border-4 border-brand-secondary shadow-2xl overflow-hidden bg-white/10">
                    <img src={userProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute bottom-0 right-0 w-5 h-5 sm:w-7 sm:h-7 bg-brand-primary rounded-full flex items-center justify-center border-4 border-brand-dark cursor-pointer shadow-lg active:scale-90 transition-transform">
                    <Camera className="w-2 h-2 sm:w-3.5 sm:h-3.5 text-white" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setUserProfile(prev => ({ ...prev, photo: url }));
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-[9px] sm:text-[12px] font-bold text-white/40 uppercase tracking-widest">Toque para alterar foto</p>
              </div>

              {/* Form */}
              <div className="space-y-1.5">
                <div className="space-y-0.5">
                  <label className="text-[9px] sm:text-[12px] font-bold uppercase opacity-60 ml-1 tracking-widest">Nome Exibido</label>
                  <input 
                    type="text" 
                    value={userProfile.name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl py-1.5 sm:py-2.5 px-2.5 sm:px-4 text-[9.5px] sm:text-xs text-white focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] sm:text-[12px] font-bold uppercase opacity-60 ml-1 tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    value={userProfile.email}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl py-1.5 sm:py-2.5 px-2.5 sm:px-4 text-[9.5px] sm:text-xs text-white focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] sm:text-[12px] font-bold uppercase opacity-60 ml-1 tracking-widest">Telefone</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    value={userProfile.phone || ''}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl py-1.5 sm:py-2.5 px-2.5 sm:px-4 text-[9.5px] sm:text-xs text-white focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-1.5">
                <h4 className="text-[9px] sm:text-[12px] font-bold text-white/40 uppercase tracking-widest ml-1">Preferências</h4>
                <div className="space-y-1.25">
                  <div className="bg-white/5 p-1.5 rounded-lg sm:rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.25">
                      <Bell className="w-3 h-3 text-brand-secondary" />
                      <span className="font-bold text-[12px] sm:text-[14px]">Notificações Push</span>
                    </div>
                    <div className="w-6 h-3 sm:w-8.5 sm:h-4.5 bg-brand-icon-green rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-2 h-2 sm:w-3.5 sm:h-3.5 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="bg-white/5 p-1.5 rounded-lg sm:rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.25">
                      <MapPin className="w-3 h-3 text-brand-primary" />
                      <span className="font-bold text-[12px] sm:text-[14px]">Localização em Tempo Real</span>
                    </div>
                    <div className="w-6 h-3 sm:w-8.5 sm:h-4.5 bg-brand-icon-green rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-2 h-2 sm:w-3.5 sm:h-3.5 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 space-y-1.5 sm:space-y-2.5 shrink-0">
              <button 
                className="btn-mobile btn-primary-mobile shadow-xl py-2 sm:py-3 text-[14px] sm:text-[16px]"
                onClick={() => {
                  if (currentUser) {
                    const updatedUser = {
                      ...currentUser,
                      name: userProfile.name,
                      email: userProfile.email,
                      photo: userProfile.photo,
                      phone: userProfile.phone
                    };
                    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
                    setCurrentUser(updatedUser);
                    alert('Configurações salvas com sucesso!');
                    setView('dashboard');
                  }
                }}
              >
                Salvar Alterações
              </button>
              <button 
                className="w-[85%] mx-auto py-2 sm:py-2.5 text-brand-emergency font-black uppercase tracking-widest flex items-center justify-center gap-1.5 bg-white/5 rounded-lg sm:rounded-xl border border-white/10 active:bg-white/10 transition-colors text-[12px] sm:text-[14px]"
                onClick={() => {
                  setCurrentUser(null);
                  setRole(null);
                  setLoginForm({ email: '', password: '' });
                  setView('selection');
                }}
              >
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Sair da Conta
              </button>
              <button 
                className="w-[85%] mx-auto py-2.5 text-white/20 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-brand-emergency transition-colors"
                onClick={() => {
                  if (confirm('Isso apagará todos os seus dados, crianças cadastradas e usuários. Deseja continuar?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                Limpar Todos os Dados do App
              </button>
            </div>
          </motion.div>
        )}

        {view === 'notifications' && (
          <motion.div 
            key="notifications"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white p-2.5 pt-5 sm:p-3.5 sm:pt-8.5"
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 mb-2.5 sm:mb-5">
              <button onClick={() => setView('dashboard')} className="w-6 h-6 sm:w-7 sm:h-7 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <h2 className="text-[17px] sm:text-[19px] font-bold">Notificações</h2>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto pb-3.5 scrollbar-hide">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border flex gap-1.5 sm:gap-2.5 transition-all",
                      notif.read ? "bg-white/5 border-white/10 opacity-60" : "bg-white/10 border-white/20 shadow-lg",
                      notif.type === 'emergency' && !notif.read && "bg-brand-emergency/20 border-brand-emergency/40"
                    )}
                    onClick={() => {
                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                      if (notif.childId) {
                        setSelectedChildId(notif.childId);
                        setView(currentUser?.role === 'authority' ? 'occurrence_details' : 'child_details');
                      }
                    }}
                  >
                    <div className={cn(
                      "w-6 h-6 sm:w-8.5 sm:h-8.5 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                      notif.type === 'success' ? "bg-brand-icon-green/20" : 
                      notif.type === 'emergency' ? "bg-brand-emergency/20" :
                      notif.type === 'alert' ? "bg-brand-secondary/20" : "bg-brand-primary/20"
                    )}>
                      {notif.type === 'success' ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-brand-icon-green" /> :
                       notif.type === 'emergency' ? <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-brand-emergency" /> :
                       notif.type === 'alert' ? <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-brand-secondary" /> :
                       <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-brand-primary" />}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={cn("font-bold text-[12px] sm:text-[14px]", notif.type === 'emergency' && "text-brand-emergency")}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] sm:text-[11px] opacity-40">{notif.time}</span>
                      </div>
                      <p className="text-[11px] sm:text-[13px] text-white/70 leading-tight">
                        {notif.message}
                      </p>
                      {notif.childId && (
                        <button className="text-brand-secondary text-[9px] sm:text-[11px] font-black uppercase tracking-widest mt-1">
                          Ver Detalhes
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-30">
                  <Bell className="w-10 h-10 mb-2" />
                  <p className="text-lg font-bold">Nenhuma notificação.</p>
                </div>
              )}
            </div>
            
            {/* Bottom Nav inside notifications too for consistency */}
            <div className="glass-nav p-1 sm:p-2.5 flex justify-around items-center -mx-2.5 sm:-mx-3.5 -mb-2.5 sm:-mb-3.5 shrink-0">
              <button onClick={() => setView('dashboard')} className="text-white/40"><MapIcon className="w-3 h-3 sm:w-4 sm:h-4" /></button>
              <button onClick={() => setView('notifications')} className="relative text-white">
                <Bell className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-emergency rounded-full border-2 border-brand-dark" />
                )}
              </button>
              <button 
                onClick={() => setView('register_child')}
                className="w-8.5 h-8.5 sm:w-12 sm:h-12 bg-brand-primary rounded-full flex items-center justify-center -mt-7 sm:-mt-10 shadow-2xl border-4 border-brand-dark"
              >
                <Plus className="text-white w-4 h-4 sm:w-7 sm:h-7" />
              </button>
              <button className="text-white/40"><History className="w-3.5 h-3.5 sm:w-5 sm:h-5" /></button>
              <button onClick={() => setView('settings')} className="text-white/40"><UserIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" /></button>
            </div>
          </motion.div>
        )}

        {view === 'child_details' && selectedChildId && (
          <motion.div 
            key="child-details"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="h-full flex flex-col bg-brand-gradient text-white p-3 pt-6 sm:p-4 sm:pt-10 overflow-hidden"
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 mb-3.5 sm:mb-5 shrink-0">
              <button onClick={() => setView('dashboard')} className="w-6 h-6 sm:w-7 sm:h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <h2 className="text-base sm:text-lg font-bold">Perfil da Criança</h2>
            </div>

            {(() => {
              const child = children.find(c => c.id === selectedChildId);
              if (!child) return null;

              return (
                <>
                  <div className="flex-1 min-h-0 max-h-full space-y-4 overflow-y-auto pb-4 scrollbar-hide">
                    {/* Status Toggle */}
                    <div className={cn(
                      "p-2.5 rounded-2xl border flex items-center justify-between transition-colors",
                      child.status === 'safe' ? "bg-brand-icon-green/10 border-brand-icon-green/20" : "bg-brand-emergency/10 border-brand-emergency/20"
                    )}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-xl flex items-center justify-center shadow-lg",
                          child.status === 'safe' ? "bg-brand-icon-green" : "bg-brand-emergency"
                        )}>
                          {child.status === 'safe' ? <CheckCircle2 className="w-3 h-3 text-white" /> : <AlertTriangle className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold opacity-60 uppercase tracking-widest">Status Atual</p>
                          <h4 className="text-[16px] font-bold">{child.status === 'safe' ? 'Seguro' : 'Desaparecido'}</h4>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setChildren(prev => prev.map(c => c.id === child.id ? { ...c, status: c.status === 'safe' ? 'missing' : 'safe' } : c));
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[12px] font-black uppercase tracking-widest border transition-all active:scale-95",
                          child.status === 'safe' ? "bg-brand-emergency border-brand-emergency text-white" : "bg-brand-icon-green border-brand-icon-green text-white"
                        )}
                      >
                        Alterar para {child.status === 'safe' ? 'Desaparecido' : 'Seguro'}
                      </button>
                    </div>

                    {/* Profile Edit */}
                    <div className="space-y-2.5">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative">
                          <div className="w-17 h-17 rounded-2xl border-4 border-brand-secondary shadow-2xl overflow-hidden">
                            <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center border-4 border-brand-dark cursor-pointer shadow-lg active:scale-90 transition-transform">
                            <Camera className="w-3 h-3 text-white" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setChildren(prev => prev.map(c => c.id === child.id ? { ...c, photo: url } : c));
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Nome da Criança</label>
                          <input 
                            type="text" 
                            value={child.name}
                            onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, name: e.target.value } : c))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-2.5 text-[12px] text-white focus:outline-none focus:border-brand-secondary transition-colors"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Idade</label>
                          <input 
                            type="number" 
                            value={child.age}
                            onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, age: parseInt(e.target.value) || 0 } : c))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-2.5 text-[12px] text-white focus:outline-none focus:border-brand-secondary transition-colors"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Telefone do Responsável</label>
                          <input 
                            type="tel" 
                            value={child.responsiblePhone}
                            onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, responsiblePhone: e.target.value } : c))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-2.5 text-[12px] text-white focus:outline-none focus:border-brand-secondary transition-colors"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Sexo</label>
                          <div className="grid grid-cols-3 gap-1">
                            {['M', 'F', 'Outro'].map((g) => (
                              <button
                                key={g}
                                onClick={() => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, gender: g as any } : c))}
                                className={cn(
                                  "py-1 rounded-xl border font-bold text-[13px] transition-all",
                                  child.gender === g 
                                    ? "bg-brand-secondary border-brand-secondary text-brand-dark" 
                                    : "bg-white/5 border-white/10 text-white/60"
                                )}
                              >
                                {g === 'M' ? 'Masc.' : g === 'F' ? 'Fem.' : 'Outro'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Alergias</label>
                          <input 
                            type="text" 
                            value={child.allergies || ''}
                            onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, allergies: e.target.value } : c))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-2.5 text-[12px] text-white focus:outline-none focus:border-brand-secondary transition-colors"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Uso de Medicamentos</label>
                          <input 
                            type="text" 
                            value={child.medications || ''}
                            onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, medications: e.target.value } : c))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-2.5 text-[12px] text-white focus:outline-none focus:border-brand-secondary transition-colors"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Deficiência / Condição Especial</label>
                          <input 
                            type="text" 
                            value={child.disability || ''}
                            onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, disability: e.target.value } : c))}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-2.5 text-[12px] text-white focus:outline-none focus:border-brand-secondary transition-colors"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Descrição / Características</label>
                          <textarea 
                            value={child.description}
                            onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, description: e.target.value } : c))}
                            rows={2}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-2.5 text-[12px] text-white focus:outline-none focus:border-brand-secondary transition-colors resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="space-y-1.5">
                      <h4 className="text-[13px] font-bold text-white/40 uppercase tracking-widest ml-1">QR Code da Pulseira</h4>
                      {!child.qrCode ? (
                        <button 
                          onClick={() => {
                            setSelectedChildId(child.id);
                            setView('qr_generator');
                            setScanSuccess(false);
                            setIsScanning(false);
                          }}
                          className="w-full py-3.5 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center gap-1.5 active:bg-white/10 transition-all"
                        >
                          <div className="w-7 h-7 bg-brand-secondary/20 rounded-xl flex items-center justify-center">
                            <QrCode className="w-3.5 h-3.5 text-brand-secondary" />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-[16px]">Vincular Pulseira</p>
                            <p className="text-[11px] opacity-40 uppercase tracking-widest">Nenhum código registrado ainda</p>
                          </div>
                        </button>
                      ) : (
                        <div className="bg-white p-2.5 rounded-2xl flex flex-col items-center gap-1.5 shadow-2xl">
                          <div className="p-1 bg-slate-50 rounded-xl border border-slate-100">
                            <QRCode value={child.qrCode} size={85} />
                          </div>
                          <div className="text-center">
                            <p className="text-slate-900 font-black tracking-widest text-[16px] uppercase">ID: {child.qrCode.toUpperCase()}</p>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Válido em todo território nacional</p>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedChildId(child.id);
                              setView('qr_generator');
                              setScanSuccess(false);
                              setIsScanning(false);
                            }}
                            className="w-full py-1 sm:py-2 bg-brand-primary/10 text-brand-primary rounded-xl sm:rounded-2xl font-bold text-[13px] sm:text-[16px] uppercase tracking-widest border border-brand-primary/20 flex items-center justify-center gap-1.25"
                          >
                            <Camera className="w-3 h-3" />
                            Vincular Nova Pulseira
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 pb-10 shrink-0 space-y-1.5 sm:space-y-3.5">
                    <button 
                      className="btn-mobile btn-primary-mobile shadow-xl py-2 sm:py-3.5 text-[12px] sm:text-base"
                      onClick={() => setView('dashboard')}
                    >
                      Salvar Alterações
                    </button>
                    <button 
                      className="w-[85%] mx-auto py-1.5 sm:py-2.5 text-brand-emergency font-black uppercase tracking-widest flex items-center justify-center gap-1.25 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 active:bg-white/10 transition-colors text-[15px] sm:text-[17px]"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja remover ${child.name}?`)) {
                          setChildren(prev => prev.filter(c => c.id !== child.id));
                          setView('dashboard');
                        }
                      }}
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      Remover Criança
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {view === 'register_child' && (
          <motion.div 
            key="reg-child"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="h-full flex flex-col bg-brand-gradient text-white p-2.5 pt-5 sm:p-3.5 sm:pt-8.5 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 mb-3.5 sm:mb-7 shrink-0">
              <button onClick={() => setView('dashboard')} className="w-7 h-7 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base sm:text-lg font-bold">Cadastrar Criança</h2>
            </div>

            <div className="flex-1 min-h-0 max-h-full space-y-3 overflow-y-auto pb-6 scrollbar-hide">
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-24 sm:h-24 rounded-[18px] sm:rounded-[28px] border-4 border-brand-secondary shadow-2xl overflow-hidden bg-white/10 flex items-center justify-center">
                    {newChild.photo ? (
                      <img src={newChild.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-6 h-6 sm:w-9 sm:h-9 text-white/20" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-5.5 h-5.5 sm:w-8 sm:h-8 bg-brand-primary rounded-full flex items-center justify-center border-4 border-brand-dark cursor-pointer shadow-lg active:scale-90 transition-transform">
                    <Camera className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setNewChild(prev => ({ ...prev, photo: url }));
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-[12px] font-bold text-white/40 uppercase tracking-widest">Foto da Criança</p>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Nome da Criança</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Maria Clara"
                    value={newChild.name}
                    onChange={(e) => setNewChild(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors text-[12px] sm:text-base"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Idade</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 5"
                    value={newChild.age}
                    onChange={(e) => setNewChild(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors text-[12px] sm:text-base"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Telefone do Responsável</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    value={newChild.responsiblePhone}
                    onChange={(e) => setNewChild(prev => ({ ...prev, responsiblePhone: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors text-[12px] sm:text-base"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Sexo</label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                    {['M', 'F', 'Outro'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setNewChild(prev => ({ ...prev, gender: g as any }))}
                        className={cn(
                          "py-1.5 sm:py-2.5 rounded-xl border font-bold text-[15px] sm:text-[17px] transition-all",
                          newChild.gender === g 
                            ? "bg-brand-secondary border-brand-secondary text-brand-dark" 
                            : "bg-white/5 border-white/10 text-white/60"
                        )}
                      >
                        {g === 'M' ? 'Masc.' : g === 'F' ? 'Fem.' : 'Outro'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Alergias</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Amendoim, lactose..."
                    value={newChild.allergies}
                    onChange={(e) => setNewChild(prev => ({ ...prev, allergies: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors text-[12px] sm:text-base"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Uso de Medicamentos</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Insulina, antialérgico..."
                    value={newChild.medications}
                    onChange={(e) => setNewChild(prev => ({ ...prev, medications: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors text-[12px] sm:text-base"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Deficiência / Condição Especial</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Autismo, cadeirante..."
                    value={newChild.disability}
                    onChange={(e) => setNewChild(prev => ({ ...prev, disability: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors text-[12px] sm:text-base"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest">Descrição / Características</label>
                  <textarea 
                    placeholder="Ex: Cabelo castanho, camiseta rosa..."
                    rows={2}
                    value={newChild.description}
                    onChange={(e) => setNewChild(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors resize-none text-[12px] sm:text-base"
                  />
                </div>

                <div className="space-y-2.5 pt-1.5">
                  <h4 className="text-[13px] font-bold text-white/40 uppercase tracking-widest ml-1">Pulseira da Criança</h4>
                  {!newChild.qrCode ? (
                    <div className="space-y-2.5">
                      <button 
                        onClick={() => {
                          setSelectedChildId('TEMP_REG'); 
                          setView('qr_generator');
                          setScanSuccess(false);
                          setIsScanning(false);
                        }}
                        className="w-full py-2.5 sm:py-4 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl sm:rounded-[32px] flex flex-col items-center gap-1.5 active:bg-white/10 transition-all"
                      >
                        <div className="w-7 h-7 sm:w-10 sm:h-10 bg-brand-secondary/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                          <QrCode className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-brand-secondary" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-[14px] sm:text-[16px]">Vincular Pulseira Agora</p>
                          <p className="text-[11px] sm:text-[13px] opacity-40 uppercase tracking-widest">Escaneie o QR Code oficial</p>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-brand-icon-green/10 border border-brand-icon-green/20 p-2.5 sm:p-5 rounded-2xl sm:rounded-[32px] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-3.5">
                        <div className="w-7 h-7 sm:w-10 sm:h-10 bg-brand-icon-green rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] sm:text-[15px] font-bold text-brand-icon-green uppercase tracking-widest truncate">Pulseira Vinculada</p>
                          <p className="font-bold text-white tracking-widest truncate text-[16px] sm:text-[19px]">{newChild.qrCode.toUpperCase()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setNewChild(prev => ({ ...prev, qrCode: '' }))}
                        className="p-1 bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 pb-10 shrink-0">
              <button 
                className="btn-mobile btn-primary-mobile shadow-xl py-3 sm:py-4 text-[14px] sm:text-base"
                disabled={!newChild.name || !newChild.age || !newChild.responsiblePhone}
                onClick={() => {
                  const child: Child = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: newChild.name,
                    age: parseInt(newChild.age),
                    gender: newChild.gender as any,
                    allergies: newChild.allergies,
                    medications: newChild.medications,
                    disability: newChild.disability,
                    responsibleName: userProfile.name,
                    responsiblePhone: newChild.responsiblePhone,
                    responsibleId: currentUser?.id,
                    status: 'safe',
                    description: newChild.description,
                    photo: newChild.photo,
                    qrCode: newChild.qrCode
                  };
                  setChildren(prev => [...prev, child]);
                  setNewChild({ 
                    name: '', 
                    age: '', 
                    gender: '', 
                    allergies: '', 
                    medications: '', 
                    disability: '', 
                    description: '', 
                    photo: 'https://picsum.photos/seed/newchild/200',
                    qrCode: '',
                    responsiblePhone: ''
                  });
                  setView('dashboard');
                }}
              >
                Salvar Cadastro
              </button>
            </div>
          </motion.div>
        )}

        {view === 'emergency' && (
          <motion.div 
            key="emergency"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "flex-1 flex flex-col p-3.5 sm:p-7 pt-14 sm:pt-17 text-white",
              emergencyStep === 'select' ? "bg-brand-gradient" : "bg-brand-emergency"
            )}
          >
            <button onClick={() => setView('dashboard')} className="text-white mb-3.5 sm:mb-7"><ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" /></button>
            
            {emergencyStep === 'select' ? (
              <div className="flex-1 flex flex-col gap-3.5 sm:gap-7">
                <div className="text-center space-y-1 sm:space-y-1.5">
                  <div className="w-14 h-14 sm:w-17 sm:h-17 bg-brand-emergency/20 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-3.5">
                    <AlertTriangle className="w-7 h-7 sm:w-8.5 sm:h-8.5 text-brand-emergency" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase">Qual Criança?</h2>
                  <p className="text-sm sm:text-base text-white/60">Selecione quem está desaparecido para acionar o alerta.</p>
                </div>

                <div className="space-y-2.5 sm:space-y-3.5">
                  {children.filter(c => c.responsibleId === currentUser?.id).map(child => (
                    <button 
                      key={child.id}
                      onClick={() => {
                        setEmergencyChildId(child.id);
                        setEmergencyStep('alert');
                        setChildren(prev => {
                          const updated = prev.map(c => c.id === child.id ? { ...c, status: 'missing' } : c);
                          localStorage.setItem('achei_voce_children', JSON.stringify(updated));
                          return updated;
                        });
                        
                        // Trigger notification for authorities
                        triggerNotification({
                          title: 'NOVO ALERTA DE EMERGÊNCIA!',
                          message: `A criança ${child.name} foi marcada como desaparecida. Verifique os detalhes na aba de alertas.`,
                          type: 'emergency',
                          childId: child.id
                        });
                      }}
                      className="w-[85%] mx-auto bg-white/10 p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-white/20 flex items-center gap-2.5 sm:gap-3.5 text-left active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/20">
                        <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl font-bold">{child.name}</h4>
                        <p className="text-[15px] sm:text-[16px] opacity-60 uppercase tracking-widest">{child.age} anos</p>
                      </div>
                      <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 bg-brand-emergency rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setView('dashboard')}
                  className="mt-auto w-[85%] mx-auto py-1.5 sm:py-2.5 text-white/60 font-bold uppercase tracking-widest text-[16px] sm:text-[17px]"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 sm:gap-7">
                <div className="w-20 h-20 sm:w-27 sm:h-27 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-10 h-10 sm:w-14 sm:h-14" />
                </div>
                <div className="space-y-1 sm:space-y-1.5">
                  <h2 className="text-3xl sm:text-4xl font-black uppercase">Alerta Ativado</h2>
                  <p className="text-sm sm:text-base text-red-100">
                    As autoridades e pontos de apoio próximos foram notificados sobre o desaparecimento de <span className="font-black underline">{children.find(c => c.id === emergencyChildId)?.name}</span>.
                  </p>
                </div>
                
                <div className="w-full space-y-2.5 sm:space-y-3.5 mt-3.5 sm:mb-7">
                  <div className="bg-white/10 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/20">
                    <p className="text-[15px] sm:text-[17px] font-bold uppercase tracking-widest opacity-60">Status da Busca</p>
                    <p className="text-lg sm:text-xl font-bold mt-1">Guarda Municipal Acionada</p>
                    <p className="text-[16px] sm:text-[17px] opacity-80">Viatura a caminho da sua localização.</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (emergencyChildId) {
                        setChildren(prev => prev.map(c => c.id === emergencyChildId ? { ...c, status: 'safe' } : c));
                      }
                      setView('dashboard');
                    }}
                    className="btn-mobile bg-white text-brand-emergency font-black text-sm sm:text-base"
                  >
                    CANCELAR ALERTA
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionCard({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-[85%] mx-auto bg-white/10 p-2 rounded-2xl border border-white/20 card-shadow flex items-center justify-between group active:bg-white/20 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-white/10 rounded-xl flex items-center justify-center text-lg shadow-inner">
          {icon}
        </div>
        <span className="font-bold text-white tracking-wide text-[13px]">{title}</span>
      </div>
      <Plus className="w-3 h-3 text-white/40 group-hover:text-brand-secondary transition-colors" />
    </button>
  );
}
