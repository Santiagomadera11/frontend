import React, { useEffect, useState } from "react";
import { Bell, Menu, Stethoscope, Eye, ShoppingBag } from "lucide-react";
import { appointmentService } from "../../features/services/appointments/services/appointmentService";
import { ordersService } from "../../features/sales/orders/services/ordersService";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "/src/shared/context/UserContext";

export const EmployeeHeader = ({ onMenuClick }) => {
  const { currentUser } = useCurrentUser();
  const user = currentUser || { nombre: "Usuario", rol: "Empleado" };
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
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

        // Combinar y ordenar por fecha
        const combined = [...newAppointments, ...newOrders]
          .sort((a, b) => {
            const dateA = new Date(a.fechaCreacion || 0);
            const dateB = new Date(b.fechaCreacion || 0);
            return dateB - dateA;
          });

        setNotifications(combined);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
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
      window.removeEventListener('appointments:changed', onChangeWithDelay);
      window.removeEventListener('syspharma_orders_updated', onChangeWithDelay);
      window.removeEventListener('sales:changed', onChangeWithDelay);
    };
  }, []);

  return (
    <header className="h-14 bg-blue-600 border-b border-blue-700 flex items-center justify-between px-3 sm:px-5 shadow-md z-20 text-white flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition flex-shrink-0"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-white/20 p-1 sm:p-1.5 rounded-lg backdrop-blur-sm flex-shrink-0">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div className="hidden xs:block min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-wide leading-none truncate">
              SysPharma
            </h1>
            <p className="text-[8px] sm:text-[9px] text-blue-100 uppercase tracking-wider font-medium opacity-80">
              Empleado
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => {
              const opening = !open;
              if (opening && notifications.length > 0 && "Notification" in window) {
                Notification.requestPermission().then(perm => {
                  if (perm === 'granted') {
                    notifications.forEach(n => {
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
                })
              }
              setOpen(v => !v);
            }}
            className="relative text-blue-100 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0.5 min-w-[12px] h-3 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border border-blue-600">{notifications.length}</span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-100 z-50">
              <div className="p-2 border-b flex items-center justify-between">
                <strong className="text-sm">Notificaciones</strong>
                <button onClick={() => { localStorage.setItem('lastSeenNotificationsAt', new Date().toISOString()); setNotifications([]); setOpen(false); }} className="text-xs text-gray-500 hover:text-gray-700 px-2">Marcar como visto</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No hay notificaciones</div>
                ) : (
                  notifications.map(n => (
                    <div key={`${n.tipo}-${n.id}`} className={`p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-2 ${n.tipo === 'pedido' ? 'bg-blue-50' : ''}`}>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-800 truncate flex items-center gap-1">
                          {n.tipo === 'pedido' && <ShoppingBag size={14} className="text-blue-600 flex-shrink-0" />}
                          {n.tipo === 'cita' ? n.paciente : n.clienteNombre}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {n.tipo === 'cita' 
                            ? `${n.servicio} • ${n.fecha} ${n.hora || ''}`
                            : `Total: $${n.total?.toLocaleString() || '0'} • Estado: ${n.estadoNombre || 'Pendiente'}`
                          }
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => { setOpen(false); navigate(n.tipo === 'cita' ? '/employee/citas' : '/employee/pedidos'); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Ver"> <Eye size={14} /> </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-blue-500 hidden sm:block"></div>

        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none group-hover:opacity-90 truncate">
              {user.nombre}
            </p>
            <p className="text-[10px] text-blue-100 font-medium uppercase mt-0.5">
              {user.rol}
            </p>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-blue-200 shadow-sm text-xs flex-shrink-0 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white text-blue-600 flex items-center justify-center font-bold">
                {user.nombre?.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
