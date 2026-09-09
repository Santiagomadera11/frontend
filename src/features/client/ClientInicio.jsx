import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useEffect, useState } from "react";
import { 
  ShoppingBag, Calendar, Clock, 
  User, ChevronRight, PlusCircle, ArrowRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LS, read } from "../../shared/services/lsService";
import { ordersService } from "../sales/orders/services/ordersService";
import { appointmentService } from "../services/appointments/services/appointmentService";

const ClientInicio = () => {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const loadData = async () => {
      setLoading(true);
      try {
        setUser(currentUser);
        
        // --- LOG DE DIAGNÓSTICO ---
        console.log("DATOS DEL USUARIO LOGUEADO:", currentUser);

        if (currentUser?.email || currentUser?.id) {
          
          // 1. CARGAR PEDIDOS
          const allOrdersRes = await ordersService.getAll();
          const allOrders = Array.isArray(allOrdersRes) ? allOrdersRes : (allOrdersRes.data || []);
          
          console.log("PEDIDOS TOTALES EN EL SERVIDOR:", allOrders);

          const myOrders = allOrders.filter(o => {
            const matchId = o.usuarioId && Number(o.usuarioId) === Number(currentUser.id);
            const matchEmail = (o.clienteEmail || "").toLowerCase() === (currentUser.email || "").toLowerCase();
            const matchNombre = (o.clienteNombre || "").toLowerCase().includes((currentUser.nombre || "").toLowerCase());
            return matchId || matchEmail || matchNombre;
          }).sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
          
          console.log("PEDIDOS FILTRADOS PARA ESTE CLIENTE:", myOrders);
          setOrders(myOrders);

          // 2. CARGAR CITAS
          const allApptsRes = await appointmentService.getAppointments();
          const allAppts = Array.isArray(allApptsRes) ? allApptsRes : (allApptsRes.data || []);
          
          const myAppts = allAppts.filter(a => {
            const matchId = (a.usuarioId || a.userId) && Number(a.usuarioId || a.userId) === Number(currentUser.id);
            const matchEmail = (a.pacienteEmail || a.email || "").toLowerCase() === (currentUser.email || "").toLowerCase();
            return matchId || matchEmail;
          }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

          setAppointments(myAppts);
        }
      } catch (err) {
        console.error("ERROR CARGANDO DATOS:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¡Buenas días";
    if (hour < 18) return "¡Buenas tardes";
    return "¡Buenas noches";
  };

  const nextAppt = appointments.find(a => (a.estadoNombre || "").toLowerCase() !== "completada");
  const lastOrder = orders.length > 0 ? orders[0] : null;

  if (loading) return <div className="h-full flex items-center justify-center p-20 text-emerald-600 font-bold">Cargando datos...</div>;

  return (
    <div className="h-full bg-[#f8fafc] font-sans p-6 space-y-6">
      
      {/* 1. BANNER PRINCIPAL */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">
              {getGreeting()}, {user?.nombre?.split(' ')[0]}! 👋
            </h1>
            <p className="text-emerald-50 text-sm opacity-90 mt-2 max-w-md">
              Bienvenido a tu panel de salud. Aquí puedes gestionar tus pedidos y citas médicas.
            </p>
          </div>
          <button onClick={() => navigate("/client/mi-perfil")} className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 text-sm font-bold">
            Mi Perfil
          </button>
        </div>
      </div>

      {/* 2. MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Mis Pedidos", value: orders.length, icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Mis Citas", value: appointments.length, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`${item.bg} ${item.color} p-3 rounded-xl`}><item.icon size={22} /></div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-none">{item.value}</p>
              <p className="text-xs text-gray-500 font-bold uppercase mt-1 tracking-tight">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. CONTENIDO CENTRAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          
          {/* PRÓXIMA CITA */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="text-emerald-500" size={18} />
                <h3 className="text-sm font-black text-gray-800 uppercase">Próxima Cita</h3>
              </div>
              <button onClick={() => navigate("/client/mis-citas")} className="text-xs font-bold text-emerald-600">Ver todas</button>
            </div>
            {nextAppt ? (
              <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div>
                  <p className="text-base font-bold text-gray-900">{nextAppt.servicioNombre || "Consulta Médica"}</p>
                  <p className="text-xs text-gray-600">{nextAppt.fecha} • {nextAppt.hora}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">{nextAppt.estadoNombre}</span>
              </div>
            ) : <p className="text-sm text-gray-400 italic text-center py-2">No hay citas próximas.</p>}
          </div>

          {/* ÚLTIMO PEDIDO */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-emerald-500" size={18} />
                <h3 className="text-sm font-black text-gray-800 uppercase">Último Pedido</h3>
              </div>
              <button onClick={() => navigate("/client/mis-pedidos")} className="text-xs font-bold text-emerald-600">Historial</button>
            </div>
            {lastOrder ? (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500"><ShoppingBag size={20} /></div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{lastOrder.numeroPedido}</p>
                    <p className="text-xs text-gray-500">{new Date(lastOrder.fechaCreacion).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-emerald-600">${(lastOrder.total || 0).toLocaleString()}</p>
              </div>
            ) : <p className="text-sm text-gray-400 italic text-center py-2">Sin pedidos recientes.</p>}
          </div>
        </div>

        {/* ACCIONES RÁPIDAS */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Acciones</h4>
          <button onClick={() => navigate("/client/productos")} className="w-full group bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl flex justify-between items-center transition-all">
            <div className="flex items-center gap-3"><PlusCircle size={20} /><span className="text-sm font-bold">Comprar</span></div>
            <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate("/client/mis-citas")} className="w-full group bg-white hover:bg-gray-50 text-gray-800 border p-4 rounded-2xl flex justify-between items-center transition-all shadow-sm">
            <div className="flex items-center gap-3"><Calendar size={20} className="text-purple-500" /><span className="text-sm font-bold">Agendar</span></div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientInicio;