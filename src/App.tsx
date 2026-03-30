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
  LogOut
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Html5Qrcode } from 'html5-qrcode';
import { cn } from './utils';
import { Child, UserRole, SupportPoint, User } from './types';

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
  const [view, setView] = useState<'selection' | 'splash' | 'dashboard' | 'location' | 'qr_generator' | 'emergency' | 'register' | 'login' | 'settings' | 'manual_entry' | 'register_child' | 'child_details' | 'notifications' | 'authority_reports' | 'authority_alerts' | 'occurrence_details' | 'citizen_scan'>(() => {
    return 'selection';
  });
  const [scannedChild, setScannedChild] = useState<Child | null>(null);
  const [citizenLocation, setCitizenLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
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
    qrCode: ''
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
            className="flex-1 bg-brand-gradient flex flex-col p-5 pt-10"
          >
            <div className="absolute top-10 right-5 z-10">
              <button className="relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md shadow-lg active:scale-95 transition-all">
                <Bell className="w-5 h-5 text-brand-secondary fill-brand-secondary/20" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-emergency rounded-full border-2 border-brand-dark" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-0.5 mb-3">
              <h1 className="text-2xl text-white font-black tracking-tighter">
                ACHEI <span className="text-brand-secondary">VOCÊ</span>
              </h1>
              <p className="text-blue-100 text-[8px] font-bold tracking-[0.2em] uppercase opacity-70">Segurança infantil e familiar</p>
            </div>

            <div className="text-center mb-3">
              <h2 className="text-base text-white font-bold">Quem você quer proteger hoje?</h2>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pb-2">
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
                className="relative overflow-hidden rounded-[20px] p-3.5 cursor-pointer group shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-white/10"
                style={{ background: 'linear-gradient(145deg, #2A9D5C 0%, #146B3A 100%)' }}
              >
                <div className="absolute top-2 right-3 bg-white/15 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                  <Shield className="w-2 h-2 text-white" />
                  <span className="text-[7px] text-white font-bold uppercase tracking-wider">Prioridade</span>
                </div>
                
                <div className="flex flex-col items-center text-center gap-1">
                  <div className="w-20 h-20 relative">
                    <img 
                      src="https://i.postimg.cc/8ThNw3rh/teste.png" 
                      alt="Crianças" 
                      className="w-full h-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)] brightness-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0">
                    <h3 className="text-lg text-white font-black tracking-tight uppercase">CRIANÇAS</h3>
                    <p className="text-white/80 text-[8px] font-medium leading-tight max-w-[150px] mx-auto">
                      Localização rápida com pulseira QR Code
                    </p>
                  </div>
                  <button className="mt-1 bg-white text-[#187A44] hover:bg-white/90 px-4 py-1 rounded-full font-extrabold text-[10px] flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all">
                    Acessar Crianças <ChevronLeft className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </motion.div>

              {/* Pets Card */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => alert('Em breve: Funcionalidade de Pets em desenvolvimento!')}
                className="relative overflow-hidden rounded-[20px] p-3.5 cursor-pointer group shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-white/10"
                style={{ background: 'linear-gradient(145deg, #F5C518 0%, #C99300 100%)' }}
              >
                <div className="flex flex-col items-center text-center gap-1">
                  <div className="w-20 h-20 relative">
                    <img 
                      src="https://picsum.photos/seed/pets_safety/400/400" 
                      alt="Pets" 
                      className="w-full h-full object-cover rounded-xl drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0">
                    <h3 className="text-lg text-brand-dark font-black tracking-tight uppercase">PETS</h3>
                    <p className="text-brand-dark/70 text-[8px] font-medium leading-tight max-w-[150px] mx-auto">
                      Encontre seu pet com identificação segura
                    </p>
                  </div>
                  <button className="mt-1 bg-brand-dark text-white hover:bg-brand-dark/90 px-4 py-1 rounded-full font-extrabold text-[10px] flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all">
                    Acessar Pets
                  </button>
                </div>
              </motion.div>
            </div>

            <div className="mt-auto pt-2 text-center space-y-3">
              <p className="text-white/50 text-[9px] font-bold">Cada segundo importa. Comece agora.</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <p className="text-white/30 text-[7px] uppercase font-bold tracking-[0.4em]">Parceria</p>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/5 flex items-center justify-center gap-2 shadow-lg max-w-[200px] mx-auto">
                  <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center p-0.5">
                    <Building2 className="w-full h-full text-brand-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-black text-[9px] leading-none">Prefeitura de Mendes/RJ</p>
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
            className="flex-1 bg-brand-gradient flex flex-col p-6 pt-10"
          >
            <div className="absolute top-10 left-5 z-10">
              <button 
                onClick={() => setView('selection')}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md shadow-lg active:scale-95 transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="absolute top-10 right-5 z-10">
              <button className="relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md shadow-lg active:scale-95 transition-all">
                <Bell className="w-5 h-5 text-brand-secondary fill-brand-secondary/20" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-emergency rounded-full border-2 border-brand-dark" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-1.5 mb-4">
              <div className="w-60 h-60 bg-transparent flex items-center justify-center overflow-hidden relative logo-glow">
                <img 
                  src="https://i.postimg.cc/8ThNw3rh/teste.png" 
                  alt="Achei Você Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center space-y-0.5">
                <h1 className="text-4xl text-white font-black tracking-tighter">
                  ACHEI <span className="text-brand-secondary">VOCÊ</span>
                </h1>
                <p className="text-blue-100 text-xs font-bold tracking-[0.2em] uppercase opacity-80">Segurança Infantil</p>
              </div>
              <div className="bg-brand-icon-green text-white px-5 py-2 rounded-full text-xs font-black flex items-center gap-2 mt-1 shadow-[0_0_20px_rgba(24,165,88,0.4)] border border-white/20 animate-pulse-subtle">
                <CheckCircle2 className="w-4 h-4" /> Localização Rápida de Crianças
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <button 
                className="btn-mobile btn-emergency py-4 text-lg animate-emergency"
                onClick={() => { setRole('citizen'); setView('citizen_scan'); }}
              >
                <Search className="w-5 h-5" />
                ENCONTROU UMA CRIANÇA?
              </button>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button 
                  className="btn-mobile btn-primary-mobile"
                  onClick={() => { setRegRole('responsible'); setView('login'); }}
                >
                  <UserIcon className="w-5 h-5" />
                  Sou Responsável
                </button>
                <button 
                  className="btn-mobile btn-success-mobile"
                  onClick={() => { setRegRole('authority'); setRegSubRole('guard'); setView('login'); }}
                >
                  <Shield className="w-5 h-5" />
                  Prefeitura / Guarda
                </button>
                <button 
                  className="btn-mobile btn-secondary-mobile"
                  onClick={() => { setRegRole('authority'); setRegSubRole('authority'); setView('login'); }}
                >
                  <Siren className="w-5 h-5" />
                  Autoridades
                </button>
              </div>
            </div>

            <div className="mt-auto text-center space-y-6">
              <div className="space-y-3">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em]">Patrocinadores</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3 min-w-[200px] shadow-xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
                      <Building2 className="w-full h-full text-brand-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-white/40 font-bold uppercase leading-none mb-1">Apoio</p>
                      <p className="text-white font-black text-xs leading-none">Prefeitura de Mendes/RJ</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-1 text-brand-secondary pt-2">
                {[1,2,3,4,5].map(i => <Heart key={i} className="w-3 h-3 fill-current" />)}
                <span className="text-white text-[10px] font-bold ml-1">4.9</span>
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
            className="flex-1 flex flex-col bg-brand-gradient text-white p-5 pt-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setView('splash')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">
                {regRole === 'responsible' ? 'Cadastro Responsável' : 
                 regSubRole === 'guard' ? 'Cadastro Prefeitura / Guarda' : 'Cadastro Autoridades'}
              </h2>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pb-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">
                  {regRole === 'responsible' ? 'Nome Completo' : 
                   regSubRole === 'guard' ? 'Nome da Instituição' : 'Instituição'}
                </label>
                <input 
                  type="text" 
                  value={regForm.name}
                  onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                  placeholder={regRole === 'responsible' ? "Digite seu nome" : "Ex: Guarda Municipal / Polícia"}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                />
              </div>

              {regRole === 'responsible' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">CPF</label>
                  <input 
                    type="text" 
                    value={regForm.cpf}
                    onChange={(e) => setRegForm({...regForm, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">
                    {regSubRole === 'guard' ? 'CNPJ' : 'Departamento'}
                  </label>
                  <input 
                    type="text" 
                    value={regForm.registrationId}
                    onChange={(e) => setRegForm({...regForm, registrationId: e.target.value})}
                    placeholder={regSubRole === 'guard' ? "00.000.000/0000-00" : "Ex: Divisão de Busca"}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">
                  {regRole === 'responsible' ? 'Celular' : 'Nome do Responsável / Agente'}
                </label>
                <input 
                  type="text" 
                  value={regForm.phone}
                  onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                  placeholder={regRole === 'responsible' ? "(00) 00000-0000" : "Digite o nome completo"}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                />
              </div>

              {regRole !== 'responsible' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Matrícula / ID Funcional</label>
                  <input 
                    type="text" 
                    value={regForm.registrationId}
                    onChange={(e) => setRegForm({...regForm, registrationId: e.target.value})}
                    placeholder="Digite seu ID"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  value={regForm.email}
                  onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                  placeholder="seu@email.com"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Senha</label>
                <input 
                  type="password" 
                  value={regForm.password}
                  onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                />
              </div>

              <div className="pt-2 space-y-3">
                <button 
                  className={cn(
                    "btn-mobile shadow-xl py-4",
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
                  className="w-full py-2 text-sm font-bold text-white/60 hover:text-white transition-colors"
                  onClick={() => setView('login')}
                >
                  Já tem uma conta? <span className="text-brand-secondary">Entrar</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div 
            key="login"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white p-5 pt-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setView('splash')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">
                {regRole === 'responsible' ? 'Login Responsável' : 
                 regSubRole === 'guard' ? 'Login Prefeitura / Guarda' : 'Login Autoridades'}
              </h2>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  placeholder="seu@email.com"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold uppercase opacity-60 tracking-widest">Senha</label>
                  <button className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider">Esqueceu?</button>
                </div>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-secondary transition-colors"
                />
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  className={cn(
                    "btn-mobile shadow-xl py-4",
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
                  className="w-full py-2 text-sm font-bold text-white/60 hover:text-white transition-colors"
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
            className="flex-1 flex flex-col bg-brand-gradient text-white"
          >
            {/* Header */}
            <div className="p-5 pt-10 flex justify-between items-center bg-transparent border-b border-white/10">
              <button onClick={() => setView('splash')} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group active:scale-95 transition-all overflow-hidden">
                <img 
                  src="https://i.postimg.cc/8ThNw3rh/teste.png" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>
              <h2 className="text-lg font-bold">Dashboard</h2>
              <div className="flex items-center gap-2">
                <button className="relative">
                  <Bell className="w-6 h-6 text-brand-secondary fill-brand-secondary/20" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-emergency rounded-full border-2 border-brand-dark" />
                </button>
                <button onClick={() => setView('settings')}><Settings className="w-6 h-6 text-white/60" /></button>
              </div>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              {/* Profile Card */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg overflow-hidden relative group">
                  <img src={userProfile.photo} alt={userProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => setView('settings')}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div>
                  <h3 className="text-2xl text-white">{userProfile.name}</h3>
                  <p className="text-white/60 text-xs">{role === 'responsible' ? 'Responsável' : 'Autoridade'}</p>
                </div>
              </div>

              {/* Children List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest ml-1">Minhas Crianças</h4>
                {children.filter(child => child.responsibleId === currentUser?.id).map((child) => (
                  <button 
                    key={child.id} 
                    onClick={() => { setSelectedChildId(child.id); setView('child_details'); }}
                    className="w-full bg-white/5 p-4 rounded-3xl border border-white/10 card-shadow flex items-center gap-4 text-left active:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20">
                      <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{child.name}</h4>
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] font-bold",
                        child.status === 'safe' ? "text-brand-icon-green" : "text-brand-emergency"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          child.status === 'safe' ? "bg-brand-icon-green animate-pulse" : "bg-brand-emergency animate-pulse"
                        )} />
                        {child.status === 'safe' ? 'Seguro • Pulseira Ativa' : 'DESAPARECIDO'}
                      </div>
                    </div>
                    <div className="p-2 bg-white/10 rounded-lg"><ChevronLeft className="w-4 h-4 rotate-180" /></div>
                  </button>
                ))}
                {children.filter(child => child.responsibleId === currentUser?.id).length === 0 && (
                  <div className="py-10 text-center space-y-3 opacity-30">
                    <Plus className="w-12 h-12 mx-auto" />
                    <p className="text-sm font-bold">Nenhuma criança cadastrada.</p>
                  </div>
                )}
              </div>

              {/* QR & Summary Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="qr-container card-shadow" onClick={() => {
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
                  <p className="text-xs font-bold text-white/60">Vincular Pulseira</p>
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Camera className="w-12 h-12 text-brand-secondary" />
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-3xl border border-white/10 card-shadow flex flex-col items-center gap-2">
                  <p className="text-xs font-bold text-white/60">Total de Crianças</p>
                  <div className="text-4xl font-black text-brand-primary">
                    {children.filter(child => child.responsibleId === currentUser?.id).length}
                  </div>
                </div>
              </div>

              {/* Emergency Button */}
              <button 
                className="btn-mobile btn-emergency py-8 flex-col gap-1 shadow-2xl shadow-red-900/20"
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
                <AlertTriangle className="w-10 h-10" />
                <span className="text-xl">Botão de Emergência</span>
              </button>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-white/5 p-4 rounded-3xl border border-white/10 card-shadow flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-full"><History className="w-5 h-5 text-white/60" /></div>
                  <span className="text-sm font-bold">Histórico</span>
                </button>
                <button className="bg-white/5 p-4 rounded-3xl border border-white/10 card-shadow flex items-center gap-3" onClick={() => setView('settings')}>
                  <div className="p-2 bg-brand-success/20 rounded-full"><Settings className="w-5 h-5 text-brand-success" /></div>
                  <span className="text-sm font-bold">Configurações</span>
                </button>
              </div>

              {/* Bottom Sections from Image */}
              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Para Responsáveis</h4>
                <div className="space-y-3">
                  <ActionCard 
                    icon={<UserIcon className="text-brand-secondary" />} 
                    title="Cadastrar Criança" 
                    onClick={() => setView('register_child')}
                  />
                  <ActionCard 
                    icon={<QrCode className="text-brand-icon-green" />} 
                    title="Vincular QR Code" 
                    onClick={() => setView('qr_generator')}
                  />
                  <ActionCard 
                    icon={<MapIcon className="text-brand-primary" />} 
                    title="Modo Evento" 
                    onClick={() => {}}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="glass-nav p-4 flex justify-around items-center">
              <button onClick={() => setView('dashboard')} className={cn(view === 'dashboard' ? "text-white" : "text-white/40")}><MapIcon className="w-6 h-6" /></button>
              <button onClick={() => setView('notifications')} className={cn(view === 'notifications' ? "text-white" : "text-white/40")}><Bell className="w-6 h-6" /></button>
              <button 
                onClick={() => setView('register_child')}
                className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center -mt-12 shadow-2xl border-4 border-brand-dark active:scale-90 transition-transform"
              >
                <Plus className="text-white w-8 h-8" />
              </button>
              <button className="text-white/40"><History className="w-6 h-6" /></button>
              <button onClick={() => setView('settings')} className={cn(view === 'settings' ? "text-white" : "text-white/40")}><UserIcon className="w-6 h-6" /></button>
            </div>
          </motion.div>
        )}

        {view === 'dashboard' && role === 'authority' && (
          <motion.div 
            key="auth-dash"
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white"
          >
            {/* Header */}
            <div className="p-5 pt-10 flex justify-between items-center bg-transparent border-b border-white/10">
              <button onClick={() => setView('splash')} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group active:scale-95 transition-all overflow-hidden">
                <img 
                  src="https://i.postimg.cc/8ThNw3rh/teste.png" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>
              <h2 className="text-lg font-bold">Painel Autoridade</h2>
              <div className="flex items-center gap-2">
                <button className="relative">
                  <Bell className="w-6 h-6 text-brand-secondary fill-brand-secondary/20" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-emergency rounded-full border-2 border-brand-dark" />
                </button>
                <button onClick={() => setView('settings')}><Settings className="w-6 h-6 text-white/60" /></button>
              </div>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              <button 
                onClick={() => setIsAuthorityOnline(!isAuthorityOnline)}
                className={cn(
                  "w-full p-6 rounded-[32px] shadow-xl flex items-center justify-between transition-all active:scale-95",
                  isAuthorityOnline ? "bg-brand-primary" : "bg-white/10 border border-white/20"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    isAuthorityOnline ? "bg-white/20" : "bg-white/5"
                  )}>
                    <Shield className={cn("w-8 h-8", isAuthorityOnline ? "text-white" : "text-white/40")} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">Guarda Municipal</h3>
                    <p className={cn("text-sm", isAuthorityOnline ? "text-blue-200" : "text-white/40")}>
                      Unidade Centro • {isAuthorityOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full relative transition-colors",
                  isAuthorityOnline ? "bg-brand-icon-green" : "bg-white/20"
                )}>
                  <motion.div 
                    animate={{ x: isAuthorityOnline ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </div>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setView('authority_alerts')}
                  className="bg-white/5 p-6 rounded-[32px] border border-white/10 card-shadow flex flex-col items-center gap-3 text-center active:bg-white/10 transition-all"
                >
                  <div className="w-12 h-12 bg-red-100/20 text-brand-emergency rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-white/80">Alertas</span>
                </button>
                <button className="bg-white/5 p-6 rounded-[32px] border border-white/10 card-shadow flex flex-col items-center gap-3 text-center active:bg-white/10 transition-all">
                  <div className="w-12 h-12 bg-blue-100/20 text-brand-primary rounded-2xl flex items-center justify-center">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-white/80">Mapa</span>
                </button>
                <button className="bg-white/5 p-6 rounded-[32px] border border-white/10 card-shadow flex flex-col items-center gap-3 text-center active:bg-white/10 transition-all">
                  <div className="w-12 h-12 bg-orange-100/20 text-brand-secondary rounded-2xl flex items-center justify-center">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-white/80">Atendimentos</span>
                </button>
                <button 
                  onClick={() => setView('authority_reports')}
                  className="bg-white/5 p-6 rounded-[32px] border border-white/10 card-shadow flex flex-col items-center gap-3 text-center active:bg-white/10 transition-all"
                >
                  <div className="w-12 h-12 bg-white/10 text-white/60 rounded-2xl flex items-center justify-center">
                    <History className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-white/80">Relatórios</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Ocorrências Ativas</h4>
                  <span className="px-2 py-0.5 bg-brand-emergency/20 text-brand-emergency text-[10px] font-black rounded-full">
                    {children.filter(c => c.status === 'missing').length} ATIVAS
                  </span>
                </div>
                
                <div className="space-y-3">
                  {children.filter(c => c.status === 'missing').map(child => (
                    <button 
                      key={child.id}
                      onClick={() => { setSelectedChildId(child.id); setView('occurrence_details'); }}
                      className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 card-shadow border-l-4 border-red-500 flex items-center gap-4 text-left active:bg-white/10 transition-all"
                    >
                      <div className="w-12 h-12 bg-white/10 rounded-xl overflow-hidden">
                        <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">{child.name}, {child.age} anos</p>
                        <p className="text-xs text-white/40">Desaparecido há 15 min</p>
                      </div>
                      <div className="p-2 bg-brand-primary text-white rounded-lg"><Navigation className="w-4 h-4" /></div>
                    </button>
                  ))}
                  {children.filter(c => c.status === 'missing').length === 0 && (
                    <div className="py-8 text-center space-y-2 opacity-40">
                      <CheckCircle2 className="w-12 h-12 mx-auto" />
                      <p className="text-sm font-bold">Nenhuma ocorrência ativa no momento.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="glass-nav p-4 flex justify-around items-center">
              <button className="text-white"><Shield className="w-6 h-6" /></button>
              <button className="text-white/40"><Bell className="w-6 h-6" /></button>
              <div className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center -mt-12 shadow-2xl border-4 border-brand-dark">
                <Plus className="text-white w-8 h-8" />
              </div>
              <button className="text-white/40"><History className="w-6 h-6" /></button>
              <button className="text-white/40"><UserIcon className="w-6 h-6" /></button>
            </div>
          </motion.div>
        )}

        {view === 'authority_reports' && (
          <motion.div 
            key="auth-reports"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white p-6 pt-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Relatórios e Comunicados</h2>
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="p-2 bg-brand-secondary/20 rounded-lg"><History className="w-5 h-5 text-brand-secondary" /></div>
                  <div>
                    <h4 className="font-bold">Bloco de Notas Compartilhado</h4>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">Atualizado em tempo real</p>
                  </div>
                </div>
                <textarea 
                  value={authorityNotes}
                  onChange={(e) => setAuthorityNotes(e.target.value)}
                  placeholder="Digite aqui comunicados importantes para outros agentes..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none text-sm leading-relaxed"
                />
              </div>
              
              <div className="bg-brand-primary/10 p-4 rounded-2xl border border-brand-primary/20 flex items-start gap-3">
                <Shield className="w-5 h-5 text-brand-primary shrink-0 mt-1" />
                <p className="text-xs text-blue-100 leading-relaxed">
                  Este bloco de notas é visível para todos os agentes da Unidade Centro. Use para informações táticas e avisos rápidos.
                </p>
              </div>

              <button 
                onClick={() => setView('dashboard')}
                className="btn-mobile btn-primary-mobile py-5 shadow-xl"
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
            className="flex-1 flex flex-col bg-brand-gradient text-white p-6 pt-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Alertas de Emergência</h2>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pb-8">
              {children.filter(c => c.status === 'missing').map(child => (
                <div key={child.id} className="bg-brand-emergency/10 p-6 rounded-[32px] border border-brand-emergency/30 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-emergency rounded-2xl flex items-center justify-center animate-pulse">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tighter">ALERTA ATIVO</h4>
                      <p className="text-xs opacity-60">Acionado há 15 min</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/20">
                      <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h5 className="font-bold">{child.name}</h5>
                      <p className="text-xs opacity-60">{child.age} anos • {child.description?.substring(0, 30)}...</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { setSelectedChildId(child.id); setView('occurrence_details'); }}
                      className="py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10"
                    >
                      Ver Detalhes
                    </button>
                    <button className="py-3 bg-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest">
                      Traçar Rota
                    </button>
                  </div>
                </div>
              ))}
              {children.filter(c => c.status === 'missing').length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-30">
                  <Shield className="w-20 h-20 mb-4" />
                  <p className="text-lg font-bold">Nenhum alerta de emergência ativo.</p>
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
            className="flex-1 flex flex-col bg-brand-gradient text-white p-6 pt-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Detalhes da Ocorrência</h2>
            </div>

            {(() => {
              const child = children.find(c => c.id === selectedChildId);
              if (!child) return null;

              return (
                <div className="flex-1 space-y-6 overflow-y-auto pb-8">
                  <div className="bg-white/5 p-6 rounded-[40px] border border-white/10 space-y-6">
                    <div className="aspect-square w-full rounded-[32px] overflow-hidden border-4 border-brand-emergency shadow-2xl">
                      <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="text-center space-y-1">
                      <h3 className="text-3xl font-black">{child.name}</h3>
                      <p className="text-brand-emergency font-bold uppercase tracking-[0.2em] text-xs">Desaparecido</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Idade</p>
                        <p className="text-lg font-bold">{child.age} anos</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Sexo</p>
                        <p className="text-lg font-bold">{child.gender === 'M' ? 'Masculino' : child.gender === 'F' ? 'Feminino' : child.gender || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Medical Info */}
                    {(child.allergies || child.medications || child.disability) && (
                      <div className="bg-brand-emergency/10 p-4 rounded-2xl border border-brand-emergency/20 space-y-3">
                        <p className="text-[10px] font-bold text-brand-emergency uppercase tracking-widest flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" />
                          Informações Médicas Críticas
                        </p>
                        <div className="space-y-2">
                          {child.allergies && (
                            <div>
                              <p className="text-[10px] font-bold opacity-60 uppercase">Alergias</p>
                              <p className="text-sm font-bold">{child.allergies}</p>
                            </div>
                          )}
                          {child.medications && (
                            <div>
                              <p className="text-[10px] font-bold opacity-60 uppercase">Medicamentos</p>
                              <p className="text-sm font-bold">{child.medications}</p>
                            </div>
                          )}
                          {child.disability && (
                            <div>
                              <p className="text-[10px] font-bold opacity-60 uppercase">Deficiência / Condição</p>
                              <p className="text-sm font-bold">{child.disability}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Características</p>
                      <p className="text-sm leading-relaxed">{child.description || 'Nenhuma descrição fornecida.'}</p>
                    </div>

                    <div className="bg-brand-primary/10 p-4 rounded-2xl border border-brand-primary/20 space-y-2">
                      <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Responsável</p>
                      <div className="flex justify-between items-center">
                        <p className="font-bold">{child.responsibleName}</p>
                        <button 
                          onClick={() => {
                            if (child.responsiblePhone) {
                              window.location.href = `tel:${child.responsiblePhone.replace(/\D/g, '')}`;
                            } else {
                              alert('Telefone do responsável não cadastrado.');
                            }
                          }}
                          className="p-2 bg-brand-primary text-white rounded-lg active:scale-95 transition-transform"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        setChildren(prev => prev.map(c => c.id === child.id ? { ...c, status: 'safe' } : c));
                        setView('dashboard');
                      }}
                      className="btn-mobile btn-success-mobile py-5 font-black uppercase tracking-widest"
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
                        "btn-mobile py-5 font-black uppercase tracking-widest transition-all",
                        isSharing ? "bg-white/20 text-white/40 cursor-wait" : "bg-white/10 text-white border border-white/20 active:bg-white/20"
                      )}
                    >
                      {isSharing ? 'Compartilhando...' : 'Compartilhar com Unidades'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {view === 'citizen_scan' && (
          <motion.div 
            key="citizen-scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col bg-brand-gradient p-8 pt-20 text-white"
          >
            <button onClick={() => { setView('splash'); setScanSuccess(false); }} className="mb-8 text-white"><ChevronLeft className="w-8 h-8" /></button>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-brand-emergency/20 rounded-3xl flex items-center justify-center mx-auto">
                <Search className="w-10 h-10 text-brand-emergency" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Escanear Pulseira</h2>
                <p className="text-white/60">Aproxime a câmera do QR Code na pulseira da criança encontrada.</p>
              </div>
              
              <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-black/40 rounded-[48px] border-2 border-white/10 overflow-hidden flex items-center justify-center">
                {!scanSuccess ? (
                  <>
                    {!isScanning ? (
                      <div className="flex flex-col items-center gap-4 text-center p-6">
                        <Camera className="w-16 h-16 text-brand-secondary opacity-40" />
                        <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Câmera Pronta</p>
                      </div>
                    ) : (
                      <div id="qr-reader" className="w-full h-full" />
                    )}
                  </>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-24 h-24 bg-brand-icon-green rounded-full flex items-center justify-center shadow-2xl">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <p className="font-bold text-brand-icon-green uppercase tracking-widest">Identificado!</p>
                  </motion.div>
                )}
              </div>

              <div className="mt-12 space-y-4">
                {!scanSuccess ? (
                  <button 
                    className="btn-mobile btn-emergency py-5" 
                    onClick={() => setIsScanning(true)}
                    disabled={isScanning}
                  >
                    <Camera className="w-5 h-5" />
                    {isScanning ? 'Escaneando...' : 'Iniciar Scanner'}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-3 text-brand-secondary animate-pulse">
                    <MapPin className="w-5 h-5" />
                    <p className="text-sm font-bold uppercase tracking-widest">Obtendo Localização...</p>
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
            className="flex-1 flex flex-col bg-brand-gradient text-white"
          >
            <div className="p-5 pt-10 flex items-center justify-between bg-transparent border-b border-white/10">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('splash')}><ChevronLeft className="w-6 h-6" /></button>
                <h2 className="text-lg font-bold">Localização</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="relative">
                  <Bell className="w-6 h-6 text-brand-secondary fill-brand-secondary/20" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-emergency rounded-full border-2 border-brand-dark" />
                </button>
                <button><Settings className="w-6 h-6 text-white/40" /></button>
              </div>
            </div>

            <div className="flex-1 relative bg-slate-200">
              {/* Simulated Map */}
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/800/1200')] bg-cover opacity-50" />
              
              {/* Map Pins */}
              <div className="absolute top-1/4 left-1/3"><MapPin className="text-brand-icon-green w-8 h-8 fill-brand-icon-green/20" /></div>
              <div className="absolute top-1/2 left-1/2"><MapPin className="text-brand-pin-yellow w-10 h-10 fill-brand-pin-yellow/20" /></div>
              <div className="absolute bottom-1/3 right-1/4"><MapPin className="text-brand-emergency w-8 h-8 fill-brand-emergency/20" /></div>

              {/* Found Child Card */}
              <div className="absolute bottom-6 left-6 right-6 bg-blue-900/80 backdrop-blur-xl rounded-[32px] p-5 shadow-2xl border border-white/10 space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-2xl text-white font-black">Criança Encontrada!</h3>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-secondary shadow-lg">
                      <img src={scannedChild?.photo || "https://picsum.photos/seed/lucas/200"} alt={scannedChild?.name || "Criança"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-left">
                      <p className="text-xl font-bold text-white">{scannedChild?.name || "Lucas"}, {scannedChild?.age || 6} anos</p>
                      <div className="flex gap-1 text-brand-secondary">
                        {[1,2,3,4,5].map(i => <Heart key={i} className="w-3 h-3 fill-current" />)}
                      </div>
                    </div>
                  </div>
                  {scannedChild && (scannedChild.allergies || scannedChild.medications || scannedChild.disability) && (
                    <div className="bg-brand-emergency/20 p-3 rounded-xl border border-brand-emergency/30 text-left mt-2">
                      <p className="text-[10px] font-bold text-brand-emergency uppercase tracking-widest flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3" />
                        Atenção Médica
                      </p>
                      <p className="text-[10px] text-white/80 line-clamp-2">
                        {[scannedChild.allergies, scannedChild.medications, scannedChild.disability].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button 
                    className="btn-mobile btn-success-mobile"
                    onClick={() => {
                      if (scannedChild?.responsiblePhone) {
                        window.location.href = `tel:${scannedChild.responsiblePhone}`;
                      } else {
                        alert('Telefone do responsável não cadastrado.');
                      }
                    }}
                  >
                    <Phone className="w-5 h-5" />
                    Ligar Responsável
                  </button>
                  <button 
                    className="btn-mobile btn-primary-mobile"
                    onClick={() => {
                      alert('Guarda Municipal acionada! Uma viatura está a caminho da sua localização.');
                    }}
                  >
                    <Shield className="w-5 h-5" />
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
            className="flex-1 flex flex-col bg-brand-gradient p-8 pt-20 text-white"
          >
            <button onClick={() => { setView('dashboard'); setScanSuccess(false); }} className="mb-8 text-white"><ChevronLeft className="w-8 h-8" /></button>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto">
                <QrCode className="w-10 h-10 text-brand-secondary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Vincular Pulseira</h2>
                <p className="text-white/60">
                  {selectedChildId === 'TEMP_REG' 
                    ? 'Escaneie o QR Code da pulseira física para o novo cadastro.' 
                    : `Escaneie o QR Code da pulseira física para registrar ${activeChild.name}.`}
                </p>
              </div>
              
              <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-black/40 rounded-[48px] border-2 border-white/10 overflow-hidden flex items-center justify-center">
                {!scanSuccess ? (
                  <>
                    {!isScanning ? (
                      <div className="flex flex-col items-center gap-4 text-center p-6">
                        <Camera className="w-16 h-16 text-brand-secondary opacity-40" />
                        <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Câmera Pronta</p>
                      </div>
                    ) : (
                      <div id="qr-reader" className="w-full h-full" />
                    )}
                  </>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-24 h-24 bg-brand-icon-green rounded-full flex items-center justify-center shadow-2xl">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <p className="font-bold text-brand-icon-green">PULSEIRA VINCULADA!</p>
                  </motion.div>
                )}
              </div>

              <div className="mt-12 space-y-4">
                {!scanSuccess ? (
                  <button 
                    className="btn-mobile btn-primary-mobile" 
                    onClick={() => setIsScanning(true)}
                    disabled={isScanning}
                  >
                    <Camera className="w-5 h-5" />
                    {isScanning ? 'Escaneando...' : 'Escanear Agora'}
                  </button>
                ) : (
                  <button className="btn-mobile btn-success-mobile" onClick={() => { setView('dashboard'); setScanSuccess(false); }}>
                    Voltar ao Painel
                  </button>
                )}
                <button 
                  className="btn-mobile bg-white/10 text-white border border-white/20"
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
            className="flex-1 flex flex-col bg-brand-gradient p-8 pt-20 text-white"
          >
            <button onClick={() => setView('qr_generator')} className="mb-8 text-white"><ChevronLeft className="w-8 h-8" /></button>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto">
                <QrCode className="w-10 h-10 text-brand-secondary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Código Manual</h2>
                <p className="text-white/60">Digite o código de 8 dígitos impresso na pulseira.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  maxLength={8}
                  placeholder="Ex: ABC12345"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  disabled={isScanning}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-6 px-6 text-center text-3xl font-black tracking-[0.2em] text-white placeholder:text-white/10 focus:outline-none focus:border-brand-secondary transition-colors disabled:opacity-50"
                />
                
                <button 
                  className="btn-mobile btn-primary-mobile py-6"
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
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            className="flex-1 flex flex-col bg-brand-gradient text-white p-5 pt-10"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Configurações de Perfil</h2>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto pb-8">
              {/* Photo Edit */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-brand-secondary shadow-2xl overflow-hidden">
                    <img src={userProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center border-4 border-brand-dark cursor-pointer shadow-lg active:scale-90 transition-transform">
                    <Camera className="w-5 h-5 text-white" />
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
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Toque para alterar foto</p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Nome Exibido</label>
                  <input 
                    type="text" 
                    value={userProfile.name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    value={userProfile.email}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Preferências</h4>
                <div className="space-y-2">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-brand-secondary" />
                      <span className="font-bold text-sm">Notificações Push</span>
                    </div>
                    <div className="w-12 h-6 bg-brand-icon-green rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-brand-primary" />
                      <span className="font-bold text-sm">Localização em Tempo Real</span>
                    </div>
                    <div className="w-12 h-6 bg-brand-icon-green rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  className="btn-mobile btn-primary-mobile shadow-xl py-5"
                  onClick={() => {
                    if (currentUser) {
                      const updatedUser = {
                        ...currentUser,
                        name: userProfile.name,
                        email: userProfile.email,
                        photo: userProfile.photo
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
                  className="w-full py-4 text-brand-emergency font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-white/5 rounded-2xl border border-white/10 active:bg-white/10 transition-colors"
                  onClick={() => {
                    setCurrentUser(null);
                    setRole(null);
                    setLoginForm({ email: '', password: '' });
                    setView('selection');
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
                </button>
                <button 
                  className="w-full py-4 text-white/20 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-brand-emergency transition-colors"
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
            </div>
          </motion.div>
        )}

        {view === 'notifications' && (
          <motion.div 
            key="notifications"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white p-6 pt-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Notificações</h2>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pb-8">
              <div className="bg-white/10 p-5 rounded-3xl border border-brand-icon-green/30 flex gap-4">
                <div className="w-12 h-12 bg-brand-icon-green/20 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-brand-icon-green" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">Criança Encontrada!</h4>
                    <span className="text-[10px] opacity-40">10 min</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    A Guarda Municipal localizou <span className="font-bold text-white">Lucas</span> no Ponto de Apoio 03. Ele está seguro e aguardando você.
                  </p>
                  <button className="text-brand-secondary text-[10px] font-black uppercase tracking-widest mt-2">Ver Localização</button>
                </div>
              </div>

              <div className="bg-white/5 p-5 rounded-3xl border border-white/10 flex gap-4 opacity-60">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">Alerta de Segurança</h4>
                    <span className="text-[10px] opacity-40">1h</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    O Modo Evento foi ativado para a região do Parque Ibirapuera. Fique atento às notificações.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 p-5 rounded-3xl border border-white/10 flex gap-4 opacity-60">
                <div className="w-12 h-12 bg-brand-secondary/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Bell className="w-6 h-6 text-brand-secondary" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">Bem-vindo ao Achei Você</h4>
                    <span className="text-[10px] opacity-40">2h</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Seu cadastro foi concluído com sucesso. Não esqueça de vincular a pulseira da sua criança.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bottom Nav inside notifications too for consistency */}
            <div className="glass-nav p-4 flex justify-around items-center -mx-6 -mb-6">
              <button onClick={() => setView('dashboard')} className="text-white/40"><MapIcon className="w-6 h-6" /></button>
              <button onClick={() => setView('notifications')} className="text-white"><Bell className="w-6 h-6" /></button>
              <button 
                onClick={() => setView('register_child')}
                className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center -mt-12 shadow-2xl border-4 border-brand-dark"
              >
                <Plus className="text-white w-8 h-8" />
              </button>
              <button className="text-white/40"><History className="w-6 h-6" /></button>
              <button onClick={() => setView('settings')} className="text-white/40"><UserIcon className="w-6 h-6" /></button>
            </div>
          </motion.div>
        )}

        {view === 'child_details' && selectedChildId && (
          <motion.div 
            key="child-details"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col bg-brand-gradient text-white p-5 pt-10"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Perfil da Criança</h2>
            </div>

            {(() => {
              const child = children.find(c => c.id === selectedChildId);
              if (!child) return null;

              return (
                <div className="flex-1 space-y-8 overflow-y-auto pb-8">
                  {/* Status Toggle */}
                  <div className={cn(
                    "p-5 rounded-[32px] border flex items-center justify-between transition-colors",
                    child.status === 'safe' ? "bg-brand-icon-green/10 border-brand-icon-green/20" : "bg-brand-emergency/10 border-brand-emergency/20"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                        child.status === 'safe' ? "bg-brand-icon-green" : "bg-brand-emergency"
                      )}>
                        {child.status === 'safe' ? <CheckCircle2 className="w-6 h-6 text-white" /> : <AlertTriangle className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Status Atual</p>
                        <h4 className="text-lg font-bold">{child.status === 'safe' ? 'Seguro' : 'Desaparecido'}</h4>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setChildren(prev => prev.map(c => c.id === child.id ? { ...c, status: c.status === 'safe' ? 'missing' : 'safe' } : c));
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95",
                        child.status === 'safe' ? "bg-brand-emergency border-brand-emergency text-white" : "bg-brand-icon-green border-brand-icon-green text-white"
                      )}
                    >
                      Alterar para {child.status === 'safe' ? 'Desaparecido' : 'Seguro'}
                    </button>
                  </div>

                  {/* Profile Edit */}
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-[32px] border-4 border-brand-secondary shadow-2xl overflow-hidden">
                          <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" />
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center border-4 border-brand-dark cursor-pointer shadow-lg active:scale-90 transition-transform">
                          <Camera className="w-5 h-5 text-white" />
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

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Nome da Criança</label>
                        <input 
                          type="text" 
                          value={child.name}
                          onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, name: e.target.value } : c))}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-secondary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Idade</label>
                        <input 
                          type="number" 
                          value={child.age}
                          onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, age: parseInt(e.target.value) || 0 } : c))}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-secondary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Sexo</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['M', 'F', 'Outro'].map((g) => (
                            <button
                              key={g}
                              onClick={() => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, gender: g as any } : c))}
                              className={cn(
                                "py-3 rounded-2xl border font-bold text-sm transition-all",
                                child.gender === g 
                                  ? "bg-brand-secondary border-brand-secondary text-brand-dark" 
                                  : "bg-white/5 border-white/10 text-white/60"
                              )}
                            >
                              {g === 'M' ? 'Masculino' : g === 'F' ? 'Feminino' : 'Outro'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Alergias</label>
                        <input 
                          type="text" 
                          value={child.allergies || ''}
                          onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, allergies: e.target.value } : c))}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-secondary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Uso de Medicamentos</label>
                        <input 
                          type="text" 
                          value={child.medications || ''}
                          onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, medications: e.target.value } : c))}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-secondary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Deficiência / Condição Especial</label>
                        <input 
                          type="text" 
                          value={child.disability || ''}
                          onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, disability: e.target.value } : c))}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-secondary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Descrição / Características</label>
                        <textarea 
                          value={child.description}
                          onChange={(e) => setChildren(prev => prev.map(c => c.id === child.id ? { ...c, description: e.target.value } : c))}
                          rows={3}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand-secondary transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">QR Code da Pulseira</h4>
                    {!child.qrCode ? (
                      <button 
                        onClick={() => {
                          setSelectedChildId(child.id);
                          setView('qr_generator');
                          setScanSuccess(false);
                          setIsScanning(false);
                        }}
                        className="w-full py-10 bg-white/5 border-2 border-dashed border-white/20 rounded-[40px] flex flex-col items-center gap-4 active:bg-white/10 transition-all"
                      >
                        <div className="w-16 h-16 bg-brand-secondary/20 rounded-3xl flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-brand-secondary" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-lg">Vincular Pulseira</p>
                          <p className="text-xs opacity-40 uppercase tracking-widest">Nenhum código registrado ainda</p>
                        </div>
                      </button>
                    ) : (
                      <div className="bg-white p-6 rounded-[40px] flex flex-col items-center gap-4 shadow-2xl">
                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                          <QRCode value={child.qrCode} size={180} />
                        </div>
                        <div className="text-center">
                          <p className="text-slate-900 font-black tracking-widest text-lg uppercase">ID: {child.qrCode.toUpperCase()}</p>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Válido em todo território nacional</p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedChildId(child.id);
                            setView('qr_generator');
                            setScanSuccess(false);
                            setIsScanning(false);
                          }}
                          className="w-full py-3 bg-brand-primary/10 text-brand-primary rounded-2xl font-bold text-xs uppercase tracking-widest border border-brand-primary/20 flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Vincular Nova Pulseira
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 space-y-4">
                    <button 
                      className="btn-mobile btn-primary-mobile shadow-xl py-5"
                      onClick={() => setView('dashboard')}
                    >
                      Salvar Alterações
                    </button>
                    <button 
                      className="w-full py-4 text-brand-emergency font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-white/5 rounded-2xl border border-white/10 active:bg-white/10 transition-colors"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja remover ${child.name}?`)) {
                          setChildren(prev => prev.filter(c => c.id !== child.id));
                          setView('dashboard');
                        }
                      }}
                    >
                      <X className="w-5 h-5" />
                      Remover Criança
                    </button>
                  </div>
                </div>
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
            className="flex-1 flex flex-col bg-brand-gradient text-white p-5 pt-10"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Cadastrar Criança</h2>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[32px] border-4 border-brand-secondary shadow-2xl overflow-hidden bg-white/10 flex items-center justify-center">
                    {newChild.photo ? (
                      <img src={newChild.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-12 h-12 text-white/20" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center border-4 border-brand-dark cursor-pointer shadow-lg active:scale-90 transition-transform">
                    <Camera className="w-5 h-5 text-white" />
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
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Foto da Criança</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Nome da Criança</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Maria Clara"
                    value={newChild.name}
                    onChange={(e) => setNewChild(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Idade</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 5"
                    value={newChild.age}
                    onChange={(e) => setNewChild(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Sexo</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['M', 'F', 'Outro'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setNewChild(prev => ({ ...prev, gender: g as any }))}
                        className={cn(
                          "py-3 rounded-2xl border font-bold text-sm transition-all",
                          newChild.gender === g 
                            ? "bg-brand-secondary border-brand-secondary text-brand-dark" 
                            : "bg-white/5 border-white/10 text-white/60"
                        )}
                      >
                        {g === 'M' ? 'Masculino' : g === 'F' ? 'Feminino' : 'Outro'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Alergias</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Amendoim, lactose..."
                    value={newChild.allergies}
                    onChange={(e) => setNewChild(prev => ({ ...prev, allergies: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Uso de Medicamentos</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Insulina, antialérgico..."
                    value={newChild.medications}
                    onChange={(e) => setNewChild(prev => ({ ...prev, medications: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Deficiência / Condição Especial</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Autismo, cadeirante..."
                    value={newChild.disability}
                    onChange={(e) => setNewChild(prev => ({ ...prev, disability: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-widest">Descrição / Características</label>
                  <textarea 
                    placeholder="Ex: Cabelo castanho, camiseta rosa..."
                    rows={3}
                    value={newChild.description}
                    onChange={(e) => setNewChild(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors resize-none"
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Pulseira da Criança</h4>
                  {!newChild.qrCode ? (
                    <div className="space-y-4">
                      <button 
                        onClick={() => {
                          setSelectedChildId('TEMP_REG'); 
                          setView('qr_generator');
                          setScanSuccess(false);
                          setIsScanning(false);
                        }}
                        className="w-full py-6 bg-white/5 border-2 border-dashed border-white/20 rounded-[32px] flex flex-col items-center gap-3 active:bg-white/10 transition-all"
                      >
                        <div className="w-12 h-12 bg-brand-secondary/20 rounded-2xl flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-brand-secondary" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm">Vincular Pulseira Agora</p>
                          <p className="text-[10px] opacity-40 uppercase tracking-widest">Escaneie o QR Code oficial</p>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-brand-icon-green/10 border border-brand-icon-green/20 p-6 rounded-[32px] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-icon-green rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-brand-icon-green uppercase tracking-widest">Pulseira Vinculada</p>
                          <p className="font-bold text-white tracking-widest">{newChild.qrCode.toUpperCase()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setNewChild(prev => ({ ...prev, qrCode: '' }))}
                        className="p-2 bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  className="btn-mobile btn-primary-mobile shadow-xl py-5"
                  disabled={!newChild.name || !newChild.age}
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
                      responsiblePhone: '(11) 99999-9999',
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
                      qrCode: ''
                    });
                    setView('dashboard');
                  }}
                >
                  Salvar Cadastro
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'emergency' && (
          <motion.div 
            key="emergency"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "flex-1 flex flex-col p-8 pt-20 text-white",
              emergencyStep === 'select' ? "bg-brand-gradient" : "bg-brand-emergency"
            )}
          >
            <button onClick={() => setView('dashboard')} className="text-white mb-8"><ChevronLeft className="w-8 h-8" /></button>
            
            {emergencyStep === 'select' ? (
              <div className="flex-1 flex flex-col gap-8">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-brand-emergency/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-10 h-10 text-brand-emergency" />
                  </div>
                  <h2 className="text-3xl font-black">QUAL CRIANÇA?</h2>
                  <p className="text-white/60">Selecione quem está desaparecido para acionar o alerta.</p>
                </div>

                <div className="space-y-4">
                  {children.filter(c => c.responsibleId === currentUser?.id).map(child => (
                    <button 
                      key={child.id}
                      onClick={() => {
                        setEmergencyChildId(child.id);
                        setEmergencyStep('alert');
                        setChildren(prev => prev.map(c => c.id === child.id ? { ...c, status: 'missing' } : c));
                      }}
                      className="w-full bg-white/10 p-4 rounded-3xl border border-white/20 flex items-center gap-4 text-left active:scale-95 transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20">
                        <img src={child.photo || `https://picsum.photos/seed/${child.name}/200`} alt={child.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold">{child.name}</h4>
                        <p className="text-xs opacity-60 uppercase tracking-widest">{child.age} anos</p>
                      </div>
                      <div className="w-10 h-10 bg-brand-emergency rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setView('dashboard')}
                  className="mt-auto w-full py-4 text-white/60 font-bold uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-16 h-16" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase">Alerta Ativado</h2>
                  <p className="text-red-100">
                    As autoridades e pontos de apoio próximos foram notificados sobre o desaparecimento de <span className="font-black underline">{children.find(c => c.id === emergencyChildId)?.name}</span>.
                  </p>
                </div>
                
                <div className="w-full space-y-4 mt-8">
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                    <p className="text-sm font-bold uppercase tracking-widest opacity-60">Status da Busca</p>
                    <p className="text-xl font-bold mt-1">Guarda Municipal Acionada</p>
                    <p className="text-sm opacity-80">Viatura a caminho da sua localização.</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (emergencyChildId) {
                        setChildren(prev => prev.map(c => c.id === emergencyChildId ? { ...c, status: 'safe' } : c));
                      }
                      setView('dashboard');
                    }}
                    className="btn-mobile bg-white text-brand-emergency font-black"
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
      className="w-full bg-white/10 p-4 rounded-2xl border border-white/20 card-shadow flex items-center justify-between group active:bg-white/20 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shadow-inner">
          {icon}
        </div>
        <span className="font-bold text-white tracking-wide">{title}</span>
      </div>
      <Plus className="w-5 h-5 text-white/40 group-hover:text-brand-secondary transition-colors" />
    </button>
  );
}
