import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';

export const DoctorScheduleModal = ({ isOpen, onClose, doctor, onSave }) => {
  const [formData, setFormData] = useState({ horaInicio: '', horaFin: '', diasLaborales: [] });

  useEffect(() => {
    if (doctor) setFormData(doctor);
  }, [doctor, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayIndex) => {
    const currentDays = formData.diasLaborales || [];
    if (currentDays.includes(dayIndex)) {
      setFormData({ ...formData, diasLaborales: currentDays.filter(d => d !== dayIndex) });
    } else {
      setFormData({ ...formData, diasLaborales: [...currentDays, dayIndex] });
    }
  };

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fade-in-up flex flex-col">
        
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-sm font-bold text-gray-800">Configurar Horario</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-red-500" /></button>
        </div>

        <div className="p-5 space-y-4">
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
              {doctor?.nombre.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm text-gray-800">{doctor?.nombre}</p>
              <p className="text-xs text-gray-500">{doctor?.especialidad}</p>
            </div>
          </div>

          {/* Rango de Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Entrada</label>
              <div className="relative">
                <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input type="time" value={formData.horaInicio} onChange={e => setFormData({...formData, horaInicio: e.target.value})} className="w-full pl-8 pr-2 py-1.5 border rounded-lg text-xs outline-none focus:border-primary-400" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Salida</label>
              <div className="relative">
                <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input type="time" value={formData.horaFin} onChange={e => setFormData({...formData, horaFin: e.target.value})} className="w-full pl-8 pr-2 py-1.5 border rounded-lg text-xs outline-none focus:border-primary-400" />
              </div>
            </div>
          </div>

          {/* Días Laborales */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-2 uppercase flex items-center gap-1">
              <Calendar size={12}/> Días Laborales
            </label>
            <div className="flex justify-between gap-1">
              {days.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx)}
                  className={`w-8 h-8 rounded-full text-[10px] font-bold transition-all ${
                    formData.diasLaborales?.includes(idx) 
                    ? 'bg-primary-500 text-white shadow-md scale-105' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {day.charAt(0)}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => { onSave(formData); onClose(); }}
            className="w-full bg-[#34D399] hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg shadow-sm text-xs mt-2 transition-all"
          >
            Guardar Configuración
          </button>

        </div>
      </div>
    </div>
  );
};