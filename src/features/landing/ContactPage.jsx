import React from 'react';
import { PublicLayout } from './PublicLayout';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const ContactPage = () => {
  return (
    <PublicLayout>
      <div className="flex-1 max-w-5xl mx-auto px-4 py-4 w-full">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold text-primary-900 mb-4">Contáctanos</h1>
            <p className="text-sm text-gray-600 mb-6">Barrio Galán. Estamos atentos a tus pedidos.</p>

            <div className="space-y-3">
              <ContactItem icon={MapPin} title="Ubicación" text="Calle 10 #27, Barrio Galán" />
              <ContactItem icon={Phone} title="Teléfono" text="313 616 0504" />
              <ContactItem icon={Mail} title="Email" text="farmacenterla10@gmail.com" />
              <ContactItem icon={Clock} title="Horario" text="06:00 AM - 10:00 PM" />
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

const ContactItem = ({ icon: Icon, title, text }) => (
  <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
    <div className="bg-primary-50 p-1.5 rounded text-primary-600">
      <Icon size={16} />
    </div>
    <div>
      <h4 className="font-bold text-xs text-gray-800">{title}</h4>
      <p className="text-xs text-gray-600">{text}</p>
    </div>
  </div>
);