import React, { useEffect, useState, useRef } from 'react';
import { Bell, Menu, Eye, ShoppingBag } from 'lucide-react';
import { appointmentService } from '../../features/services/appointments/services/appointmentService';
import { ordersService } from '../../features/sales/orders/services/ordersService';
import { useNavigate } from 'react-router-dom';
import icono1 from '../../assets/icono1.png'; // ? NUEVO: import del logo
import { useCurrentUser } from "/src/shared/context/UserContext";
import { apiClient } from '../../shared/utils/apiClient';

export const Header = ({ onMenuClick }) => {
  const { currentUser } = useCurrentUser();
  const user = currentUser || { nombre: 'Usuario', rol: 'Invitado' };
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const mounted = useRef(false);
  const isNotificationsLoadingRef = useRef(false);

  const getAppointmentsRoute = (role) => {
    if (!role) return '/citas';
    const r = role.toLowerCase();
    if (r.includes('administrador')) return '/admin/citas';
    if (r.includes('emple')) return '/employee/citas';
    if (r.includes('cliente')) return '/client/mis-citas';
    return '/citas';
  };

  useEffect(() => {
    let isMounted = true;

    const loadVencimientos = async () => {
      try {
        const token = sessionStorage.getItem("syspharma_token");

        const res = await apiClient.get("/api/Producto/proximos-a-vencer");
        const data = Array.isArray(res.data) ? res.data : [];
        return data.map(p => ({
          id: `venc-${p.id}`,
          tipo: "vencimiento",
          titulo: `⚠️ ${p.nombre}`,
          descripcion: `Vence en ${p.diasRestantes} día(s) — Stock: ${p.stock}`,
          fechaCreacion: new Date().toISOString(),
        }));
      } catch (err) {
        console.error("Error vencimientos:", err); // ✅ Log
        return [];
      }
    };

    const loadNotifications = async () => {
      if (isNotificationsLoadingRef.current) return;
      isNotificationsLoadingRef.current = true;

      try {
        const lastSeen = localStorage.getItem('lastSeenNotificationsAt');
        
        // Cargar citas
        const allAppointments = await appointmentService.getAppointments();
        const newAppointments = allAppointments
          .filter((a) => {
            if (!a.fechaCreacion) return false;
            if (!lastSeen) return true;
            try {
              return new Date(a.fechaCreacion) > new Date(lastSeen);
            } catch (e) {
              return true;
            }
          })
          .map(a => ({
            ...a,
            tipo: 'cita',
            titulo: `Nueva cita: ${a.paciente}`,
            descripcion: `${a.servicio} - ${a.fecha} ${a.hora || ''}`
          }));

        // Cargar pedidos
        const allOrders = await ordersService.getAll();
        const newOrders = allOrders
          .filter((o) => {
            if (!o.fechaCreacion) return false;
            if (!lastSeen) return true;
            try {
              return new Date(o.fechaCreacion) > new Date(lastSeen);
            } catch (e) {
              return true;
            }
          })
          .map(o => ({
            ...o,
            tipo: 'pedido',
            titulo: `Nuevo pedido: ${o.clienteNombre}`,
            descripcion: `Total: $${o.total?.toLocaleString() || '0'}`
          }));

        // Cargar vencimientos
        const vencimientos = await loadVencimientos();

        // Combinar y ordenar por fecha
        const combined = [...newAppointments, ...newOrders, ...vencimientos]
          .sort((a, b) => {
            const dateA = new Date(a.fechaCreacion || 0);
            const dateB = new Date(b.fechaCreacion || 0);
            return dateB - dateA;
          });

        if (isMounted) {
          setNotifications(combined);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        if (isMounted) {
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          isNotificationsLoadingRef.current = false;
        }
      }
    };

    loadNotifications();

    // Función que recarga con delay para permitir actualización de BD
    const onChangeWithDelay = () => {
      setTimeout(loadNotifications, 500);
    };
    
    window.addEventListener('appointments:changed', onChangeWithDelay);
    window.addEventListener('syspharma_orders_updated', onChangeWithDelay);
    window.addEventListener('sales:changed', onChangeWithDelay);
    
    return () => {
      isMounted = false;
      isNotificationsLoadingRef.current = false;
      window.removeEventListener('appointments:changed', onChangeWithDelay);
      window.removeEventListener('syspharma_orders_updated', onChangeWithDelay);
      window.removeEventListener('sales:changed', onChangeWithDelay);
    };
  }, []);

  return (
    <header className="h-14 bg-primary-600 border-b border-primary-700 flex items-center justify-between px-3 sm:px-5 shadow-md z-20 text-white flex-shrink-0">
      
      {/* IZQUIERDA: Botón Menú y Logo */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        
        <button 
          onClick={onMenuClick} 
          className="lg:hidden text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition flex-shrink-0"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        
        {/* LOGO SYSPHARMA - SOLO ESTO CAMBIÓ */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-0.5 flex-shrink-0">
            <img 
              src={icono1}
              alt="SysPharma Logo" 
              className="w-8 h-8 object-contain rounded-full"
            />
          </div>
          <div className="hidden xs:block min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-wide leading-none truncate">SysPharma</h1>
            <p className="text-[8px] sm:text-[9px] text-primary-100 uppercase tracking-wider font-medium opacity-80">
              Panel
            </p>
          </div>
        </div>
      </div>

      {/* DERECHA - SIN CAMBIOS */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => {
              const opening = !open;
              if (opening && notifications.length > 0 && "Notification" in window) {
                Notification.requestPermission().then((perm) => {
                  if (perm === 'granted') {
                    notifications.forEach((n) => {
                      if (n.tipo === 'cita') {
                        const title = `Nueva cita: ${n.paciente}`;
                        const body = `${n.servicio} - ${n.fecha} ${n.hora || ''}`;
                        try { new Notification(title, { body }); } catch (e) {}
                      } else if (n.tipo === 'pedido') {
                        const title = `Nuevo pedido: ${n.clienteNombre}`;
                        const body = `Total: $${n.total?.toLocaleString() || '0'}`;
                        try { new Notification(title, { body }); } catch (e) {}
                      }
                    });
                  }
                });
              }
              setOpen((v) => !v);
            }}
            className="relative text-primary-100 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            aria-label="Notificaciones"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-4 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border border-primary-600">{notifications.length}</span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-100 z-50">
              <div className="p-2 border-b flex items-center justify-between">
                <strong className="text-sm">Notificaciones</strong>
                <button
                  onClick={() => { 
                    localStorage.setItem('lastSeenNotificationsAt', new Date().toISOString());
                    setNotifications([]);
                    setOpen(false);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2"
                >Marcar como visto</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No hay notificaciones</div>
                ) : (
                  notifications.map((n) => (
                    <div key={`${n.tipo}-${n.id}`} className={`p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-2 ${
                      n.tipo === 'pedido' ? 'bg-blue-50' : n.tipo === 'vencimiento' ? 'bg-yellow-50' : ''
                    }`}>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-800 truncate flex items-center gap-1">
                          {n.tipo === 'pedido' && <ShoppingBag size={14} className="text-blue-600 flex-shrink-0" />}
                          {n.tipo === 'vencimiento' && <span className="text-yellow-600 flex-shrink-0">⚠️</span>}
                          {n.tipo === 'cita' ? n.paciente : n.clienteNombre || n.titulo}
                        </div>
                        <div className={`text-xs mt-0.5 ${n.tipo === 'vencimiento' ? 'text-yellow-700' : 'text-gray-500'}`}>
                          {n.tipo === 'cita' 
                            ? `${n.servicio} • ${n.fecha} ${n.hora || ''}`
                            : n.tipo === 'pedido'
                            ? `Total: $${n.total?.toLocaleString() || '0'} • Estado: ${n.estadoNombre || 'Pendiente'}`
                            : n.descripcion
                          }
                        </div>
                        {n.tipo === 'cita' && <div className="text-[11px] text-gray-400 mt-1">Estado: {n.estado}</div>}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => { 
                            setOpen(false);
                            const route = n.tipo === 'cita' 
                              ? getAppointmentsRoute(user.rol)
                              : '/admin/productos'; // Para pedidos y vencimientos, vamos a la lista de productos
                            navigate(route);
                          }} 
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                          title="Ver"
                        > 
                          <Eye size={14} /> 
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-6 w-[1px] bg-primary-500 hidden sm:block"></div>

        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none group-hover:opacity-90 truncate">{user.nombre}</p>
            <p className="text-[10px] text-primary-100 font-medium uppercase mt-0.5">{user.rol}</p>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white text-primary-600 rounded-full flex items-center justify-center font-bold border-2 border-primary-200 shadow-sm text-xs flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.nombre} className="w-full h-full rounded-full object-cover border-2 border-primary-200 shadow-sm" />
            ) : (
              <div className="w-full h-full bg-white text-primary-600 rounded-full flex items-center justify-center font-bold">
                {user.nombre?.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};